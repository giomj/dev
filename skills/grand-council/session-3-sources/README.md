# conceptual-engineering-references

> A reference shelf, not a service.

**Catalogs + schemas + scripts** for three external data sources — [n2yo.com](https://www.n2yo.com/), [SatDump](https://www.satdump.org/), and the [Global Oil and Gas Plant Tracker (GOGPT)](https://globalenergymonitor.org/projects/global-oil-gas-plant-tracker/). Nothing here fetches data on your behalf. You bring the credentials, you run the ingest, you own the transformation.

The shelf publishes the contract; downstream consumers implement against it.

---

## Origin

This project was bootstrapped by the [Grand Council](https://github.com/giomj/dev/tree/main/skills/grand-council) in **Session 3** (2026-07-18) and hardened for public distribution in **Session 4** (2026-07-18).

- Session 3 ruling: [rulings/2026-07-18-session-3-three-sources.md](https://github.com/giomj/dev/blob/main/skills/grand-council/rulings/2026-07-18-session-3-three-sources.md)
- Session 4 ruling: [rulings/2026-07-18-session-4-distribution.md](https://github.com/giomj/dev/blob/main/skills/grand-council/rulings/2026-07-18-session-4-distribution.md)

Emperor: [James Gianotti](https://github.com/giomj). Council: multi-model deliberation (Physicist, Engineer, Mathematician, Historian-Philosopher, Skeptic, Scribe, Architect).

---

## Layout

```
schemas/                         Pure JSON Schema — implementation-agnostic
  world_coordinate_event.schema.json   WGS84+UTC event (canonical reference frame)
  tle_cache.schema.json                TLE with epoch-age discipline
  hardware_compat.schema.json          SDR hardware matrix

bindings/
  typescript/                    Generated TypeScript — reproducible from schemas
    world_coordinate_event.ts
    tle_cache.ts
    hardware_compat.ts

scripts/
  check_attribution.py           CI-gated attribution + rate-of-change check
  generate_bindings.sh           Regenerate bindings/ from schemas/

sources/
  n2yo/
    catalog.md                   Original commentary on n2yo endpoints
    endpoints.md                 Full 57-category ID table + REST spec
    .env.example                 Per-device API key template
    cache/                       Cached TLEs (rate-of-change gated)
    samples/iss_tle_25544.txt    Live ISS TLE captured 2026-07-18
  satdump/
    catalog.md                   Original commentary; no SatDump code
    NOTICE.md                    Why we do not vendor SatDump
    hardware_compat.json         Hand-maintained (conformant to schema)
  gogpt/
    catalog.md                   Original commentary
    ATTRIBUTION.md               Canonical CC BY 4.0 citation string
    schema_map_2026-01.yml       Column map for Jan 2026 release
    raw/2026-01/                 Dated raw drop (user-populated)
    derived/                     Transformations (require YAML front-matter)

.github/workflows/
  attribution.yml                CI gate on every push and PR

LICENSES.md                      License-gradient discipline (READ THIS)
```

---

## The three schemas

The load-bearing artifacts of this repo. Any downstream consumer — mobile app, dashboard, notebook, SDK — implements against these.

### `world_coordinate_event.schema.json`

A spacetime event in WGS84 geodetic frame + UTC. Adopted as the canonical reference frame across the emperor's portfolio (`gravitational-compass`, `grid-and-chain-mobile`, `conceptual-engineering-references`).

**Fields:** `event_type`, `position { lat_deg, lon_deg, alt_m, frame, uncertainty_m }`, `timestamp_utc`, `timestamp_uncertainty_s`, `source { primary, aggregator, license }`, `metadata`.

**Discipline:** `frame` distinguishes ellipsoid vs. mean-sea-level. Uncertainty fields are required for measured events. Local time is rejected.

### `tle_cache.schema.json`

A single Two-Line Element set cached locally with epoch-age discipline enforced.

**Discipline:** `norad_cat_id` is canonical, not n2yo's 57-category taxonomy. `source.primary` is USSPACECOM/Space-Track; `source.aggregator` is n2yo. `epoch_age_days_at_fetch` must be tracked; consumers degrade confidence past 3.0.

### `hardware_compat.schema.json`

Hand-maintained SDR compatibility matrix. No SatDump-authored files enter this tree — this is a *catalog*, not a redistribution.

**Discipline:** `platform_support.desktop` and `platform_support.android` reported separately (mobile drops several drivers). `adc_bits` present because the Physicist warned that quantization noise floor is a real physical parameter, not a spec-sheet number.

---

## Usage

### Consuming the schemas from TypeScript

```typescript
import type { WorldCoordinateEvent, TLECacheEntry, HardwareCompatMatrix } from './bindings/typescript';

const iss_position: WorldCoordinateEvent = {
  schema_version: '1.0.0',
  event_type: 'satellite_position',
  position: { lat_deg: 51.63, lon_deg: -122.4, alt_m: 421_000, frame: 'WGS84_ellipsoid', uncertainty_m: 500 },
  timestamp_utc: '2026-07-18T14:15:00Z',
  timestamp_uncertainty_s: 60,
  source: { primary: 'USSPACECOM/Space-Track', aggregator: 'n2yo.com', license: 'proprietary-with-ToS' }
};
```

### Consuming the schemas from Python

```bash
pip install jsonschema
python -c "
import json, jsonschema
schema = json.load(open('schemas/world_coordinate_event.schema.json'))
event = {...}
jsonschema.validate(event, schema)
"
```

### Regenerating bindings

```bash
./scripts/generate_bindings.sh
```

Requires `npx json-schema-to-typescript`. Bindings are versioned in git for discoverability but reproducible from schemas alone.

---

## Distribution posture

**This repo publishes contracts and commentary — never a live service.** You install your own credentials, run your own ingest, cite the primary source (not this shelf), and comply with each source's license. See [LICENSES.md](./LICENSES.md).

The Grand Council's four bindings apply to every downstream artifact:

1. **Aggregator-vs-source discipline.** Any TLE cites USSPACECOM as primary and n2yo as aggregator. Any GOGPT number cites Global Energy Monitor with release date. Any SatDump reference cites the SatDump project as authors of the software, not us.
2. **Rate-of-change hygiene.** No bulk redistribution of TLEs. The CI gate blocks it.
3. **Change indication.** Every derived artifact carries a YAML `modifications:` block. CC BY 4.0 requires it and the CI gate enforces it.
4. **Domain-of-validity honesty.** No physical quantity travels without its uncertainty band; no aggregation without stating its weighting; no schema breaking change without a major version bump.

---

## The Grand Council

This shelf is deliberated. Every schema, every citation string, every CI check has a council seat behind it:

| Seat | Backing | Session-4 binding |
|------|---------|-------------------|
| Physicist | GPT-5.5 | Units + uncertainty on every physical quantity |
| Engineer | Claude Sonnet 5.0 | Repo layout, CI gate, three schemas |
| Mathematician | Gemini 3.1 Pro | Semver on schema_version; Lorenz-curve-native GOGPT |
| Historian-Philosopher | Claude Opus 4.8 | Reading room over archive; provenance travels |
| Skeptic | Gemini 3.1 Pro | Motion authority; falsifiable counters |
| Scribe | Notion connector | Mirror into public Reading Room |
| Architect / Master of the Codex | GitHub connector | Archive of record; CI gate; append-only history |

Read the [full council introductions](https://github.com/giomj/dev/tree/main/skills/grand-council/introductions-4).

---

## License

The commentary, schemas, scripts, and documentation in this repository are authored by the Grand Council on behalf of Emperor James Gianotti and released under **CC BY 4.0**. The external data sources catalogued here retain their own licenses — see [LICENSES.md](./LICENSES.md) for the full gradient.
