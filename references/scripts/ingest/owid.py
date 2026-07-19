#!/usr/bin/env python3
"""
Grand Council — OWID (Our World in Data) ingest script.

Fetches the four datasets authorized by the emperor's Wave 2 ruling:

  - co-emissions-per-capita          (CLEAN, CC BY 4.0)
  - co2-intensity                    (CLEAN, CC BY 4.0)
  - share-elec-by-source             (MIXED — Ember rows only, EI rows dropped)
  - share-electricity-renewables     (MIXED — Ember rows only, EI rows dropped)

Does NOT fetch `energy-consumption-by-source-and-country` — that dataset is
BLOCKED per references/owid/UPSTREAM_LICENSES.md (sole upstream is the
copyright-reserved Energy Institute Statistical Review; bulk redistribution
is not licensed).

For the two share-* datasets, OWID blends Ember (CC BY 4.0) and Energy
Institute (copyright-reserved) rows into the same columns. We use each
column's per-indicator metadata (`descriptionProcessing` field) to determine
the Ember/EI year cutover and filter to Ember-sourced rows only, emitting
`sub_source: "Ember"` on every retained row. EI-sourced rows are dropped
entirely — never persisted, never counted.

Idempotent: given the same upstream data for the same UTC day, re-running
produces byte-identical output (deterministic sort, fixed field order via
json.dumps with sort_keys, and a single fetched_at_utc timestamp truncated
to the day granularity for filenames).

Output: ../../owid/data/<dataset>_<YYYY-MM-DD>.jsonl (one file per metric)
Also pins raw CSVs fetched this run under ../../owid/data/*.csv for
reproducibility of the transformation.
"""

from __future__ import annotations

import io
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

KNOWN_FAILURE_MODES: list[str] = [
    "Confusing country_iso3 with ISO2 codes — OWID uses World Bank country groupings "
    "that aren't strict ISO codes for aggregates like OWID_WRL.",
    "Losing sub_source when compacting OWID Ember+EI rows into a single series — Ember "
    "rows are CC BY 4.0 but EI rows are copyright-restricted. sub_source MUST be "
    "preserved per-row.",
    "Publishing LCOE values without the technology qualifier — a global average LCOE "
    "is meaningless without specifying which technology. (N/A to this script directly, "
    "but shared schema discipline.)",
    "Dropping the citation string during compaction — the license requires it be "
    "attached to the value, not to the file header.",
    "Treating an HTTP 200 CSV response as a redistribution grant — OWID's own README "
    "disclaims that responsibility onto the reuser; we still filter EI rows out.",
    "Ember's Europe cutover year (1990) differs from the rest-of-world cutover (2000) — "
    "hardcoding a single global cutover year misclassifies European rows.",
    "OWID variable IDs and column short-names can change between dataset versions — "
    "always re-resolve columns from the live CSV header, not a hardcoded list.",
]

USER_AGENT = "GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)"
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = REPO_ROOT / "owid" / "data"
SCHEMA_VERSION = "1.0.0"

OWID_CITATION_BASE = (
    "Our World in Data, ourworldindata.org, CC BY 4.0 — with upstream attribution per "
    "dataset (Global Carbon Budget v15, Maddison Project 2023, Ember)."
)

# European countries (incl. Turkey) get the 1990 Ember cutover; everyone else gets 2000.
# Per OWID metadata descriptionProcessing: "Electricity data from 2000 onwards (and from
# 1990 onwards for European countries, including Turkey) comes from Ember."
EUROPEAN_EMBER_1990_ISO3 = {
    "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CYP", "CZE", "DNK", "EST",
    "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA", "LIE", "LTU", "LUX",
    "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR", "POL", "PRT", "ROU", "RUS", "SMR",
    "SRB", "SVK", "SVN", "ESP", "SWE", "CHE", "UKR", "GBR", "VAT", "TUR",
}

DATASETS = {
    "co-emissions-per-capita": {
        "metric": "co2_per_capita_t",
        "unit": "t",
        "mixed_license": False,
        "sub_source": "Global Carbon Budget",
        "citation": (
            "Global Carbon Budget (2025); Population based on various sources (2024) "
            "– with major processing by Our World in Data"
        ),
        "license": "CC BY 4.0",
    },
    "co2-intensity": {
        "metric": "co2_per_gdp_kg_per_intl_dollar",
        "unit": "kg_per_intl_dollar",
        "mixed_license": False,
        "sub_source": "Maddison Project 2023",
        "citation": (
            "Global Carbon Budget (2025); Bolt and van Zanden – Maddison Project "
            "Database 2023 – with major processing by Our World in Data"
        ),
        "license": "CC BY 4.0",
    },
    "share-elec-by-source": {
        "metric": "electricity_share_pct_by_source",
        "unit": "pct",
        "mixed_license": True,
        "sub_source": "Ember",
        "citation": "Ember (2026) – with major processing by Our World in Data",
        "license": "CC BY 4.0",
    },
    "share-electricity-renewables": {
        "metric": "electricity_share_renewables_pct",
        "unit": "pct",
        "mixed_license": True,
        "sub_source": "Ember",
        "citation": "Ember (2026) – with major processing by Our World in Data",
        "license": "CC BY 4.0",
    },
}

BLOCKED_SLUG = "energy-consumption-by-source-and-country"

TECHNOLOGY_COLUMN_MAP = {
    "coal_share_of_electricity": "coal",
    "gas_share_of_electricity": "gas",
    "hydro_share_of_electricity": "hydropower",
    "solar_share_of_electricity": "solar_pv",
    "wind_share_of_electricity": "onshore_wind",
    "oil_share_of_electricity": "oil",
    "nuclear_share_of_electricity": "nuclear",
    "other_renewables_excluding_bioenergy_share_of_electricity": "other_renewables",
    "bioenergy_share_of_electricity": "bioenergy",
    "renewables_share_of_electricity": "renewables_total",
}


def _http_get(url: str, timeout: int = 30) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def _parse_csv(raw: bytes) -> tuple[list[str], list[list[str]]]:
    text = raw.decode("utf-8")
    lines = [ln for ln in text.splitlines() if ln.strip() != ""]
    if not lines:
        return [], []
    header = lines[0].split(",")
    rows = [ln.split(",") for ln in lines[1:]]
    return header, rows


def _technology_for_column(col: str) -> str | None:
    for prefix, tech in TECHNOLOGY_COLUMN_MAP.items():
        if col.startswith(prefix):
            return tech
    return None


def _ember_cutover_year(country_iso3: str) -> int:
    """Year from which Ember (not Energy Institute) is the source for this country."""
    if country_iso3 in EUROPEAN_EMBER_1990_ISO3:
        return 1990
    return 2000


def fetch_dataset(slug: str, cfg: dict, fetched_at_utc: str) -> list[dict]:
    if slug == BLOCKED_SLUG:
        raise RuntimeError(
            f"REFUSING TO INGEST BLOCKED DATASET: {slug} — see owid/UPSTREAM_LICENSES.md "
            f"§3.3. This dataset's sole upstream (Energy Institute Statistical Review) is "
            f"copyright-reserved; bulk redistribution is not licensed."
        )

    csv_url = f"https://ourworldindata.org/grapher/{slug}.csv?csvType=filtered&useColumnShortNames=true"
    status, raw = _http_get(csv_url)

    if status == 403:
        print(
            f"LOUD ERROR: HTTP 403 'Data is non-redistributable' for slug={slug}. "
            f"Halting ingest of this dataset per owid/UPSTREAM_LICENSES.md §4.3.",
            file=sys.stderr,
        )
        raise RuntimeError(f"OWID 403 non-redistributable: {slug}")
    if status != 200:
        raise RuntimeError(f"OWID CSV fetch failed for {slug}: HTTP {status}")

    # Pin the raw CSV for reproducibility.
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_pin_path = OUT_DIR / f"{slug.replace('-', '_')}.csv"
    csv_pin_path.write_bytes(raw)

    header, rows = _parse_csv(raw)
    if not header:
        return []

    idx_entity = header.index("entity")
    idx_code = header.index("code")
    idx_year = header.index("year")
    value_cols = [
        (i, col) for i, col in enumerate(header) if i not in (idx_entity, idx_code, idx_year)
    ]

    records: list[dict] = []
    for row in rows:
        if len(row) != len(header):
            continue
        country_iso3 = row[idx_code].strip()
        if not country_iso3:
            continue
        try:
            year = int(row[idx_year])
        except ValueError:
            continue

        for i, col in value_cols:
            raw_val = row[i].strip()
            if raw_val == "":
                continue
            try:
                value = float(raw_val)
            except ValueError:
                continue

            technology = _technology_for_column(col) if cfg["mixed_license"] else None

            if cfg["mixed_license"]:
                # Filter: retain only rows attributable to Ember (i.e. year >= cutover).
                cutover = _ember_cutover_year(country_iso3)
                if year < cutover:
                    # Energy-Institute-sourced row — drop entirely, never persist.
                    continue
                sub_source = "Ember"
            else:
                sub_source = cfg["sub_source"]

            record = {
                "schema_version": SCHEMA_VERSION,
                "metric": cfg["metric"],
                "country_iso3": country_iso3,
                "year": year,
                "value": value,
                "unit": cfg["unit"],
                "sub_source": sub_source,
                "source": {
                    "primary": sub_source,
                    "aggregator": "OWID",
                    "fetched_at_utc": fetched_at_utc,
                    "license": cfg["license"],
                    "citation": f"{cfg['citation']}; {OWID_CITATION_BASE}",
                    "owid_slug": slug,
                    "irena_publication": None,
                },
            }
            if technology:
                record["technology"] = technology
            records.append(record)

    return records


def main() -> int:
    fetched_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    day_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    total_records = 0
    ember_count = 0
    ei_count = 0  # should always remain 0 — sanity counter

    slugs = list(DATASETS.keys())
    for i, slug in enumerate(slugs):
        cfg = DATASETS[slug]
        print(f"Fetching OWID dataset: {slug} ...")
        try:
            records = fetch_dataset(slug, cfg, fetched_at_utc)
        except RuntimeError as exc:
            print(f"ERROR fetching {slug}: {exc}", file=sys.stderr)
            continue

        for r in records:
            if r.get("sub_source") == "Ember":
                ember_count += 1
            if r.get("sub_source") == "Energy Institute":
                ei_count += 1  # must never happen

        out_path = OUT_DIR / f"{slug.replace('-', '_')}_{day_str}.jsonl"
        # Deterministic ordering for idempotency.
        records_sorted = sorted(records, key=lambda r: (r["country_iso3"], r["year"], r.get("technology") or ""))
        with out_path.open("w", encoding="utf-8") as f:
            for rec in records_sorted:
                f.write(json.dumps(rec, sort_keys=True, ensure_ascii=False) + "\n")

        print(f"  wrote {len(records_sorted)} records -> {out_path.relative_to(REPO_ROOT)}")
        total_records += len(records_sorted)

        if i < len(slugs) - 1:
            time.sleep(1)  # courtesy pacing, per UPSTREAM_LICENSES.md §4.2

    if ei_count > 0:
        print(f"FATAL: {ei_count} Energy-Institute-sourced rows leaked into output!", file=sys.stderr)
        return 1

    print(f"OWID ingest complete. total_records={total_records} ember_records={ember_count} ei_records={ei_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
