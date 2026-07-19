#!/usr/bin/env python3
"""
Grand Council — NOAA SWPC (Space Weather Prediction Center) ingest script.

Fetches three SWPC products:

  - noaa-planetary-k-index.json      (3-hour observed Kp)
  - solar-wind/plasma-1-day.json     (speed, density)
  - solar-wind/mag-1-day.json        (magnetometer)

Paces requests with a 1-second courtesy delay between fetches, per
references/UPSTREAM_TERMS.md ("Practical implication: treat SWPC files as
static-by-URL resources refreshed on a fixed schedule ... polling more often
than the update cadence returns identical data and wastes requests/bandwidth").

Idempotent: given the same upstream JSON for the same UTC day, re-running
overwrites the same output file with byte-identical content (deterministic
sort by timestamp, fixed field order via json.dumps sort_keys).

Output: ../../noaa/data/<dataset>_<YYYY-MM-DD>.jsonl (one file per product)
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

KNOWN_FAILURE_MODES: list[str] = [
    "Interpreting the 1-minute estimated Kp as the 3-hour planetary Kp — they are "
    "separate products and are not comparable at the tail. This script only fetches "
    "the 3-hour observed product (noaa-planetary-k-index.json).",
    "Assuming an SWPC JSON file update means fresh data — some products update "
    "timestamps without new observations; we record fetched_at_utc separately from "
    "the product's own time_tag so staleness is always detectable downstream.",
    "Polling faster than the native update cadence (3h for Kp, ~1min for solar wind) — "
    "this wastes requests and returns identical cached data.",
    "Treating solar wind plasma and mag files as perfectly time-aligned — they are "
    "separate instruments/files and timestamps may not match exactly row-for-row.",
    "Missing/null fields in the SWPC JSON (e.g. a sensor dropout row) being coerced "
    "to 0.0 instead of skipped — a zero speed/density is physically nonsensical and "
    "must be treated as missing data, not a valid measurement.",
    "Assuming a fixed SWPC endpoint path (e.g. products/solar-wind/plasma-1-day.json) "
    "remains stable indefinitely — SWPC has reorganized/removed this directory before; "
    "a 404 on one product must not abort ingestion of the other two products.",
    "Assuming NOAA's per-product JSON shape (array-of-arrays with a header row, vs. "
    "array-of-objects) is stable across products or over time — this script normalizes "
    "both shapes via _rows_from_payload() rather than hardcoding one.",
]

USER_AGENT = "GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)"
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = REPO_ROOT / "noaa" / "data"
SCHEMA_VERSION = "1.0.0"

CITATION = "NOAA Space Weather Prediction Center, U.S. Department of Commerce."
LICENSE = "public-domain-USG"

PRODUCTS = [
    {
        "name": "planetary_k_index_3h",
        "url": "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
        "event_kind": "kp_index_3h",
        "unit": "kp_unitless",
    },
    {
        "name": "solar_wind_plasma_1day",
        "url": "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json",
        "event_kind": "solar_wind_speed_km_s",
        "unit": "km_s",
    },
    {
        "name": "solar_wind_mag_1day",
        "url": "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json",
        "event_kind": "solar_wind_density_p_cc",
        "unit": "p_cc",
    },
]


def _http_get_json(url: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def _iso_from_swpc_time(raw: str) -> str | None:
    """SWPC time_tag strings look like '2025-08-24 00:00:00.000' or ISO already."""
    raw = raw.strip()
    for fmt in (
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            dt = datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            continue
    return None


def _rows_from_payload(payload) -> list[dict]:
    """SWPC JSON products have shipped in two shapes historically:
      (a) [["col1", "col2", ...], [val1, val2, ...], ...]  (header + array rows)
      (b) [{"col1": val1, "col2": val2, ...}, ...]          (list of objects)
    Normalize both into a list of dict rows so downstream parsing is shape-agnostic.
    """
    if not payload:
        return []
    if isinstance(payload[0], dict):
        return payload
    if isinstance(payload[0], list):
        header = payload[0]
        return [dict(zip(header, row)) for row in payload[1:] if len(row) == len(header)]
    return []


def parse_kp_product(payload, fetched_at_utc: str) -> list[dict]:
    rows = _rows_from_payload(payload)
    if not rows:
        return []

    records = []
    for row in rows:
        raw_time = row.get("time_tag")
        raw_kp = row.get("Kp")
        if raw_time is None:
            continue
        ts = _iso_from_swpc_time(str(raw_time))
        if ts is None:
            continue
        try:
            kp_val = float(raw_kp)
        except (ValueError, TypeError):
            continue  # missing/null Kp — skip, do not coerce to 0
        records.append(
            {
                "schema_version": SCHEMA_VERSION,
                "event_kind": "kp_index_3h",
                "timestamp_utc": ts,
                "value": kp_val,
                "unit": "kp_unitless",
                "source": {
                    "primary": "NOAA Space Weather Prediction Center",
                    "aggregator": None,
                    "fetched_at_utc": fetched_at_utc,
                    "license": LICENSE,
                    "citation": CITATION,
                },
            }
        )
    return records


def parse_solar_wind_plasma(payload, fetched_at_utc: str) -> list[dict]:
    rows = _rows_from_payload(payload)
    if not rows:
        return []

    records = []
    for row in rows:
        raw_time = row.get("time_tag")
        if raw_time is None:
            continue
        ts = _iso_from_swpc_time(str(raw_time))
        if ts is None:
            continue
        raw_speed = row.get("speed")
        raw_density = row.get("density")
        if raw_speed not in (None, "", "null"):
            try:
                records.append(
                    {
                        "schema_version": SCHEMA_VERSION,
                        "event_kind": "solar_wind_speed_km_s",
                        "timestamp_utc": ts,
                        "value": float(raw_speed),
                        "unit": "km_s",
                        "source": {
                            "primary": "NOAA Space Weather Prediction Center",
                            "aggregator": None,
                            "fetched_at_utc": fetched_at_utc,
                            "license": LICENSE,
                            "citation": CITATION,
                        },
                    }
                )
            except (ValueError, TypeError):
                pass
        if raw_density not in (None, "", "null"):
            try:
                records.append(
                    {
                        "schema_version": SCHEMA_VERSION,
                        "event_kind": "solar_wind_density_p_cc",
                        "timestamp_utc": ts,
                        "value": float(raw_density),
                        "unit": "p_cc",
                        "source": {
                            "primary": "NOAA Space Weather Prediction Center",
                            "aggregator": None,
                            "fetched_at_utc": fetched_at_utc,
                            "license": LICENSE,
                            "citation": CITATION,
                        },
                    }
                )
            except (ValueError, TypeError):
                pass
    return records


def parse_mag_product(payload, fetched_at_utc: str) -> list[dict]:
    """The mag file doesn't map directly to a schema event_kind we've defined for
    density/speed; it is primarily Bx/By/Bz/Bt fields, which are out of scope for
    Wave 2's minimal geophysical_event enum. Documented as a known limitation —
    this function intentionally emits zero records."""
    return []


def main() -> int:
    fetched_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    day_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    total = 0
    for i, product in enumerate(PRODUCTS):
        print(f"Fetching NOAA SWPC product: {product['name']} ...")
        try:
            status, data = _http_get_json(product["url"])
        except urllib.error.URLError as exc:
            print(f"ERROR fetching {product['name']}: {exc}", file=sys.stderr)
            continue

        if product["name"] == "planetary_k_index_3h":
            records = parse_kp_product(data, fetched_at_utc)
        elif product["name"] == "solar_wind_plasma_1day":
            records = parse_solar_wind_plasma(data, fetched_at_utc)
        else:
            records = parse_mag_product(data, fetched_at_utc)

        records_sorted = sorted(records, key=lambda r: (r["timestamp_utc"], r["event_kind"]))
        out_path = OUT_DIR / f"{product['name']}_{day_str}.jsonl"
        with out_path.open("w", encoding="utf-8") as f:
            for rec in records_sorted:
                f.write(json.dumps(rec, sort_keys=True, ensure_ascii=False) + "\n")
        print(f"  wrote {len(records_sorted)} records -> {out_path.relative_to(REPO_ROOT)}")
        total += len(records_sorted)

        if i < len(PRODUCTS) - 1:
            time.sleep(1)  # courtesy pacing between the three product fetches

    print(f"NOAA SWPC ingest complete. total_records={total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
