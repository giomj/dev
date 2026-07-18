# Grand Council — Session 3 Intake

**Convened:** 2026-07-18
**Emperor:** James Gianotti
**Project of record:** `conceptual-engineering-references` (new)
**Sibling of:** `/Users/james/Downloads/project/conceptual_engineering/references` (local)

## Artifact J — n2yo.com

**Tier:** Aggregator / operational (real-time skin over USSPACECOM catalog)
**Access:** REST v1 with per-verb rate limits; free tier
**Sample captured:** ISS TLE (NORAD 25544) — see `sources/n2yo/samples/iss_tle_25544.txt`

Claims C1–C3 — see `sources/n2yo/catalog.md`.

## Artifact K — SatDump

**Tier:** Reference / operational open-source software (leading amateur ground-station suite)
**Access:** GitHub (SatDump/SatDump), F-Droid on Android, prebuilt binaries on Windows/macOS/Linux
**Coverage:** RTL-SDR, Airspy, AirspyHF, HackRF, LimeSDR Mini, BladeRF, Pluto family; pipeline-graph architecture

Claims C1–C4 — see `sources/satdump/catalog.md`.

## Artifact L — Global Oil & Gas Plant Tracker (GOGPT)

**Tier:** Primary-secondary hybrid (leading independent aggregator, peer-reviewed)
**Access:** Request-form CSV; CC BY 4.0
**Coverage:** 1,047 GW in-development; ≥50 MW globally, ≥20 MW EU+UK; bi-annual releases

Claims C1–C4 — see `sources/gogpt/catalog.md`.

## Artifact M — Integration plan

**Proposed structure of `conceptual-engineering-references`:**

```
conceptual-engineering-references/
├── sources/
│   ├── n2yo/          # aggregator: real-time orbits + passes
│   ├── satdump/       # operational software: decode LEO downlinks
│   └── gogpt/         # dataset: global oil & gas plant inventory
├── samples/           # small captured samples of each
├── notes/             # bridging notes between references and the /references folder
└── README.md
```

**Proposed portfolio links:**

- **gravitational-compass** ↔ **n2yo** — n2yo TLEs as ground-truth for a heliocentric propagation cross-check. n2yo is *not* itself a gravitational tool; it is a source-of-truth for real orbits that must satisfy any correct gravity model.
- **grid-and-chain-mobile** ↔ **n2yo API + SatDump** — a plausible mobile companion is a live "what's above me" pass-alert overlay backed by the n2yo REST API, and (Android-only) a receive-and-decode integration with SatDump for weather-sat imagery.
- **conceptual-engineering-references / references** ↔ **GOGPT** — GOGPT is a canonical dataset for any energy-systems chapter in the conceptual-engineering syllabus. Suitable for a case study on plant-level fleet analysis, CO₂ accounting, and stranded-asset risk.
- **force-carriers** ↔ **none directly** (Standard Model artifact — no natural bridge here).
- **recursive-state-dynamics** ↔ **GOGPT** (weak) — as a dataset of state transitions (proposed → permitted → operating → retired), GOGPT is a legitimate corpus to test RSD state-transition modelling *if* the L/K/E formalism has a discrete-transitions analog.

## Cross-cutting properties to name

- **Licensing gradient.** n2yo API (proprietary key, ToS-gated), SatDump (open source, GPL-family), GOGPT (CC BY 4.0 with attribution). The references project must respect each — the strictest binding is n2yo's ToS + rate-limited key.
- **Evidence-tier gradient.** GOGPT (peer-reviewed, primary-secondary hybrid, methodology footnoted) > SatDump (operational reference, community-maintained) > n2yo (aggregator, no independent editorial). A conceptual-engineering references project should quote each in a footnote that names its tier.
- **Cadence gradient.** n2yo (real-time), SatDump (per-release, ≈quarterly), GOGPT (bi-annual). Cross-references between the three must acknowledge that each freezes at a different rate.
