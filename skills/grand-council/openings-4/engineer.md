# Engineer Opening — Session 4: Distribution Posture

Session 3 ruled the shelf's contents sound; session 4 asks whether it can
leave the workspace. Yes — on a specific layout, one CI gate, and three
schema contracts. Build spec below.

## 1. Repo layout (C1, C2)

```
/LICENSES.md
/README.md                    # "catalogs + scripts, not a service"
/sources/
  n2yo/  catalog.md endpoints.md .env.example  NOTICE.md
  satdump/  catalog.md  NOTICE.md   # no vendored binary/source
  gogpt/
    raw/<release>/source.xlsx SHA256SUMS   # immutable per release
    schema_map_<release>.yml               # append-only
    ATTRIBUTION.md
/schemas/
  tle_cache.schema.json
  hardware_compat.schema.json
  world_coordinate_event.schema.json
/scripts/  check_attribution.py  ingest_gogpt.py  cache_tle.py
/samples/  /notes/
```

- SatDump's GPL binds the *software*, not our notes about it — no binary or modified source enters this tree; the repo links upstream only.
- The n2yo key never enters git history: `.env.example` is a template, real keys live in platform secrets (GitHub Actions / dashboard host env).
- GOGPT raw files are immutable and dated — each bi-annual pull gets its own `raw/<release>/`, never overwritten, so CC BY 4.0 attribution stays auditable per release.

**`LICENSES.md`** carries one section per source, each naming the binding and what it constrains: n2yo (proprietary ToS + rate-limited key — this repo holds only one sample TLE, and bulk redistribution must separately satisfy Space-Track's upstream terms); SatDump (GPL-family — no source/binary bundled, catalog notes are original commentary under the shelf's own license); GOGPT (CC BY 4.0 — mandatory attribution string on every file/derived table, enforced in CI). A closing section states the shelf's own license for original catalogs/schemas/scripts, explicit that it does not relicense upstream content. The strictest binding sets the ceiling.

## 2. CI attribution check (C1, C4)

GitHub Actions workflow, `.github/workflows/attribution.yml`, on every PR/push to `main`. It verifies:

1. Every `sources/gogpt/**/*.md` and any `derived/**` or `dashboards/**` file referencing GOGPT data matches `Global Oil and Gas Plant Tracker, Global Energy Monitor, \d{4}-\d{2}`.
2. Every `sources/n2yo/**` file referencing live data has a schema-checked `tle_epoch`/`epoch_age_days` field — enforcing epoch age travels with every position.
3. `schemas/*.schema.json` validate against a fixed meta-schema, and any PR touching `schema_map_*.yml` must **add** a new file, not edit a prior one (checked via `git diff --name-status`, requiring `A` not `M`).
4. No `.env` or n2yo-key-shaped string appears in the diff.

It blocks merge to `main` on any failure — hard fail, not warning. It's a static check against committed files; no external credentials needed, so it runs on public PRs. Live reconciliation calls are a separate, secrets-scoped job.

## 3. Three integration seams — the shelf IS the SDK (C3)

All three live under `/schemas/` (contract) + `/sources/<x>/` (implementation), never a separate repo.

**TLE cache** — `schemas/tle_cache.schema.json`: `{norad_id, line1, line2, epoch_utc, fetched_at_utc, source, schema_version}`. Populated into `sources/n2yo/cache/` by `scripts/cache_tle.py` on a scheduled cadence well under 1000/hr. grid-and-chain-mobile (Expo/RN) never calls n2yo directly — it reads this cached JSON (bundled snapshot or static fetch) and runs SGP4 locally (e.g. `satellite.js`) seeded from `line1`/`line2`. `schema_version` is mandatory so the RN client rejects stale-shape data instead of crashing on it.

**Hardware-compat JSON** — `schemas/hardware_compat.schema.json`: `{device, platforms[], frequency_bands[], notes, schema_version}`, hand-maintained at `sources/satdump/hardware_compat.json` against SatDump's support matrix. grid-and-chain-mobile's Android ground-station companion reads this as a bundled static asset at build time to gate advertised SDR support — it changes only on SatDump release cadence.

**WGS84+UTC event** — `schemas/world_coordinate_event.schema.json`: `{lat, lon, alt_m, timestamp_utc, event_type: enum[sat_position, ground_station, plant], ref_id, schema_version}`. This makes the Mathematician's E(x,y,z,t) concrete: n2yo positions, SatDump ground-station fixes, and GOGPT plant coordinates all map into one shape, so grid-and-chain-mobile renders any source off one event type keyed by `event_type`.

**Versioning discipline:** every payload carries `schema_version`; breaking changes bump major, additive fields are nullable and bump minor; consumers pin a supported range and fail loudly on mismatch.

## 4. pplx.app dashboard MVP (C4)

Pulls only from the shelf's static outputs — `sources/n2yo/cache/latest.json`, `sources/satdump/hardware_compat.json`, latest `sources/gogpt/raw/<release>/` plus its schema map. No live upstream calls from the dashboard itself, keeping it a *reader*, per C2.

Every view shows: (a) a source badge naming n2yo as aggregator over USSPACECOM, SatDump, or GOGPT/Global Energy Monitor; (b) TLE epoch age in days (`now - epoch_utc`), flagged past 3 days; (c) GOGPT status breakdown (proposed/permitted/under-construction/operating/retired) as a stacked bar, never a bare total; (d) the CC BY 4.0 string rendered as static footer text, read from `ATTRIBUTION.md` at build time, not hand-typed into the dashboard.

MVP scope: three read-only panels — pass list with epoch age, ground-station hardware matrix, GOGPT capacity breakdown by country/status. No write path, no accounts, no n2yo key proxied through the dashboard backend.

## Stance

C1: Accept. C2: Accept. C3: Accept. C4: Accept with note — attribution string must be sourced programmatically from `ATTRIBUTION.md`, never hardcoded in the dashboard, so a release update can't desync text from data.
