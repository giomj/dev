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

## Regime 4 — NOAA Space Weather Prediction Center (public domain, U.S. Government)

**What we hold:** Catalog documentation (`noaa/catalog.md`) and ingested JSON-lines snapshots of the 3-hour planetary Kp index and solar wind plasma/magnetometer products under `noaa/data/`, produced by `scripts/ingest/noaa_swpc.py`.

**Provenance chain:** NOAA SWPC is the **primary** source — there is no aggregator in this chain. Data is fetched directly from `services.swpc.noaa.gov`.

**Binding:** U.S. Government works are not subject to copyright protection in the United States (17 U.S.C. § 105). License identifier: `public-domain-USG`. There is no redistribution restriction, but courtesy attribution is still required and is carried on every record. See [`UPSTREAM_TERMS.md`](UPSTREAM_TERMS.md) for SWPC's rate-limit and polling-cadence guidance — this shelf treats SWPC files as static-by-URL resources refreshed on a fixed schedule and paces ingest with a 1-second delay between the three product fetches.

**Canonical citation:** `NOAA Space Weather Prediction Center, U.S. Department of Commerce.` (see [`noaa/ATTRIBUTION.md`](noaa/ATTRIBUTION.md))

**Downstream obligation:** Never conflate the 3-hour observed Kp (`kp_index_3h`) with the 1-minute estimated Kp (`kp_index_1m`) — they are different products with different latency/accuracy tradeoffs and are not directly comparable.

---

## Regime 5 — USGS Earthquake Hazards Program (public domain, U.S. Government)

**What we hold:** Catalog documentation (`usgs/catalog.md`) and ingested JSON-lines snapshots of the rolling 24-hour M2.5+ earthquake feed under `usgs/data/`, produced by `scripts/ingest/usgs_earthquake.py`.

**Provenance chain:** USGS Earthquake Hazards Program is the **primary** source, fetched directly from `earthquake.usgs.gov`. No aggregator.

**Binding:** U.S. Government work, not subject to U.S. copyright (17 U.S.C. § 105). License identifier: `public-domain-USG`. USGS actively rate-limits and returns HTTP 429 under load; `scripts/ingest/usgs_earthquake.py` aborts cleanly on 429 rather than retry-hammering, per [`UPSTREAM_TERMS.md`](UPSTREAM_TERMS.md).

**Canonical citation:** `USGS Earthquake Hazards Program, U.S. Geological Survey.` (see [`usgs/ATTRIBUTION.md`](usgs/ATTRIBUTION.md))

**Downstream obligation:** Never quote an earthquake magnitude without its magnitude type (`mww`, `ml`, `md`, etc.) — magnitudes on different scales are not directly comparable.

---

## Regime 6 — JPL HORIZONS (public domain, NASA/Caltech)

**What we hold:** Catalog documentation (`horizons/catalog.md`) and ingested JSON-lines snapshots of planetary state vectors under `horizons/data/`, produced by `scripts/ingest/jpl_horizons.py`.

**Provenance chain:** JPL Horizons System is the **primary** source, fetched directly from `ssd.jpl.nasa.gov`. No aggregator.

**Binding:** NASA/JPL (operated by Caltech under a NASA contract) content of this kind is treated as public domain. License identifier: `public-domain-NASA`. See [`UPSTREAM_TERMS.md`](UPSTREAM_TERMS.md) for target/observer/frame conventions — HORIZONS returns materially different numbers for the same nominal query depending on `CENTER`/reference frame, so every record explicitly carries `target_body` and `reference_frame`.

**Canonical citation:** `JPL Horizons System, NASA Jet Propulsion Laboratory / California Institute of Technology.` (see [`horizons/ATTRIBUTION.md`](horizons/ATTRIBUTION.md))

**Downstream obligation:** Never present a HORIZONS position/vector without its reference frame and center body — the same target body's coordinates differ substantially between heliocentric and geocentric frames.

---

## Regime 7 — Our World in Data / OWID (CC BY 4.0, with mixed upstream provenance)

**What we hold:** Catalog documentation (`owid/catalog.md`), the upstream license analysis (`owid/UPSTREAM_LICENSES.md`), pinned raw CSV pulls, and ingested JSON-lines records under `owid/data/`, produced by `scripts/ingest/owid.py`.

**Provenance chain:** OWID is an **aggregator**. The primary sources vary by dataset: Global Carbon Budget v15 and the Maddison Project 2023 (both CC BY 4.0, fully clean) for the CO₂ metrics; Ember (CC BY 4.0) blended with the Energy Institute (copyright-reserved, not licensed for bulk redistribution) for the electricity-share metrics.

**Binding:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) governs OWID's own compilation and the Ember-sourced rows. **This shelf never ingests `energy-consumption-by-source-and-country`** (BLOCKED — sole upstream is the Energy Institute Statistical Review, which is not licensed for bulk redistribution) and **never retains Energy-Institute-sourced rows** in `share-elec-by-source` or `share-electricity-renewables` — `scripts/ingest/owid.py` filters those datasets to Ember's coverage window and tags every retained row `sub_source: "Ember"`. See [`owid/UPSTREAM_LICENSES.md`](owid/UPSTREAM_LICENSES.md) for the full upstream-chain analysis.

**Canonical citation:** `Our World in Data, ourworldindata.org, CC BY 4.0 — with upstream attribution per dataset (Global Carbon Budget v15, Maddison Project 2023, Ember).` (see [`owid/ATTRIBUTION.md`](owid/ATTRIBUTION.md) for the full per-dataset citation table)

**Downstream obligation:** Never compact away the `sub_source` field on OWID-derived rows — it is the only machine-readable signal distinguishing a CC BY 4.0 Ember row from a copyright-reserved Energy Institute row that must never appear in this shelf's output at all.

---

## Regime 8 — IRENA / International Renewable Energy Agency (© IRENA, pinned-CSV replay only)

**What we hold:** Catalog documentation (`irena/catalog.md`), the upstream posture analysis (`irena/UPSTREAM_LICENSES.md`), and — once a human performs a manual PxWeb export — pinned CSVs and derived JSON-lines records under `irena/data/`, replayed (never fetched) by `scripts/ingest/irena_pinned.py`.

**Provenance chain:** IRENA is the **primary** source for Renewable Capacity Statistics 2025, Renewable energy statistics 2025, and Renewable Power Generation Costs in 2024. No aggregator.

**Binding:** © IRENA. IRENA's PxWeb data explorer sits behind an access layer that rejects automated clients; per the emperor's explicit ruling, **no script in this shelf may fetch from `www.irena.org` or any IRENA-operated endpoint.** `scripts/ingest/irena_pinned.py` performs pinned-CSV replay only — a human must manually export each table from the PxWeb UI and drop the CSV into `irena/data/`. Every value carries the © IRENA citation and, where applicable, the specific IRENA publication it was pinned from. See [`irena/UPSTREAM_LICENSES.md`](irena/UPSTREAM_LICENSES.md) for the two license regimes (restrictive yearbook data vs. more permissive LCOE data).

**Canonical citation:** `© IRENA <year>. IRENA (2025), Renewable Capacity Statistics 2025 / Renewable energy statistics 2025 / Renewable Power Generation Costs in 2024.` (see [`irena/ATTRIBUTION.md`](irena/ATTRIBUTION.md) for the per-dataset citation table)

**Downstream obligation:** Never automate a fetch against irena.org from any script in this repository, regardless of how convenient a public-looking CSV export URL appears to be. Never quote an LCOE figure without its technology qualifier.

---

## Precedence

If you find any conflict between this file and an upstream license or ToS, the upstream binds. This file is a summary and a helper — not an authoritative substitute for the upstream text. When in doubt, read the upstream license.

---

*This document is authored by the Grand Council (Session 4 ruling) and is versioned in git. Any change requires a corresponding commit to `giomj/dev` with the Architect's approval.*
