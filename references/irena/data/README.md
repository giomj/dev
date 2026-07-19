# IRENA Pinned Data

This directory holds **manually PxWeb-exported, pinned CSVs** — never fetched automatically.

## Why

Per [`../UPSTREAM_LICENSES.md`](../UPSTREAM_LICENSES.md) and the emperor's ruling, IRENA's operational posture is **pinned CSVs only; no automated fetch**:

- `www.irena.org` runs an Azure WAF with a JavaScript challenge that returns HTTP 403 to non-browser clients.
- IRENASTAT (`pxweb.irena.org`) is an interactive PxWeb query tool, not a documented bulk API.
- No automated-access permission is documented anywhere for either surface.

## Manual export workflow

1. A human visits https://pxweb.irena.org/pxweb/en/IRENASTAT, navigates to the relevant topic folder (Power Capacity and Generation for capacity/generation; the IRENA costs dashboard for LCOE), and exports the desired table as CSV.
2. The exported CSV is dropped into this directory with a descriptive filename, e.g. `renewable_capacity_by_country_technology_2025.csv`.
3. `scripts/ingest/irena_pinned.py` is run to replay the pinned CSV(s) into `irena/data/*.jsonl` records conforming to `energy_supply_series.schema.json`, with the `© IRENA <year>` notation and verbatim citation attached to every record.
4. The CSV stays in git as the pinned source-of-truth; re-running the ingest script against the same CSV is idempotent.

## Current state

**No pinned CSVs exist yet.** This Wave-2 build ships the `irena_pinned.py` ingest script in a functional-but-untriggered state — it will process zero records until a human performs the manual export step above. This is expected and acceptable per the task's own allowance for "functional but data/ can be empty."
