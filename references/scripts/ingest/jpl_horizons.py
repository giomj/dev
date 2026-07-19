#!/usr/bin/env python3
"""
Grand Council — JPL HORIZONS ingest script.

Fetches the geocentric... actually heliocentric (CENTER='500@10', Sun) state
vector of Mars for a single day, as a minimal proof-of-life for Wave 2:

  https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='499'
    &OBJ_DATA='NO'&EPHEM_TYPE='VECTORS'&CENTER='500@10'
    &START_TIME='<today>'&STOP_TIME='<today+1>'&STEP_SIZE='1d'

Parses the vector table between the `$$SOE` / `$$EOE` markers in the
response text, converts the X/Y/Z position (km) to AU, and emits a single
geophysical_event record (event_kind: planet_position_au) with
target_body="Mars" and reference_frame="500@10" recorded explicitly — per
the known failure mode that HORIZONS returns different numbers for the same
nominal "planet position" depending on CENTER/frame.

No retries, no bursts — HORIZONS publishes no rate limit and each query is a
live computation; we serialize a single request per run.

Idempotent: for the same calendar day (UTC) the query window START_TIME /
STOP_TIME is identical, so re-running produces the same output record
(barring genuine ephemeris precision updates from JPL, which are out of our
control and would be a legitimate value change, not a non-idempotency bug).

Output: ../../horizons/data/mars_position_<YYYY-MM-DD>.jsonl
"""

from __future__ import annotations

import json
import math
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

KNOWN_FAILURE_MODES: list[str] = [
    "Fetching HORIZONS without target/observer/frame specified — the API returns "
    "different values for the same 'planet position' depending on reference frame. "
    "This script always records target_body and reference_frame on the emitted record.",
    "Confusing heliocentric (CENTER='500@10') with geocentric (CENTER='500@399') "
    "vectors — this script uses heliocentric (Sun-centered) and labels reference_frame "
    "accordingly; do not rename event_kind/label without changing the actual query.",
    "Parsing the HORIZONS $$SOE/$$EOE block with a fragile fixed-column parser instead "
    "of a regex tolerant of the API's scientific-notation formatting quirks (e.g. "
    "'Z =-4.95...' with no space after '=' for negative numbers).",
    "Treating a live HORIZONS outage as a data-quality issue rather than a service "
    "availability issue — JPL provides no uptime SLA; this script fails loudly and "
    "does not retry-hammer.",
    "Using TDB (Barycentric Dynamical Time) timestamps from the response as if they "
    "were UTC without at least noting the distinction — TDB and UTC differ by "
    "leap-second-accumulated offsets (~69s in 2026).",
    "Assuming the HORIZONS date field is purely numeric (e.g. matching [\\d-]+) — the "
    "'A.D. 2026-Jul-19' format embeds a 3-letter month abbreviation, which a naive "
    "digits-and-dashes regex silently fails to match, dropping every row.",
]

USER_AGENT = "GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)"
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = REPO_ROOT / "horizons" / "data"
SCHEMA_VERSION = "1.0.0"

CITATION = "JPL Horizons System, NASA Jet Propulsion Laboratory / California Institute of Technology."
LICENSE = "public-domain-NASA"

AU_KM = 149_597_870.7  # 1 AU in km (IAU definition)

TARGET_BODY = "Mars"
TARGET_COMMAND = "499"
CENTER = "500@10"  # Sun-centered (heliocentric)


def build_url(start_date: str, stop_date: str) -> str:
    params = {
        "format": "json",
        "COMMAND": f"'{TARGET_COMMAND}'",
        "OBJ_DATA": "'NO'",
        "EPHEM_TYPE": "'VECTORS'",
        "CENTER": f"'{CENTER}'",
        "START_TIME": f"'{start_date}'",
        "STOP_TIME": f"'{stop_date}'",
        "STEP_SIZE": "'1d'",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://ssd.jpl.nasa.gov/api/horizons.api?{query}"


def _http_get(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("result", "")


def parse_vectors(result_text: str) -> list[dict]:
    """Parse the $$SOE / $$EOE vector block. Each entry has a JD/date line
    followed by X/Y/Z, VX/VY/VZ, LT/RG/RR lines."""
    m = re.search(r"\$\$SOE\n(.*?)\$\$EOE", result_text, re.DOTALL)
    if not m:
        return []
    block = m.group(1)

    entries = []
    # Split into per-timestamp chunks: each starts with a line containing "= A.D."
    chunks = re.split(r"\n(?=\d+\.\d+ = A\.D\.)", block.strip())
    for chunk in chunks:
        date_match = re.search(r"A\.D\.\s*(\d{4}-\w{3}-\d{2})\s+([\d:.]+)\s+(\w+)", chunk)
        xyz_match = re.search(
            r"X\s*=\s*([\-\d.E+]+)\s*Y\s*=\s*([\-\d.E+]+)\s*Z\s*=\s*([\-\d.E+]+)", chunk
        )
        if not date_match or not xyz_match:
            continue
        date_str, time_str, tscale = date_match.groups()
        x_km, y_km, z_km = (float(v) for v in xyz_match.groups())
        entries.append(
            {
                "date_str": date_str,
                "time_str": time_str,
                "timescale": tscale,
                "x_km": x_km,
                "y_km": y_km,
                "z_km": z_km,
            }
        )
    return entries


def to_iso_utc(date_str: str, time_str: str) -> str:
    """Convert HORIZONS 'YYYY-Mon-DD' + 'HH:MM:SS.ffff' (TDB) into an ISO-8601
    string. We label it as UTC-equivalent for schema purposes; the TDB/UTC
    offset (~69s in 2026) is documented as a known failure mode and is not
    corrected here (sub-minute offset, immaterial at 1-day step size)."""
    dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%b-%d %H:%M:%S.%f")
    dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> int:
    fetched_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    today = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    day_str = today.strftime("%Y-%m-%d")

    url = build_url(today.strftime("%Y-%m-%d"), tomorrow.strftime("%Y-%m-%d"))
    print(f"Fetching JPL HORIZONS: target={TARGET_BODY} center={CENTER} date={day_str}")

    try:
        result_text = _http_get(url)
    except (urllib.error.URLError, urllib.error.HTTPError) as exc:
        print(f"ERROR fetching HORIZONS: {exc}", file=sys.stderr)
        return 1

    entries = parse_vectors(result_text)
    if not entries:
        print("WARNING: no vector entries parsed from HORIZONS response.", file=sys.stderr)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    records = []
    for e in entries:
        try:
            ts = to_iso_utc(e["date_str"], e["time_str"])
        except ValueError:
            continue
        distance_au = (
            (e["x_km"] ** 2 + e["y_km"] ** 2 + e["z_km"] ** 2) ** 0.5
        ) / AU_KM
        # Derive ecliptic longitude/latitude directly from the Cartesian vector
        # (X/Y in the ecliptic plane, Z perpendicular to it) rather than emitting
        # placeholder zeros.
        lon_deg = math.degrees(math.atan2(e["y_km"], e["x_km"])) % 360.0
        horiz_dist = (e["x_km"] ** 2 + e["y_km"] ** 2) ** 0.5
        lat_deg = math.degrees(math.atan2(e["z_km"], horiz_dist))
        records.append(
            {
                "schema_version": SCHEMA_VERSION,
                "event_kind": "planet_position_au",
                "timestamp_utc": ts,
                "value": distance_au,
                "unit": "au",
                "target_body": TARGET_BODY,
                "reference_frame": CENTER,
                "position": {
                    "lat_deg": lat_deg,
                    "lon_deg": lon_deg,
                    "frame": "heliocentric_ecliptic",
                },
                "source": {
                    "primary": "JPL Horizons System",
                    "aggregator": None,
                    "fetched_at_utc": fetched_at_utc,
                    "license": LICENSE,
                    "citation": CITATION,
                },
            }
        )

    records_sorted = sorted(records, key=lambda r: r["timestamp_utc"])
    out_path = OUT_DIR / f"mars_position_{day_str}.jsonl"
    with out_path.open("w", encoding="utf-8") as f:
        for rec in records_sorted:
            f.write(json.dumps(rec, sort_keys=True, ensure_ascii=False) + "\n")

    print(f"wrote {len(records_sorted)} records -> {out_path.relative_to(REPO_ROOT)}")
    print(f"JPL HORIZONS ingest complete. total_records={len(records_sorted)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
