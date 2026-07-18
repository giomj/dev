# Licenses & Attribution

This reference shelf combines three source regimes. **The strictest binding in the provenance chain sets the ceiling.** When redistributing anything derived from these sources, you inherit the source's obligations — this file names them.

Read every regime below before quoting, copying, or embedding anything from these catalogs.

---

## Regime 1 — n2yo.com (proprietary + rate-limited ToS)

**What we hold:** Catalog documentation, endpoint descriptions, and a single live ISS TLE captured 2026-07-18 (`session-3-sources/samples/iss_tle_25544.txt`).

**Provenance chain:** n2yo.com is an **aggregator** — the authoritative record is [USSPACECOM / Space-Track](https://www.space-track.org/). n2yo is a courier of the state catalog, never the record itself.

**Binding:** [n2yo.com Terms of Service](https://www.n2yo.com/terms.php) applies as a floor. Rate limits (1000/hr TLE, 100/hr passes/above) are hard. **No bulk redistribution.** The CI attribution check (`scripts/check_attribution.py`) enforces a rate-of-change gate on `sources/n2yo/cache/` — any commit that adds more than 5 new TLEs in one push is blocked.

**Downstream obligation:** Any tool consuming n2yo data must (a) hold its own API key per device, (b) cite USSPACECOM as primary with n2yo as aggregator, (c) carry the TLE epoch age with the data.

---

## Regime 2 — SatDump (GPL-family copyleft)

**What we hold:** Original commentary on SatDump's platform support, radio compatibility, and pipeline concepts (`session-3-sources/sources/satdump/catalog.md`). Our own hand-maintained `hardware_compat.json` matrix conformant to `schemas/hardware_compat.schema.json`.

**What we do NOT hold:** No SatDump source code, no compiled binaries, no SatDump-authored pipeline JSON, no SatDump-authored hardware config files.

**Binding:** [SatDump](https://github.com/SatDump/SatDump) is licensed under the GNU General Public License. If you bundle any SatDump-authored file — code, config, or pipeline — into a derived work, the GPL binds that entire derived work. **This shelf avoids that binding entirely by not bundling.** If you want to ship SatDump alongside your project, fetch it from upstream at install time or point users to F-Droid; do not vendor it.

**Downstream obligation:** Frame "leading" as *actively-maintained + mainstream-SDR-coverage + open-source*, not "technically superior in every case" (Session 3 ruling, Historian K). Pipeline docs must name the physical parameters (sample rate, center frequency, Doppler, FEC, frame format), not just the pipeline name.

---

## Regime 3 — GOGPT (CC BY 4.0, Global Energy Monitor)

**What we hold:** Original commentary on the Global Oil and Gas Plant Tracker dataset structure (`session-3-sources/sources/gogpt/catalog.md`), a schema map for the January 2026 release (`sources/gogpt/schema_map_2026-01.yml`), and dated raw drop directories.

**Binding:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — Attribution 4.0 International. You may share, adapt, and redistribute *provided you*:
1. **Attribute** using the citation string in `sources/gogpt/ATTRIBUTION.md`.
2. **Indicate changes.** Any derived table under `derived/` or `dashboards/` must carry a `modifications:` field naming the transformation applied (e.g. `status-weighted aggregation`, `Lorenz-curve computation`, `unit-conversion GW→TWh`).
3. **Link the license** (see above).
4. **Not impose additional restrictions** — no DRM, no more-restrictive downstream terms.

**Downstream obligation:** Never quote a GOGPT capacity number without its status breakdown. Never quote a CO₂/TWh derivative without stating the capacity-factor assumption. Peer-review provenance is domain-collaborator review by CREA, Beyond Fossil Fuels, EIP, and Sierra Club — *not* journal-style anonymous peer review.

---

## The rate-of-change gate (CI-enforced)

The `.github/workflows/attribution.yml` workflow runs `scripts/check_attribution.py` on every push and pull request. The check fails, blocking merge, if:

1. Any file under `sources/gogpt/derived/` or `dashboards/` lacks a `modifications:` YAML front-matter block.
2. `sources/n2yo/cache/` gains more than 5 new TLE entries in one push (bulk-redistribution signal).
3. A citation string for GOGPT is present in a derived artifact without matching the canonical string in `sources/gogpt/ATTRIBUTION.md`.
4. Any file with the substring "SatDump" and extension `.json`, `.cfg`, `.sh`, or `.py` is added under `sources/satdump/` (i.e. we appear to be vendoring SatDump's own code).

The check is opinionated by design. It is easier to argue with the check than to silently redistribute a license breach.

---

## Precedence

If you find any conflict between this file and an upstream license or ToS, the upstream binds. This file is a summary and a helper — not an authoritative substitute for the upstream text. When in doubt, read the upstream license.

---

*This document is authored by the Grand Council (Session 4 ruling) and is versioned in git. Any change requires a corresponding commit to `giomj/dev` with the Architect's approval.*
