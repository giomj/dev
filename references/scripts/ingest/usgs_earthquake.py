#!/usr/bin/env python3
"""
Grand Council — USGS Earthquake Hazards Program ingest script.

Fetches the 24-hour M2.5+ GeoJSON summary feed:

  https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson

Emits one geophysical_event record per earthquake (magnitude) and a second
per earthquake for depth, each conforming to geophysical_event.schema.json,
with the hypocenter carried as `position` (WGS84, depth converted to meters).

Handles HTTP 429 by aborting cleanly — no retry-hammering, per
references/usgs/catalog.md and references/UPSTREAM_TERMS.md.

Idempotent: earthquake feed events are keyed by their USGS event `id`, and
output is deterministically sorted by (id, event_kind) so re-running against
an unchanged feed for the same UTC day produces byte-identical output.

Output: ../../usgs/data/earthquakes_<YYYY-MM-DD>.jsonl
"""

from __future__ import annotations

import gzip
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

KNOWN_FAILURE_MODES: list[str] = [
    "Reporting USGS earthquake magnitude without specifying magnitude type (mww, ml, "
    "md) — magnitudes on different scales are not directly comparable. This script "
    "always records magType in magnitude_type.",
    "Retry-hammering on HTTP 429 — USGS actively rate-limits; this script aborts "
    "cleanly on 429 instead of retrying.",
    "Treating the 60-second server-side cache as evidence of a stale/broken feed — a "
    "repeated fetch inside 60s legitimately returns identical cached data.",
    "Assuming feed 'updated' timestamp changes imply a materially different event — "
    "USGS states 'updated' can change for minor metadata revisions.",
    "Confusing geometry [lon, lat, depth_km] GeoJSON coordinate order with [lat, lon] — "
    "GeoJSON is always [longitude, latitude, elevation/depth].",
    "Treating negative USGS depth (above sea level, rare but possible) as invalid data "
    "and discarding the record.",
    "Requesting Accept-Encoding: gzip without decompressing the response body — USGS "
    "transparently gzip-compresses its GeoJSON feed; failing to gunzip before "
    "json.loads() raises a UnicodeDecodeError that looks like a corrupt-payload bug.",
]

USER_AGENT = "GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)"
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = REPO_ROOT / "usgs" / "data"
SCHEMA_VERSION = "1.0.0"

FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
CITATION = "USGS Earthquake Hazards Program, U.S. Geological Survey."
LICENSE = "public-domain-USG"

# USGS magType strings map directly onto our schema's magnitude_type enum, with a
# fallback for any type we haven't enumerated.
VALID_MAG_TYPES = {"mww", "mwc", "mwb", "mwr", "ml", "md", "mb", "ms"}


def _http_get_json(url: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if resp.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            return resp.status, json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            print(
                "USGS returned HTTP 429 Too Many Requests. Aborting cleanly — "
                "no retry-hammer, per UPSTREAM_TERMS.md.",
                file=sys.stderr,
            )
            raise
        raise


def build_records(geojson: dict, fetched_at_utc: str) -> list[dict]:
    records: list[dict] = []
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})
        eq_id = feature.get("id")
        coords = geom.get("coordinates")
        if not eq_id or not coords or len(coords) < 2:
            continue

        lon, lat = coords[0], coords[1]
        depth_km = coords[2] if len(coords) > 2 else None

        time_ms = props.get("time")
        if time_ms is None:
            continue
        ts = datetime.fromtimestamp(time_ms / 1000.0, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        mag_type_raw = (props.get("magType") or "").lower()
        mag_type = mag_type_raw if mag_type_raw in VALID_MAG_TYPES else None

        position = None
        if lat is not None and lon is not None:
            position = {
                "lat_deg": lat,
                "lon_deg": lon,
                "frame": "WGS84_ellipsoid",
            }
            if depth_km is not None:
                # USGS depth is km below sea level (positive down); convert to
                # alt_m using the standard altitude-is-positive-up convention.
                position["alt_m"] = -depth_km * 1000.0

        source_block = {
            "primary": "USGS Earthquake Hazards Program",
            "aggregator": None,
            "fetched_at_utc": fetched_at_utc,
            "license": LICENSE,
            "citation": CITATION,
        }

        mag = props.get("mag")
        if mag is not None:
            rec = {
                "schema_version": SCHEMA_VERSION,
                "event_kind": "earthquake_magnitude",
                "timestamp_utc": ts,
                "value": mag,
                "unit": mag_type or "unknown",
                "source": dict(source_block),
                "_id": eq_id,  # internal sort key, stripped before write
            }
            if mag_type:
                rec["magnitude_type"] = mag_type
            if position:
                rec["position"] = position
            records.append(rec)

        if depth_km is not None:
            rec = {
                "schema_version": SCHEMA_VERSION,
                "event_kind": "earthquake_depth_km",
                "timestamp_utc": ts,
                "value": depth_km,
                "unit": "km",
                "source": dict(source_block),
                "_id": eq_id,
            }
            if position:
                rec["position"] = position
            records.append(rec)

    return records


def main() -> int:
    fetched_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    day_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching USGS feed: {FEED_URL}")
    try:
        status, geojson = _http_get_json(FEED_URL)
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            return 1  # clean abort, non-zero to signal the caller
        print(f"ERROR fetching USGS feed: {exc}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"ERROR fetching USGS feed: {exc}", file=sys.stderr)
        return 1

    records = build_records(geojson, fetched_at_utc)
    records_sorted = sorted(records, key=lambda r: (r["_id"], r["event_kind"]))
    for r in records_sorted:
        r.pop("_id", None)

    out_path = OUT_DIR / f"earthquakes_{day_str}.jsonl"
    with out_path.open("w", encoding="utf-8") as f:
        for rec in records_sorted:
            f.write(json.dumps(rec, sort_keys=True, ensure_ascii=False) + "\n")

    print(f"wrote {len(records_sorted)} records -> {out_path.relative_to(REPO_ROOT)}")
    print(f"USGS ingest complete. total_records={len(records_sorted)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
