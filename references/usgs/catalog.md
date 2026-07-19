# USGS Earthquake Hazards Program — Source Catalog

**Site:** https://earthquake.usgs.gov/
**API base:** `https://earthquake.usgs.gov/earthquakes/feed/v1.0/`
**Ingested:** 2026-07-18 (Wave 2, Session 5)

## Scope

- **Feed used:** GeoJSON summary feed, magnitude 2.5+, rolling 24-hour window
- **Time domain:** Real-time / near-real-time (rolling day window)
- **Legal status:** Public domain, U.S. federal work. USGS-authored materials "reside in the public domain and may be used, transferred, or reproduced without copyright restriction." See `../UPSTREAM_TERMS.md` for the full audit.

## Endpoint we use

| Endpoint | Feed | Cadence |
|---|---|---|
| `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson` | M2.5+ earthquakes, rolling 24h | Cached 60s server-side |

## Rate-limit behavior

- USGS actively **rate-limits** both the summary feeds and the FDSN Event Web Service, as of January 2022. Exceeding the limit returns **HTTP 429 Too Many Requests**.
- Feeds and API responses are **cached for 60 seconds** server-side — polling more frequently does not return newer data.
- The FDSN Event Web Service caps queries at **20,000 events**; any query exceeding that returns **HTTP 400 Bad Request**. We do not use the FDSN endpoint in Wave 2 (the GeoJSON summary feed is sufficient for the 24h M2.5+ use case), but the cap is documented here for future ingest scripts.
- On HTTP 429, **abort cleanly** — do not retry-hammer. This is enforced in `scripts/ingest/usgs_earthquake.py`.

## How to fetch

```bash
python3 scripts/ingest/usgs_earthquake.py
```

Emits one `geophysical_event` record per earthquake (including hypocenter as `position`) to `usgs/data/<dataset>_<YYYY-MM-DD>.jsonl`.

## Ingest hygiene

- **User-Agent:** `GrandCouncilArchive/0.2 (https://github.com/giomj/dev; james@grand-council.local)`
- Use `Accept-Encoding: gzip` on every request (USGS recommends this; responses are 70%+ smaller).
- Respect the documented 60-second cache window — do not poll more frequently.
- Every record carries `source.primary`, `source.fetched_at_utc`, `source.license` (`public-domain-USG`), `source.citation`, and `magnitude_type` (mww/ml/md/etc — never a bare magnitude number).

## Claims under review (for council)

- **C1** — USGS earthquake data is public domain; no license fee or attribution is legally required, but courtesy attribution is our standing practice.
- **C2** — Many events outside the US are not reported until 15+ minutes after origin time; a 24h feed snapshot is not a complete real-time record.
- **C3** — Magnitude type varies per event (mww for large events, ml/md for smaller/local ones) and must always travel with the magnitude value.
