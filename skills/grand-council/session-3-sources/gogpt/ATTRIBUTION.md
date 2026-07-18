# GOGPT Attribution

**Canonical citation string** (use verbatim in every derived artifact):

> Global Oil and Gas Plant Tracker, Global Energy Monitor, January 2026 release.

**License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

**Upstream:** [globalenergymonitor.org/projects/global-oil-gas-plant-tracker](https://globalenergymonitor.org/projects/global-oil-gas-plant-tracker/)

**Release cadence:** January and July annually.

## Required modifications block

Every derived artifact — table, chart, dashboard panel — must carry a YAML front-matter block naming the transformation applied. Example:

```yaml
---
source: GOGPT January 2026 release
license: CC BY 4.0
attribution: "Global Oil and Gas Plant Tracker, Global Energy Monitor, January 2026 release."
modifications:
  - status-weighted aggregation (proposed / permitted / UC / operating / retired)
  - country-level rollup with unit-preserved capacity (MW → GW)
  - Lorenz-curve computation over capacity distribution
---
```

The CI check (`scripts/check_attribution.py`) verifies this block on every push. Missing block = failed check = blocked merge.

## What NOT to do

- **Do not** quote a raw capacity number ("1,047 GW in development") without the status breakdown. This violates the Session 3 ruling and misleads the reader.
- **Do not** compute CO₂ or TWh from GOGPT capacity without stating your capacity-factor assumption. Gas ≠ coal ≠ solar in duty cycle.
- **Do not** cite GOGPT as "peer-reviewed" in the journal sense — it is reviewed by domain collaborators (CREA, Beyond Fossil Fuels, EIP, Sierra Club).

## What TO do

- **Do** state the release date (`January 2026`) in every citation. This is not decorative — GOGPT is updated biannually and a stale citation can be off by ~15% capacity.
- **Do** show status breakdowns as primary visuals. A stacked bar of proposed/permitted/UC/operating/retired is more honest than a headline number.
- **Do** name the aggregator or intermediary if you did not fetch from GEM directly.
