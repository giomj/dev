# JPL HORIZONS — Source Catalog

**Site:** https://ssd.jpl.nasa.gov/horizons/
**API base:** `https://ssd.jpl.nasa.gov/api/horizons.api`
**Ingested:** 2026-07-18 (Wave 2, Session 5)

## Scope

- **Use case (Wave 2):** Minimal proof-of-life — geocentric position vector of Mars for a single day.
- **Time domain:** Any epoch HORIZONS supports (ephemeris computation, not a fixed archive window).
- **Legal status:** Public domain, NASA/JPL work (17 U.S.C. § 105). See `../UPSTREAM_TERMS.md` for the full audit.

## Endpoint we use

`https://ssd.jpl.nasa.gov/api/horizons.api` (GET interface), with parameters:

| Parameter | Value we use | Purpose |
|---|---|---|
| `format` | `json` | Machine-readable response |
| `COMMAND` | `'499'` | Target body — Mars (NAIF ID 499) |
| `OBJ_DATA` | `'NO'` | Suppress the object-data header block |
| `EPHEM_TYPE` | `'VECTORS'` | State-vector output (position + velocity) |
| `CENTER` | `'500@10'` | Observer/center — Sun-centered (heliocentric), body 10 = Sun |
| `START_TIME` / `STOP_TIME` | today / today+1 | One-day window |
| `STEP_SIZE` | `'1d'` | Single daily step |

## Target/observer/frame convention we standardize on

HORIZONS returns **different numbers for "the same" planet position** depending on `CENTER` (observer) and the reference frame. We standardize on:

- **`target_body`**: the HORIZONS `COMMAND` body name (e.g. `"Mars"`).
- **`reference_frame`**: the literal `CENTER` string used (e.g. `"500@10"` for heliocentric, `"500@399"` for geocentric Earth-centered). This must always be recorded alongside a position — see `geophysical_event.schema.json`'s known failure mode on this exact point.
- Vectors are parsed from the `$$SOE` / `$$EOE` markers in the response text.

## Rate-limit / pacing behavior

- HORIZONS publishes **no numeric rate limit** anywhere in its documentation. Treat this as a signal for self-imposed conservatism, not permission to burst — each query is a live computation, not a cached file.
- Serialize requests; avoid parallel bursts. Batch time spans via `STEP_SIZE`/`TLIST` rather than one request per timestamp.
- HORIZONS has **no committed SLA** — expect best-effort availability and do not build time-critical automation against it without a fallback.

## How to fetch

```bash
python3 scripts/ingest/jpl_horizons.py
```

Emits one `geophysical_event` record (`event_kind: planet_position_au`) to `horizons/data/<dataset>_<YYYY-MM-DD>.jsonl`.

## Ingest hygiene

- **User-Agent:** `GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)`
- Every record carries `source.primary`, `source.fetched_at_utc`, `source.license` (`public-domain-NASA`), `source.citation`, `target_body`, and `reference_frame`.

## Claims under review (for council)

- **C1** — HORIZONS returns different vectors for the same nominal "planet position" depending on `CENTER`; every ingested record must carry `reference_frame` to be interpretable.
- **C2** — No documented rate limit exists; our serialized, non-parallel fetch pattern is a self-imposed courtesy.
