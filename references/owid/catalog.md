# Our World in Data (OWID) — Source Catalog

**Site:** https://ourworldindata.org/
**API base:** `https://ourworldindata.org/grapher/` (Chart Data API); `https://api.ourworldindata.org/v1/indicators/` (per-indicator metadata)
**Ingested:** 2026-07-18 (Wave 2, Session 5)

## Governing gate document

Read [`UPSTREAM_LICENSES.md`](./UPSTREAM_LICENSES.md) before touching this folder. It is a **gate, not a spec** — it defines exactly which datasets and which rows are authorized for ingest. The ruling below is a summary; the gate document is the authority.

## Datasets we ingest (four, per the emperor's ruling)

| Dataset | OWID slug | URL | License | Refresh cadence |
|---|---|---|---|---|
| CO₂ emissions per capita | `co-emissions-per-capita` | https://ourworldindata.org/grapher/co-emissions-per-capita | CC BY 4.0 (Global Carbon Budget + OWID population) — CLEAN | Annual (GCB releases ~November) |
| CO₂ emissions per GDP (carbon intensity) | `co2-intensity` | https://ourworldindata.org/grapher/co2-intensity | CC BY 4.0 (Global Carbon Budget + Maddison Project 2023) — CLEAN | Annual |
| Electricity generation mix | `share-elec-by-source` | https://ourworldindata.org/grapher/share-elec-by-source | MIXED — Ember rows CC BY 4.0 (ingested); Energy Institute rows dropped | Ember refreshes ~April |
| Renewable electricity share | `share-electricity-renewables` | https://ourworldindata.org/grapher/share-electricity-renewables | MIXED — Ember rows CC BY 4.0 (ingested); Energy Institute rows dropped | Ember refreshes ~April |

## Dataset we do NOT ingest — BLOCK ruling

**`energy-consumption-by-source-and-country`** is **BLOCKED**. Its sole upstream is the Energy Institute Statistical Review of World Energy, which is copyright-reserved (© Energy Institute, all rights reserved) with only a narrow quote-with-attribution permission — bulk redistribution of the full country-level matrix is plausibly "extensive reproduction," which requires EI's written permission that we do not have. See `UPSTREAM_LICENSES.md` §2.1, §3.3, §6.1. **Do not add this slug to the ingest script.**

## The Ember-only-rows requirement

For `share-elec-by-source` and `share-electricity-renewables`, OWID blends two upstreams per column: **Ember** (CC BY 4.0 — clean) and **Energy Institute** (copyright-reserved — not licensed for our bulk redistribution). We ingest **Ember-sourced rows only** and drop EI-sourced rows. The per-column OWID variable-ID table in `UPSTREAM_LICENSES.md` Appendix C is the source of truth for which variable IDs to check via `/v1/indicators/{id}.metadata.json`.

## Fetch mechanism

- CSV: `GET https://ourworldindata.org/grapher/{slug}.csv`
- Per-indicator metadata (used to detect Ember vs EI origin): `GET https://api.ourworldindata.org/v1/indicators/{id}.metadata.json`
- **403 check required on every fetch**: OWID returns `403 - Data is non-redistributable` if a source's license changes to forbid redistribution. The ingest script must halt loudly if this is seen, on any of the four authorized slugs.

## Rate limits / TOS

- No numeric rate limit published. Self-imposed courtesy limit: serialize requests, ≤1 request/second, descriptive User-Agent.
- OWID's API docs actively support automated/programmatic access (curl/Python/JS examples provided).

## How to fetch

```bash
python3 scripts/ingest/owid.py
```

Emits one `energy_supply_series` record per (country_iso3, year) per metric to `owid/data/<dataset>_<YYYY-MM-DD>.jsonl`.

## data/ directory

Holds the pinned CSVs produced by the ingest script's one-shot fetch (raw upstream bytes, kept for reproducibility of the transformation).
