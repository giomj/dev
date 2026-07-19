#!/usr/bin/env python3
"""
Grand Council — Wave 2 schema validation CI harness.

Walks every `.jsonl` file under:
  references/noaa/data/
  references/usgs/data/
  references/horizons/data/
  references/owid/data/
  references/irena/data/

and validates each line against its corresponding schema in
references/schemas/:
  noaa/, usgs/, horizons/  ->  geophysical_event.schema.json
  owid/, irena/            ->  energy_supply_series.schema.json

Additionally enforces two provenance invariants beyond plain JSON Schema
validation (per the Session-4 binding that every record carry provenance):
  - source.license must be a non-empty string
  - source.citation must be a non-empty string

Exit codes:
  0 — all files validated successfully (including the case of zero files
      found, which is not an error — an ingest script may legitimately
      produce no data for a given day).
  1 — one or more lines failed schema or provenance validation. Every
      failure is printed with file, line number, and the specific error.
  2 — harness error (e.g. jsonschema not installed, schema file missing/
      unparseable, references/ tree not found).

Usage:
  cd references && python3 scripts/validate_schemas.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import jsonschema
    from jsonschema import Draft202012Validator
except ImportError:
    print(
        "HARNESS ERROR: the 'jsonschema' Python library is not installed. "
        "Install it with: pip install jsonschema",
        file=sys.stderr,
    )
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMAS_DIR = REPO_ROOT / "schemas"

# Maps each per-source data directory to the schema file that governs it.
SOURCE_SCHEMA_MAP = {
    "noaa": "geophysical_event.schema.json",
    "usgs": "geophysical_event.schema.json",
    "horizons": "geophysical_event.schema.json",
    "owid": "energy_supply_series.schema.json",
    "irena": "energy_supply_series.schema.json",
}


def load_schema(schema_filename: str) -> dict:
    schema_path = SCHEMAS_DIR / schema_filename
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_path}")
    with schema_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def check_provenance(record: dict) -> list[str]:
    """Beyond JSON Schema validity, enforce that source.license and
    source.citation are present and non-empty strings. Returns a list of
    error strings (empty list means OK)."""
    errors = []
    source = record.get("source")
    if not isinstance(source, dict):
        # Already caught by schema validation (source is required + object),
        # but guard here so this function never raises on malformed input.
        return errors
    license_val = source.get("license")
    if not isinstance(license_val, str) or license_val.strip() == "":
        errors.append("source.license is missing or empty")
    citation_val = source.get("citation")
    if not isinstance(citation_val, str) or citation_val.strip() == "":
        errors.append("source.citation is missing or empty")
    return errors


def validate_file(jsonl_path: Path, validator: "Draft202012Validator") -> list[str]:
    """Validate every line of a .jsonl file. Returns a list of formatted
    error strings (empty list means the file passed cleanly)."""
    errors: list[str] = []
    with jsonl_path.open("r", encoding="utf-8") as f:
        for line_num, raw_line in enumerate(f, start=1):
            line = raw_line.strip()
            if line == "":
                continue  # tolerate trailing/blank lines
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                errors.append(f"{jsonl_path}:{line_num}: invalid JSON — {exc}")
                continue

            schema_errors = sorted(
                validator.iter_errors(record), key=lambda e: list(e.absolute_path)
            )
            for err in schema_errors:
                path_str = "/".join(str(p) for p in err.absolute_path) or "<root>"
                errors.append(f"{jsonl_path}:{line_num}: schema violation at '{path_str}': {err.message}")

            for prov_err in check_provenance(record):
                errors.append(f"{jsonl_path}:{line_num}: provenance violation: {prov_err}")

    return errors


def main() -> int:
    if not REPO_ROOT.exists() or not SCHEMAS_DIR.exists():
        print(f"HARNESS ERROR: expected schemas directory at {SCHEMAS_DIR}", file=sys.stderr)
        return 2

    # Pre-load and compile validators for each distinct schema file referenced.
    validators: dict[str, Draft202012Validator] = {}
    try:
        for schema_filename in set(SOURCE_SCHEMA_MAP.values()):
            schema = load_schema(schema_filename)
            Draft202012Validator.check_schema(schema)
            validators[schema_filename] = Draft202012Validator(schema)
    except (FileNotFoundError, json.JSONDecodeError, jsonschema.exceptions.SchemaError) as exc:
        print(f"HARNESS ERROR: failed to load/compile schemas: {exc}", file=sys.stderr)
        return 2

    total_files = 0
    total_lines = 0
    total_errors: list[str] = []

    for source_dir, schema_filename in SOURCE_SCHEMA_MAP.items():
        data_dir = REPO_ROOT / source_dir / "data"
        if not data_dir.exists():
            continue  # no data directory yet for this source — not an error
        validator = validators[schema_filename]

        for jsonl_path in sorted(data_dir.glob("*.jsonl")):
            total_files += 1
            with jsonl_path.open("r", encoding="utf-8") as f:
                total_lines += sum(1 for ln in f if ln.strip() != "")
            file_errors = validate_file(jsonl_path, validator)
            total_errors.extend(file_errors)

    print(f"validate_schemas.py: checked {total_files} file(s), {total_lines} record(s).")

    if total_errors:
        print(f"\nFAILED — {len(total_errors)} validation error(s):\n", file=sys.stderr)
        for err in total_errors:
            print(f"  {err}", file=sys.stderr)
        return 1

    print("PASSED — all records conform to their schema and carry non-empty source.license/source.citation.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
