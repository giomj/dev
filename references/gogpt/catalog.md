# Global Oil and Gas Plant Tracker (GOGPT) — Source Catalog

**Publisher:** Global Energy Monitor (GEM)
**Project page:** https://globalenergymonitor.org/projects/global-oil-gas-plant-tracker
**Download page:** https://globalenergymonitor.org/projects/global-oil-gas-plant-tracker/download-data/
**Release cadence:** Bi-annual (January & July/August)
**Ingested:** 2026-07-18

## Scope

- **What it tracks:** All oil- and gas-fired power plants generating electricity — peaking, base load, captive industrial, cogeneration.
- **Threshold:** ≥ 50 MW globally, ≥ 20 MW in EU + UK.
- **Combined cycle:** threshold applied to whole set, not per component.
- **Excludes:** gas boilers producing only district / industrial heat; plants cancelled or retired before 2020.
- **LNG:** included, marked with `Fuel type = LNG`.
- **Headline totals (Jan 2026 release):**
  - Global in-development capacity: **1,047 GW**
  - USA: 252 GW  |  China: 153 GW  |  Together: >1/3 of global in-development
  - >50% of in-development capacity concentrated in five countries; remaining 50% spread across 106 countries
  - Coal-to-gas switching: 18% of in-development gas globally
  - ~6% of operating capacity is oil-only; ~3% of in-development capacity is oil-only
  - Texas alone: ~1/3 of U.S. gas power in development

## Data structure

Two-layer system:

1. **Database (tabular)** — one row per unit
   - Plant owner + parent company
   - Plant status (proposed, permitted, under construction, operating, retired, etc.)
   - Plant type
   - Location (coordinates)
   - Location accuracy: `exact` or `approximate`
2. **Wiki pages (per plant)** — project background, financing, environmental impacts, public opposition, coordinates, maps, footnoted references.

For each unit, GEM computes:
- Annual CO₂ emissions
- Lifetime CO₂ emissions

## Access

- **Format:** Excel (XLSX) issued behind a request form (name + email + purpose). Not a direct download URL.
- **Also available:** map + summary tables at Earth Genome-built interface (linked from project page).
- **API:** None. Reissued each release cycle.
- **License:** **Creative Commons Attribution 4.0 International (CC BY 4.0)** — free to share/adapt with attribution. Attribution elements shipped inside the download.
- **Citation format:** `Global Oil and Gas Plant Tracker, Global Energy Monitor, <Month Year> release.`

## Release history

| Release | Change |
|---|---|
| January 2026 | Latest — supplement covers IRP filings in the U.S. |
| August 2025 | Column name changes/additions |
| January 2025 | Column name changes/additions |
| August 2024 | Column name changes/additions |
| August 2023 | Tracker renamed **GGPT → GOGPT** (added oil coverage) |
| February 2023 | UN region/subregion definitions adopted; "Türkiye" replaces "Turkey" |
| July 2022 | Coal-to-gas conversions explicitly tracked |

## Methodology (verbatim structure)

- Primary sources: government data, national energy plans, permit/application databases, corporate reports, news media, local NGOs.
- Validation: cross-checked against Platts World Energy Power Plant DB + WRI's Global Power Plant Database + company/government sources.
- Peer review: gas-plant data circulated to region-familiar reviewers where possible (Centre for Research on Energy and Clean Air, Beyond Fossil Fuels, Environmental Integrity Project, Sierra Club, others).
- Coordinates: exact from permits when available, otherwise visually determined via Google Maps / Google Earth / Planet Labs / Wikimapia; location accuracy flagged.

## Evidence tier

- **Primary-secondary hybrid.** GEM is not the plant operator, but it is the leading independent aggregator; validated against Platts + WRI. Peer-reviewed within its domain. Used by IEA, IPCC, and academic research.
- CC BY 4.0 licensing makes it directly usable in the conceptual-engineering references without permission bottlenecks.

## Claims Under Review (for council)

- **C1** — GOGPT is the leading open-license (CC BY 4.0) plant-level global tracker of oil/gas power capacity, with bi-annual updates and validated cross-references to Platts + WRI.
- **C2** — 1,047 GW in-development capacity in 2025 is a real, plant-level-summed figure — not a top-down estimate. It reflects proposed + permitted + under-construction, not "will be built."
- **C3** — The Jan 2026 U.S. IRP-filing supplement is a **filing artifact**, not a build artifact. IRPs represent utility planning intent, not commitments; the U.S. 252 GW number likely overstates likely-built capacity by a factor that depends on IRP → construction conversion rates.
- **C4** — CC BY 4.0 attribution is satisfied by the strings shipped inside each download; we must preserve them and cite `GOGPT, GEM, <release>` on every derived artifact.
