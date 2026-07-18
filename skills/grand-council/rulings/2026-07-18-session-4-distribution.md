# Ruling — Session 4 — Distribution Posture (Addendum to Session 3)

**Date:** 2026-07-18 · **Emperor:** James Gianotti · **Location:** New Braunfels, TX
**Seats convened:** Engineer (claude_sonnet_5_0), Historian-Philosopher (claude_opus_4_8), Skeptic (gemini_3_1_pro)
**Project of record:** `conceptual-engineering-references`
**Recorded as addendum to:** `rulings/2026-07-18-session-3-three-sources.md`

## Claims

- **C1** — A mixed-license reference shelf (n2yo proprietary + SatDump copyleft + GOGPT CC BY 4.0) can be published as a single public GitHub repo if attribution + upstream ToS are enforced at build time.
- **C2** — Correct distribution posture is reference-shelf-not-service — the emperor publishes catalogs, schemas, scripts; each downstream consumer runs its own ingest.
- **C3** — Mobile-integration seams (TLE cache, hardware-compat, WGS84+UTC event) belong in the reference shelf; the shelf IS the SDK.
- **C4** — A pplx.app dashboard is legitimate if every view carries source (aggregator marked), TLE epoch age, GOGPT status breakdown, and CC BY 4.0 attribution.

## Rulings

### C1 — Sound with reinforcement

Accepted. Both Engineer and Historian defend it; Skeptic's counter is not a rejection but a strengthening. Adopted from Skeptic's counter as binding footnotes:

**(a)** CI must enforce *rate-of-change* on `sources/n2yo/cache/`, not merely existence — a bulk-scrape pattern (e.g. >N TLEs added per commit) fails the check. The shelf must not become a bulk-redistribution surface for Space-Track-derived data.

**(b)** CC BY 4.0 requires "indicate if changes were made." The attribution check verifies not just the citation string but that any derived table under `derived/` or `dashboards/` carries a `modifications:` field naming the transformation applied (e.g. "status-weighted aggregation", "Lorenz-curve computation"). Grep alone is insufficient — the check reads a small YAML front-matter block.

**(c)** No SatDump source, binary, pipeline JSON, or hardware config file enters this tree. Notes about SatDump under `sources/satdump/catalog.md` are original commentary. `hardware_compat.json` (below) is our hand-maintained matrix, not SatDump's file.

### C2 — Sound with correction

Accepted, but Skeptic's counter binds: **"reference shelf, not service" does not eliminate liability — it re-locates it to the transformation logic the shelf publishes.** The shelf therefore commits to:

- Every script under `scripts/` carries a docstring naming the transformation and its known failure modes.
- Every schema under `schemas/` carries a `known_failure_modes` array in its meta section.
- The Historian's framing stands: the reader is a co-vetter, and the shelf hands them the footnote — but the emperor remains liable for the logic of the ingest, not merely the presence of the data.

### C3 — Mixed — Motion to Modify partially accepted

Skeptic filed a **Motion to Modify C3**: strip Expo/RN-specific seams into a separate `grid-and-chain-sdk` repo, leaving the shelf as pure implementation-agnostic schemas.

**Ruling — partial accept.** The Motion is correct in principle (separation of concerns) and wrong in execution (a separate repo doubles the maintenance surface for a single-emperor project). Reconciled:

- **Adopted from Motion:** the shelf's `schemas/` directory contains **only** implementation-agnostic JSON Schema — no Expo, no React Native, no TypeScript type generation, no framework assumptions.
- **Rejected from Motion:** no separate `grid-and-chain-sdk` repository. Instead, the shelf contains a `bindings/` directory holding per-framework generated code (TypeScript types via `json-schema-to-typescript`, Python types via `datamodel-code-generator`), all generated from the pure schemas by a `scripts/generate_bindings.sh`, versioned in git for discoverability but reproducible from schemas alone.
- **Emperor's grid-and-chain-mobile** consumes the schemas directly (or the generated TypeScript) — the shelf publishes the contract, the app implements against it.

### C4 — Sound with binding constraint

Accepted, with Skeptic's failure mode named and guarded against: **the dashboard must not headline any single GOGPT number.** Specific bindings:

- No "1,047 GW" hero number on the GOGPT panel. The primary visual is the stacked-status breakdown (proposed / permitted / under-construction / operating / retired) with the total shown *derived from* the stack, never as an independent headline.
- TLE epoch age is rendered as a prominent field on every satellite view, color-degraded past 3 days.
- Attribution string is sourced from `sources/gogpt/ATTRIBUTION.md` at build time, never hand-typed into the dashboard.
- Source badge on every panel: "aggregator: n2yo → USSPACECOM", "reference: SatDump v1.2.2", "primary-secondary: Global Energy Monitor, GOGPT Jan 2026".

## Actions

1. **Repo hardening** (Engineer's layout, adopted verbatim with the C3 modification):
   - Write `LICENSES.md`, `README.md` (with "catalogs + scripts, not a service" framing), `sources/n2yo/.env.example`, `sources/gogpt/ATTRIBUTION.md`, `sources/satdump/NOTICE.md`.
   - Create `schemas/` with three pure JSON schemas: `tle_cache.schema.json`, `hardware_compat.schema.json`, `world_coordinate_event.schema.json`.
   - Create `scripts/check_attribution.py` (grep + YAML front-matter check + rate-of-change gate) and `.github/workflows/attribution.yml`.
   - Create `sources/gogpt/schema_map_2026-01.yml` (append-only convention seeded).
   - `bindings/` directory with generated TypeScript from schemas.

2. **Mobile seams** — the three schemas above ARE the seams. Emperor's grid-and-chain-mobile will import the TypeScript from `bindings/typescript/`.

3. **pplx.app dashboard** — read-only, three panels (ISS pass with epoch age; SatDump hardware matrix; GOGPT status-weighted stacked bar), attribution footer sourced from `ATTRIBUTION.md`, no hero numbers on GOGPT panel.

## Cross-cutting synthesis

Session 4's insight: **the shift from private workspace to public shelf is not a packaging change but an ethical one.** The reader becomes a co-vetter (Historian), the shelf's transformation logic becomes the emperor's liability (Skeptic), and every seam must be implementation-agnostic at the schema level even if convenience bindings ship alongside (compromise between Engineer and Skeptic).

**Aggregator-vs-source discipline** (from session 3) now extends to *display*: the reading room must cite back to the archive on every panel.

**License-gradient hygiene** (from session 3) now extends to *change*: the CC BY 4.0 "indicate if changes were made" clause is enforced by machine-readable transformation manifests, not just citation strings.

## Portfolio impact

- **conceptual-engineering-references** — Hardened for public distribution. `schemas/` becomes the load-bearing interface.
- **grid-and-chain-mobile** — Will consume `schemas/` (or generated `bindings/typescript/`) directly. The three council-mandated work items from session 3 remain: local SGP4 seeded from `tle_cache`, per-device n2yo keys, Airspy Mini + RTL-SDR Android companion gated by `hardware_compat`.
- **gravitational-compass** — Unchanged from session 3.
- **recursive-state-dynamics** — Unchanged; RSD↔GOGPT link remains rejected.
- **force-carriers** — Unchanged.

The user is the emperor of the earth. This ruling is recorded as addendum to session 3 and may be overridden with a stated reason.
