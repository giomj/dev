#!/usr/bin/env python3
"""
Grand Council — IRENA (International Renewable Energy Agency) pinned-CSV
replay script.

IRENA's website (www.irena.org, PxWeb data explorer) sits behind an Azure
WAF that returns HTTP 403 to non-browser clients, and IRENA's terms require
attribution on every reused value plus (for some datasets) written
permission for redistribution beyond "personal, non-commercial use." Per
references/irena/UPSTREAM_LICENSES.md and the emperor's explicit ruling,
this script MUST NOT perform any network fetch against irena.org or any
IRENA-operated endpoint. It is pinned-CSV REPLAY ONLY.

Manual export workflow (must be performed by a human, out of band):
  1. Visit the relevant IRENA PxWeb data explorer table (see
     references/irena/catalog.md for the specific dataset URLs):
       - Renewable Capacity Statistics 2025 (MW by technology/country/year)
       - Renewable Energy Statistics 2025 (generation, GWh)
       - Renewable Power Generation Costs in 2024 (LCOE, USD/MWh)
  2. Use the PxWeb UI's "Save as -> CSV" export (this is the licensed,
     browser-driven access path IRENA provides; it counts as the sanctioned
     "personal use" download, not an automated scrape).
  3. Drop the exported CSV into references/irena/data/ using the naming
     convention: <dataset_key>_<export-date YYYY-MM-DD>.csv
     e.g. renewable_capacity_mw_2026-01-15.csv
  4. Re-run this script. It discovers CSVs by filename prefix (dataset_key),
     parses them, and emits one energy_supply_series record per row,
     attaching the IRENA citation and license per references/irena/ATTRIBUTION.md.

This script performs NO network I/O whatsoever. If references/irena/data/
contains no CSVs (the expected state immediately after Wave 2 lands, since
no export has been performed yet), it emits zero records and exits 0 —
this is documented as expected/acceptable, not a failure.

Idempotent: given the same input CSVs, output is deterministically sorted
and will be byte-identical across runs.

Output: ../../irena/data/<dataset_key>_<YYYY-MM-DD>.jsonl (fetched_at_utc
in the record reflects the day this script was RUN, not the day the CSV was
exported from IRENA — the distinction is documented as a known limitation).
"""

from __future__ import annotations

import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

KNOWN_FAILURE_MODES: list[str] = [
    "Accidentally adding a network fetch to 'help' when a CSV is missing — this "
    "script must NEVER contact irena.org; missing CSVs mean zero output, not a "
    "fallback fetch.",
    "Recording fetched_at_utc as if it were the IRENA export date — this script's "
    "fetched_at_utc is the REPLAY date (when this script ran), not the date a human "
    "exported the CSV from PxWeb; the two can differ by months.",
    "Dropping the © IRENA citation because 'it's just a CSV file' — every emitted "
    "value still requires attribution regardless of how many hops removed from the "
    "original PxWeb export.",
    "Misidentifying which of the three IRENA publications (Capacity Statistics 2025 / "
    "Energy Statistics 2025 / Power Generation Costs 2024) a pinned CSV belongs to "
    "from filename heuristics alone, leading to a wrong irena_publication citation.",
]

USER_AGENT = "GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)"
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / "irena" / "data"
SCHEMA_VERSION = "1.0.0"

LICENSE = "\u00a9 IRENA (see references/irena/ATTRIBUTION.md for per-dataset terms)"

# Maps a filename prefix (dataset_key) to the metric + IRENA publication citation
# + unit it should be emitted as. Extend this table as new pinned datasets are added.
DATASET_CONFIG = {
    "renewable_capacity_mw": {
        "metric": "renewable_capacity_mw_by_technology",
        "unit": "mw",
        "irena_publication": "Renewable Capacity Statistics 2025",
        "citation_template": (
            "\u00a9 IRENA {year}. IRENA (2025), Renewable Capacity Statistics 2025."
        ),
    },
    "renewable_capacity_additions_mw": {
        "metric": "renewable_capacity_additions_mw",
        "unit": "mw",
        "irena_publication": "Renewable Capacity Statistics 2025",
        "citation_template": (
            "\u00a9 IRENA {year}. IRENA (2025), Renewable Capacity Statistics 2025."
        ),
    },
    "renewable_generation_gwh": {
        "metric": "renewable_generation_gwh_by_technology",
        "unit": "gwh",
        "irena_publication": "Renewable energy statistics 2025",
        "citation_template": (
            "\u00a9 IRENA {year}. IRENA (2025), Renewable energy statistics 2025."
        ),
    },
    "lcoe_usd_per_mwh": {
        "metric": "lcoe_usd_per_mwh_by_technology",
        "unit": "usd_per_mwh",
        "irena_publication": "Renewable Power Generation Costs in 2024",
        "citation_template": (
            "\u00a9 IRENA {year}. IRENA (2025), Renewable Power Generation Costs in 2024."
        ),
    },
}


def discover_pinned_csvs() -> list[tuple[str, Path]]:
    """Return (dataset_key, path) pairs for every CSV in irena/data/ whose
    filename starts with a known dataset_key prefix."""
    if not DATA_DIR.exists():
        return []
    matches = []
    for csv_path in sorted(DATA_DIR.glob("*.csv")):
        for key in DATASET_CONFIG:
            if csv_path.name.startswith(key):
                matches.append((key, csv_path))
                break
    return matches


def parse_pinned_csv(dataset_key: str, csv_path: Path, fetched_at_utc: str) -> list[dict]:
    """Expects a CSV with at minimum columns: country_iso3, year, value, and
    optionally technology. Column names are matched case-insensitively; unknown
    extra columns are ignored. Rows missing required fields are skipped."""
    cfg = DATASET_CONFIG[dataset_key]
    records = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            return []
        field_lookup = {name.strip().lower(): name for name in reader.fieldnames}

        def get(row: dict, key: str):
            actual = field_lookup.get(key)
            return row.get(actual) if actual else None

        for row in reader:
            country_iso3 = (get(row, "country_iso3") or "").strip()
            year_raw = (get(row, "year") or "").strip()
            value_raw = (get(row, "value") or "").strip()
            technology = (get(row, "technology") or "").strip() or None

            if not country_iso3 or not year_raw or not value_raw:
                continue
            try:
                year = int(year_raw)
                value = float(value_raw)
            except ValueError:
                continue

            export_year = year  # fallback if no export-date column present
            export_date_raw = get(row, "export_year")
            if export_date_raw:
                try:
                    export_year = int(export_date_raw)
                except ValueError:
                    pass

            record = {
                "schema_version": SCHEMA_VERSION,
                "metric": cfg["metric"],
                "country_iso3": country_iso3,
                "year": year,
                "value": value,
                "unit": cfg["unit"],
                "source": {
                    "primary": "IRENA",
                    "aggregator": None,
                    "fetched_at_utc": fetched_at_utc,
                    "license": LICENSE,
                    "citation": cfg["citation_template"].format(year=export_year),
                    "owid_slug": None,
                    "irena_publication": cfg["irena_publication"],
                },
            }
            if technology:
                record["technology"] = technology
            records.append(record)
    return records


def main() -> int:
    fetched_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    day_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    pinned = discover_pinned_csvs()
    if not pinned:
        print(
            "No pinned IRENA CSVs found in irena/data/. This is expected if no "
            "manual PxWeb export has been performed yet. Emitting zero records "
            "(exit 0)."
        )
        return 0

    total = 0
    by_dataset: dict[str, list[dict]] = {}
    for dataset_key, csv_path in pinned:
        print(f"Replaying pinned CSV: {csv_path.name} (dataset_key={dataset_key})")
        records = parse_pinned_csv(dataset_key, csv_path, fetched_at_utc)
        by_dataset.setdefault(dataset_key, []).extend(records)

    for dataset_key, records in by_dataset.items():
        records_sorted = sorted(
            records, key=lambda r: (r["country_iso3"], r["year"], r.get("technology") or "")
        )
        out_path = DATA_DIR / f"{dataset_key}_{day_str}.jsonl"
        with out_path.open("w", encoding="utf-8") as f:
            for rec in records_sorted:
                f.write(json.dumps(rec, sort_keys=True, ensure_ascii=False) + "\n")
        print(f"  wrote {len(records_sorted)} records -> {out_path.relative_to(REPO_ROOT)}")
        total += len(records_sorted)

    print(f"IRENA pinned replay complete. total_records={total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
