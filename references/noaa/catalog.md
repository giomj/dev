# NOAA Space Weather Prediction Center (SWPC) — Source Catalog

**Site:** https://www.swpc.noaa.gov/
**API base:** `https://services.swpc.noaa.gov/`
**Ingested:** 2026-07-18 (Wave 2, Session 5)

## Scope

- **Products used:** Planetary K-index (3-hour observed), solar wind plasma (1-day), solar wind magnetometer (1-day)
- **Time domain:** Real-time / near-real-time (last 24h – 7d windows depending on product)
- **Legal status:** Public domain, U.S. federal work (17 U.S.C. § 105). No license fee or permission required. See `../UPSTREAM_TERMS.md` for the full audit.

## Endpoints we use

| Endpoint | Product | Native cadence |
|---|---|---|
| `https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json` | Observed Planetary K-index (3-hour intervals) | 3 hours |
| `https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json` | Real-time solar wind plasma (density, speed) | ~1 minute |
| `https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json` | Real-time solar wind magnetometer | ~1 minute |

We deliberately do **not** ingest `planetary_k_index_1m.json` (the 1-minute estimated Kp) in Wave 2 — it is a distinct product from the 3-hour observed Kp and mixing the two in one series is a known failure mode (see `../schemas/geophysical_event.schema.json`).

## Cadence / fetch discipline

- Poll each JSON product **no faster than its native update cadence** — 3 hours for the planetary K-index, ~1 minute for the solar-wind files. Polling faster returns identical cached data.
- Pace requests with a **1-second delay** between the three product fetches per run (courtesy pacing; not an enforced NOAA limit).
- No published numeric rate limit exists for SWPC; treat the absence of one as a reason for restraint, not permission to burst.

## How to fetch

```bash
python3 scripts/ingest/noaa_swpc.py
```

Emits one `geophysical_event` record per timestamp per product to `noaa/data/<dataset>_<YYYY-MM-DD>.jsonl`.

## Ingest hygiene

- **User-Agent:** `GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)`
- **Caching:** cache each product for the duration of its native cadence; do not re-fetch within that window.
- Every record carries `source.primary`, `source.fetched_at_utc`, `source.license` (`public-domain-USG`), and `source.citation` (see `ATTRIBUTION.md`).

## Claims under review (for council)

- **C1** — SWPC publishes no numeric rate-limit figure; our 1-second inter-request pacing is a self-imposed courtesy, not a documented requirement.
- **C2** — `noaa-planetary-k-index.json` and the 1-minute estimated Kp are separate products; Wave 2 ingests only the 3-hour observed product.
