# OWID — Upstream License Audit

**Audited:** 2026-07-18
**Auditor:** Grand Council license-audit subagent
**Scope:** Datasets planned for ingest in Wave 2 of Session 5 expansion.

> **This is a gate document, not an ingest specification.** No ingest code is authorized against OWID
> until the BLOCK-level and open questions in Sections 3, 5, and 6 are resolved by the emperor.
> Every license quotation below is verbatim from the cited URL, retrieved 2026-07-18 (OWID API
> `dateAccessed` fields for upstream sources are quoted where OWID records them).

---

## 0. Executive summary (read this first)

The Skeptic's session-5 binding is confirmed on the facts. OWID's CC BY 4.0 covers **only OWID's own
transformations, site content, code output, and the specific indicators OWID itself produces**. It does
**not** relicense the underlying third-party data. Each upstream dataset carries its own terms, and for
our four target datasets those terms are **not uniformly CC BY**.

Findings by dataset:

| Target dataset | OWID slug | Primary upstream | Upstream license | Redistribution status |
|---|---|---|---|---|
| Primary energy consumption by source | `energy-consumption-by-source-and-country` | Energy Institute — Statistical Review of World Energy (2025) | **© Energy Institute 2025 — all rights reserved**, limited quote-with-attribution permission; extensive reproduction needs written permission | **CONDITIONAL / BLOCK-review** |
| Electricity generation mix | `share-elec-by-source` | Ember (2026) + Energy Institute (2025) fallback | Ember **CC BY 4.0**; EI portion © Energy Institute | **MIXED** — Ember portion clean, EI portion conditional |
| Renewable electricity share | `share-electricity-renewables` | Ember (2026) + Energy Institute (2025) fallback | Ember **CC BY 4.0**; EI portion © Energy Institute | **MIXED** — same as above |
| CO₂ per capita and per GDP | `co-emissions-per-capita`, `co2-intensity` | Global Carbon Budget v15 (GCP, 2025) + population/Maddison | **CC BY 4.0** across all components | **CLEAN** |

**BLOCK-level issues:**

1. **Energy Institute Statistical Review is copyright-reserved, not CC.** Its terms state "All such
   rights are reserved" and forbid reproduction "for any other purpose whatsoever … without the written
   permission of the EI." A separate EI page grants a *narrow* permission to "quote … provided that you
   attribute the source," but requires written permission for "extensive reproduction of tables and/or
   charts." Ingesting the full country-by-country annual time series into a public reference shelf is
   plausibly "extensive reproduction," which is **not** covered by the quote permission. This affects
   the primary-energy dataset directly and the electricity datasets partially (EI fallback rows).
2. **S&P Global data embedded in the Statistical Review is expressly non-redistributable.** EI states:
   "The redistribution or reproduction of data whose source is S&P Global is strictly prohibited without
   prior authorization from S&P Global." Some Statistical Review series historically incorporate S&P
   Global commodity/refining inputs. We cannot currently isolate which OWID energy cells are S&P-derived.
3. **OWID itself flags some data as non-redistributable at the API layer** (`403 - Data is
   non-redistributable`). None of our four target CSV endpoints currently return 403 (all return 200 as
   of 2026-07-18), but this status can change per source-license update and must be re-checked at ingest.

**Not a problem for our four datasets, but noted per the Skeptic's warning:**

- **IEA proprietary data**: IEA standalone datasets are **excluded** from IEA's CC BY Open Use Terms and
  "most IEA paid datasets" are Non-CC. IEA data does **not** appear as a direct upstream in any of our
  four target OWID indicators. It can enter *indirectly* via Ember's "Yearly Electricity Data" (which
  compiles from EIA, Eurostat, Energy Institute, UN — see §2.2), but Ember relicenses its compiled
  product as CC BY 4.0. EIA (US) is a US-government work; IEA (Paris) is the restrictive one — keep them
  distinct.
- **World Bank share-alike-like terms**: The World Bank's general *Terms of Use for Datasets* are **not
  blanket CC BY**. For the "remainder of the Materials" they permit only non-commercial, no-derivative
  use without written consent, and dataset-specific terms are "incorporated by reference." No World Bank
  series is a direct upstream in any of our four target datasets. If Wave 3 adds World Bank series (GDP,
  energy access, etc.), each must be audited individually because the license varies by dataset.

**Recommendation in one line:** Ingest the CO₂ datasets (clean CC BY). Hold the primary-energy dataset
and the EI-fallback rows of the electricity datasets pending an emperor decision on whether to (a) seek
EI written permission, (b) restrict the energy series to Ember-only sourced rows, or (c) drop the EI-only
series. See §5.

---

## 1. OWID's own license

OWID's licensing position is stated across three places: the FAQ/user-guidelines page, each indicator's
"Reuse this work" block, and the Chart Data API documentation.

### 1.1 What CC BY 4.0 covers (OWID-produced material only)

From **OWID FAQs — "Can I reuse or republish your data?"**
(https://ourworldindata.org/faqs), verbatim:

> "It depends on the data source, which is always indicated along with the data.
>
> Most of the data on Our World in Data comes from third-party providers (such as the WHO, UN, and World
> Bank) and is subject to the license terms of those providers. You should always check their license
> before reusing or republishing the data. Our work would not be possible without the data providers we
> rely on, so we ask you to always respect their license terms and cite them appropriately.
>
> Some of the data on our site is produced by us — you can tell because it will say 'Official data
> collated by Our World in Data', 'with major processing by Our World in Data', or similar. Data produced
> by us falls under our permissive CC BY license; you have permission to use, reproduce, and distribute
> it, provided that you cite us."

From **OWID FAQs — "Can I reuse or republish third-party material made available on your website?"**,
verbatim:

> "Most of the data and some of the charts on Our World in Data come from third-party providers (such as
> the WHO, UN, and World Bank). Such materials are subject to the license terms of those providers.
>
> You should always check their license before reusing or republishing their data, charts, or other
> material."

From the **per-indicator "Reuse this work" block** (example: `oil-proved-reserves`), verbatim:

> "All data produced by third-party providers and made available by Our World in Data are subject to the
> license terms from the original providers. … All data, visualizations, and code produced by Our World
> in Data are completely open access under the Creative Commons BY license. You have the permission to
> use, distribute, and reproduce these in any medium, provided the source and authors are credited."

**Interpretation.** The critical phrase is the split: **"data produced by third-party providers … subject
to the license terms from the original providers"** vs. **"data … produced by Our World in Data … under
the Creative Commons BY license."** OWID's CC BY 4.0 is therefore a **thin layer** over its own
processing and derived indicators. It is *not* an umbrella relicense of the upstream numbers. The
Skeptic's binding is correct on the facts.

### 1.2 The "processing tier" signal in OWID metadata

OWID marks each indicator with a processing tier that tells us how much of the value is OWID's own work
vs. a passthrough of upstream numbers. All four of our target datasets carry:

> "– with major processing by Our World in Data"

"Major processing" (vs. "minor processing" or "collated by OWID") means OWID performed substantial
transformation (unit conversion, substitution-method energy accounting, per-capita/per-GDP derivation,
country-name standardization, source stitching). This strengthens OWID's own CC BY claim over the
*derived series* — but it does **not** extinguish the upstream provider's rights over the underlying
figures, and OWID does not claim it does. OWID's own data-package README says so explicitly (see §1.4).

### 1.3 Grapher software is NOT open (separate from data)

From **OWID FAQs — "What software do you use for your visualizations — and can I use it?"**, verbatim:

> "However, the Grapher is not freely licensed for reuse without permission. If you'd like to copy,
> modify, distribute, or use any part of the Grapher codebase in your own project, product, or service,
> you'll need to first request written permission from Global Change Data Lab. … (Historical note: prior
> Grapher versions were released under the MIT License. Copies of the repository obtained under that
> earlier license remain subject to its terms for the versions they covered.)"

Not relevant to data ingest, but noted so no one assumes "OWID is all CC BY." The **charting code** is
proprietary; only *data OWID produces* and *site writing* are CC BY.

### 1.4 OWID's own disclaimer inside every data package (README)

From the data-package README returned by `GET /grapher/{slug}.readme.md`
(example: `energy-consumption-by-source-and-country.readme.md`), verbatim:

> "Our World in Data is almost never the original producer of the data - almost all of the data we use
> has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you
> adhere to the sources' license and to credit them correctly. Please note that a single time series may
> have more than one source - e.g. when we stich together data from different time periods by different
> producers or when we calculate per capita metrics using population data from a second source."

**This is the single most important sentence for our audit.** OWID explicitly places the license-
compliance burden on the downstream reuser (us) and confirms that a single OWID column can blend multiple
upstream licenses. Our ingest must therefore track licenses at the **column/source** level, not the
dataset level.

### 1.5 Citation obligation OWID imposes on us

From **OWID FAQs — "How should I cite your data?"**, verbatim:

> "When reusing the data we have on our site (e.g., to do an analysis, make your own chart, or build on
> it in another way), you must credit both Our World in Data *and* the underlying third-party data
> provider. You should also always check the license of third-party data providers before reusing or
> republishing the data."

So attribution is **dual**: OWID + upstream provider, for every value.

---

## 2. Dataset-by-dataset upstream chain

Source of truth for each chain: the OWID Chart Data API metadata
(`GET https://ourworldindata.org/grapher/{slug}.metadata.json`) and the per-indicator metadata
(`GET https://api.ourworldindata.org/v1/indicators/{id}.metadata.json`), both retrieved 2026-07-18. The
`license` object quoted below is OWID's own record of the upstream license for that origin.

---

### 2.1 Global primary energy consumption by source (annual, by country)

- **OWID page/chart:** https://ourworldindata.org/grapher/energy-consumption-by-source-and-country
  (topic page: https://ourworldindata.org/energy)
- **OWID chart citation string (verbatim):** `Energy Institute - Statistical Review of World Energy (2025)`
- **Processing tier:** "with major processing by Our World in Data" (substitution-method input-equivalents)
- **Columns ingested:** Coal, Oil, Gas, Nuclear, Hydro, Wind, Solar, Biofuels, Other renewables
  (each in TWh). All nine columns share the same single upstream.

**Upstream source(s):**

- **Energy Institute — Statistical Review of World Energy (2025 edition)** (the successor to the
  bp Statistical Review, transferred to EI in 2023).
  - OWID-recorded `urlMain`: https://www.energyinst.org/statistical-review/
  - OWID-recorded `dateAccessed`: 2025-06-27
  - OWID-recorded upstream `license` object:
    `{"url": "https://www.energyinst.org/terms", "name": "© Energy Institute 2025"}`

**Upstream license — verbatim from Energy Institute Terms and Conditions**
(https://www.energyinst.org/terms):

> "The EI is the owner or the licensee of all intellectual property rights in our Sites, and in the
> material published on it, unless explicitly indicated otherwise. Those works are protected by copyright
> laws and treaties around the world. All such rights are reserved."

> "Copies of documents contained on the Sites may only be made available for information purposes and
> solely for the private use of the Sites' users. Any use or reproduction of such documents for any other
> purpose whatsoever is expressly forbidden without the written permission of the EI."

> "No licence or right, other than the right to view on the Sites, is granted to any person in respect of
> any intellectual property rights."

> "Users should note that some parts of the Product may be owned by third parties and as such is governed
> by Licences provided by those third parties."

**Upstream license — verbatim from the EI Statistical Review "About" page**
(https://www.energyinst.org/statistical-review/about):

> "It is completely free for users to access."

> "Publishers are welcome to quote from this document provided that they attribute the source to the
> Energy Institute Statistical Review of World Energy 2023."

> "However, where extensive reproduction of tables and/or charts is planned, permission must first be
> obtained from: [Email: statisticalreview@energyinst.org]"

> "The redistribution or reproduction of data whose source is S&P Global is strictly prohibited without
> prior authorization from S&P Global."

**Transitive obligations that pass through to us:**

- **Attribution:** Required and mandatory. Verbatim in-line string OWID provides:
  `Energy Institute - Statistical Review of World Energy (2025) – with major processing by Our World in Data`
  Full string: `Energy Institute - Statistical Review of World Energy (2025) – with major processing by
  Our World in Data. "[series name]" [dataset]. Energy Institute, "Statistical Review of World Energy"
  [original data].`
- **Share-alike:** None stated (EI is not a copyleft/CC license).
- **No-derivatives:** Not an explicit CC-ND, but effectively restrictive — "any use or reproduction …
  for any other purpose … is expressly forbidden without written permission."
- **Commercial-use restriction:** The Terms reserve all rights; no commercial grant. (Our archive is
  non-commercial, which helps, but the EI grant is by permission, not by license class.)
- **Redistribution restriction — BLOCK:** Publishing the full annual country-level TWh matrix on a
  public shelf is likely "extensive reproduction of tables," which EI says "permission must first be
  obtained." The narrow "quote with attribution" permission does not clearly cover bulk data
  redistribution.
- **S&P Global carve-out — BLOCK:** Any Statistical Review cells sourced to S&P Global are "strictly
  prohibited" from redistribution absent S&P authorization. We cannot currently identify which cells
  these are from OWID metadata.

**Note on the OWID API behavior:** As of 2026-07-18, `GET
energy-consumption-by-source-and-country.csv` returns HTTP 200 (OWID currently serves it, i.e. OWID does
not mark this specific series `403 - Data is non-redistributable`). OWID serving it does **not** grant us
redistribution rights — OWID's README explicitly disclaims that ("it is your responsibility to ensure
that you adhere to the sources' license"). Treat 200 as "OWID will hand you the bytes," not "you may
republish the bytes."

**Verdict for this dataset:** **CONDITIONAL / BLOCK-review.** Fetch for internal analysis is defensible;
public redistribution of the full matrix requires either EI written permission or a scope reduction. See
§5 and §6.

---

### 2.2 Electricity generation mix (annual, by country)

- **OWID page/chart:** https://ourworldindata.org/grapher/share-elec-by-source
  (absolute TWh variant: https://ourworldindata.org/grapher/electricity-prod-source-stacked)
- **OWID chart citation string (verbatim):**
  `Ember (2026); Energy Institute - Statistical Review of World Energy (2025)`
- **Processing tier:** "with major processing by Our World in Data"
- **Columns ingested:** Coal, Gas, Hydro, Solar, Wind, Oil, Nuclear, Bioenergy, Other renewables
  excluding bioenergy (each as % of electricity). Every column lists the same three origins.

**Upstream source(s)** (OWID records three origins per column):

1. **Ember — "Yearly Electricity Data"**
   - `urlMain`: https://ember-energy.org/data/yearly-electricity-data/
   - `dateAccessed`: 2026-04-24
   - `license`: `{"url": "https://ember-energy.org/creative-commons/", "name": "CC BY 4.0"}`
   - OWID-recorded provenance note (verbatim): "The data is collected from multi-country datasets (EIA,
     Eurostat, Energy Institute, UN) as well as national sources (e.g China data from the National Bureau
     of Statistics)."
2. **Ember — "Yearly Electricity Data Europe"**
   - `license`: `{"url": "https://ember-energy.org/creative-commons/", "name": "CC BY 4.0"}`
   - OWID-recorded provenance note (verbatim): "Most of the data is taken from the European Commission's
     Eurostat annual data."
3. **Energy Institute — Statistical Review of World Energy (2025)** — used to backfill/extend earlier
   years and countries not covered by Ember.
   - `license`: `{"url": "https://www.energyinst.org/terms", "name": "© Energy Institute 2025"}`

**Upstream license — Ember, verbatim** (https://ember-energy.org/creative-commons/):

> "Ember content is released under a Creative Commons Attribution Licence (CC-BY-4.0)"

> "This means you're free to share and adapt our work – as long as you credit us."

> "If you would like to use our logo, we ask that you request permission."

**Upstream license — Energy Institute:** see §2.1 (copyright-reserved; quote-with-attribution;
extensive-reproduction-needs-permission; S&P carve-out).

**Transitive obligations that pass through to us:**

- **Ember portion — CLEAN.** CC BY 4.0. Attribution required (`Ember (2026)`), no share-alike, no
  no-derivatives, commercial use allowed. Do **not** use Ember's logo without permission.
- **Ember's own upstreams (EIA, Eurostat, Energy Institute, UN, national stats):** Ember has already
  relicensed its **compiled** product as CC BY 4.0. We rely on Ember's relicense for the Ember-sourced
  cells; we are not separately bound to EIA/Eurostat/UN terms for the portion Ember publishes as its own
  CC BY dataset. **Caveat:** this rests on Ember's authority to relicense, which Ember asserts; if EI
  data flows *through* Ember, EI's terms could arguably still attach. This is an open question — see §6.
- **Energy Institute portion — CONDITIONAL/BLOCK.** For any cells whose origin is the EI Statistical
  Review directly (not via Ember), the §2.1 restrictions apply. OWID's metadata lists EI as a distinct
  origin on these columns, so some rows are EI-direct.
- **IEA note:** No IEA origin is listed on these columns. IEA data is *not* a direct upstream here. (If
  it enters at all, it does so buried inside Ember's compilation, already wrapped in Ember's CC BY.)

**Verdict:** **MIXED.** Ember-sourced rows are safe to redistribute under CC BY 4.0 with attribution.
EI-direct backfill rows carry the §2.1 conditional/BLOCK risk.

---

### 2.3 Renewable electricity share (annual, by country)

- **OWID page/chart:** https://ourworldindata.org/grapher/share-electricity-renewables
- **OWID chart citation string (verbatim):**
  `Ember (2026); Energy Institute - Statistical Review of World Energy (2025)`
- **Processing tier:** "with major processing by Our World in Data"
- **Column ingested:** Renewables - % electricity (single derived column)

**Upstream source(s):** Identical chain to §2.2 — Ember "Yearly Electricity Data" + "Yearly Electricity
Data Europe" (both CC BY 4.0) with Energy Institute Statistical Review (2025) backfill (© Energy
Institute). This is a derived aggregate (sum of solar + wind + hydro + bioenergy + geothermal/wave/tidal
shares) computed by OWID.

**Upstream license:** see §2.2 (Ember CC BY 4.0) and §2.1 (EI copyright-reserved).

**Transitive obligations that pass through to us:** Same as §2.2. The aggregation itself is OWID's own
"major processing," so the *derived percentage* is arguably OWID-CC-BY, but it is computed from
underlying values that carry Ember + EI terms. Attribution string:
`Ember (2026); Energy Institute - Statistical Review of World Energy (2025) – with major processing by
Our World in Data`.

**Verdict:** **MIXED** — same profile as §2.2.

---

### 2.4 CO₂ emissions per capita and per GDP (annual, by country)

Two OWID charts cover this request.

#### 2.4a CO₂ emissions per capita

- **OWID page/chart:** https://ourworldindata.org/grapher/co-emissions-per-capita
- **OWID chart citation string (verbatim):**
  `Global Carbon Budget (2025); Population based on various sources (2024)`
- **Processing tier:** "with major processing by Our World in Data"
- **Column ingested:** Annual CO₂ emissions (per capita)

**Upstream source(s):**

1. **Global Carbon Project — Global Carbon Budget v15 (2025)**
   - `urlMain`: https://globalcarbonbudget.org/
   - `dateAccessed`: 2025-11-13
   - Canonical dataset DOI (from OWID's `citationFull`):
     Andrew, R. M., & Peters, G. P. (2025), *The Global Carbon Project's fossil CO2 emissions dataset
     (2025v15)*, Zenodo, https://doi.org/10.5281/zenodo.17417124
   - `license` objects OWID records:
     `{"url": "https://doi.org/10.5281/zenodo.5569234", "name": "CC BY 4.0"}` and
     `{"url": "https://www.icos-cp.eu/data-services/about-data-portal/data-license", "name": "CC BY 4.0"}`
   - Underlying paper: Friedlingstein et al., *Global Carbon Budget 2024*, Earth Syst. Sci. Data, 17,
     965–1039, https://doi.org/10.5194/essd-17-965-2025
2. **Population — "Various sources" (OWID long-run population series)**
   - `urlMain`: https://ourworldindata.org/population-sources
   - `license`: `{"url": "https://creativecommons.org/licenses/by/4.0/", "name": "CC BY 4.0"}`
   - This is an OWID-compiled long-run series; OWID publishes it as CC BY 4.0.

**Upstream license — Global Carbon Budget:** OWID records the GCB/GCP fossil-emissions dataset as
**CC BY 4.0** (Zenodo record https://doi.org/10.5281/zenodo.5569234 and the ICOS Carbon Portal data
license https://www.icos-cp.eu/data-services/about-data-portal/data-license, which is a Creative Commons
Attribution licence). The dataset is distributed via Zenodo and ICOS Carbon Portal under CC BY 4.0.

**Transitive obligations that pass through to us:**

- **Attribution:** Required. Cite the Global Carbon Budget dataset (Andrew & Peters 2025, Zenodo
  2025v15) and the underlying Friedlingstein et al. paper, plus OWID. In-line:
  `Global Carbon Budget (2025); Population based on various sources (2024) – with major processing by Our
  World in Data`.
- **Share-alike:** None (CC BY 4.0, no SA).
- **No-derivatives:** None.
- **Commercial-use restriction:** None (CC BY permits commercial).

**Verdict:** **CLEAN.** Fully CC BY 4.0 through the whole chain.

#### 2.4b CO₂ emissions per GDP (carbon intensity)

- **OWID page/chart:** https://ourworldindata.org/grapher/co2-intensity
  ("Carbon intensity: CO₂ emissions per dollar of GDP")
- **OWID chart citation string (verbatim):**
  `Global Carbon Budget (2025); Bolt and van Zanden – Maddison Project Database 2023`
- **Processing tier:** "with major processing by Our World in Data"
- **Column ingested:** Annual CO₂ emissions per GDP (kg per international-$)

**Upstream source(s):**

1. **Global Carbon Project — Global Carbon Budget v15 (2025)** — CC BY 4.0 (as §2.4a).
2. **Maddison Project Database 2023 (Bolt & van Zanden)** — GDP denominator.
   - `urlMain`: https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023
   - `dateAccessed`: 2024-04-26
   - `license`: `{"url": "https://www.rug.nl/ggdc/…/maddison-project-database-2023", "name": "CC BY 4.0"}`
   - Verbatim from the RUG/GGDC release page: "Maddison Project Database, version 2023 by Jutta Bolt and
     Jan Luiten van Zanden is licensed under a Creative Commons Attribution 4.0 International License."
   - Canonical citation: Bolt, Jutta and Jan Luiten van Zanden (2024), "Maddison style estimates of the
     evolution of the world economy: A new 2023 update", *Journal of Economic Surveys*, 1–41,
     DOI: 10.1111/joes.12618.

**Transitive obligations that pass through to us:**

- **Attribution:** Required — Global Carbon Budget + Maddison Project Database 2023 (Bolt & van Zanden) +
  OWID. In-line: `Global Carbon Budget (2025); Bolt and van Zanden – Maddison Project Database 2023 –
  with major processing by Our World in Data`.
- **Share-alike / no-derivatives / commercial restriction:** None. Both components CC BY 4.0.

**Verdict:** **CLEAN.** Fully CC BY 4.0.

---

## 3. Aggregate obligations we must satisfy

### 3.1 Required attribution strings (per source, verbatim — emit these exactly)

Emit **both** the OWID credit and the upstream credit for every value (OWID FAQ requires dual
attribution). Recommended per-dataset strings, taken verbatim from OWID metadata:

| Dataset | In-line attribution string to emit |
|---|---|
| Primary energy by source | `Energy Institute - Statistical Review of World Energy (2025) – with major processing by Our World in Data` |
| Electricity generation mix | `Ember (2026); Energy Institute - Statistical Review of World Energy (2025) – with major processing by Our World in Data` |
| Renewable electricity share | `Ember (2026); Energy Institute - Statistical Review of World Energy (2025) – with major processing by Our World in Data` |
| CO₂ per capita | `Global Carbon Budget (2025); Population based on various sources (2024) – with major processing by Our World in Data` |
| CO₂ per GDP | `Global Carbon Budget (2025); Bolt and van Zanden – Maddison Project Database 2023 – with major processing by Our World in Data` |

Provider-level attribution requirements the licenses themselves impose:

- **Energy Institute:** must "attribute the source to the Energy Institute Statistical Review of World
  Energy [year]" (verbatim requirement from EI About page).
- **Ember:** "you're free to share and adapt our work – as long as you credit us" (CC BY 4.0). Do NOT use
  Ember's logo without permission.
- **Global Carbon Project / GCB:** CC BY 4.0 — credit the dataset (Andrew & Peters 2025, 2025v15) and the
  Friedlingstein et al. paper.
- **Maddison Project (RUG/GGDC):** CC BY 4.0 — credit "Bolt and van Zanden, Maddison Project Database
  2023."
- **OWID:** credit Our World in Data on every value (their FAQ makes OWID + upstream a joint requirement).

### 3.2 Share-alike / "publish downstream under same terms" clauses

- **None of the four datasets carry a share-alike (SA) obligation.** CC BY 4.0 (Ember, GCB, Maddison,
  OWID-population, OWID-derived) has **no** copyleft/SA term. The Energy Institute license is
  all-rights-reserved-with-permission, which is *more* restrictive than SA but is not itself a viral SA
  clause.
- **World Bank caution (not in our four, but per Skeptic's binding):** The World Bank general dataset
  terms are **not** SA either, but they are non-commercial + no-derivative-without-consent for the
  "remainder of Materials," verbatim: "you may make non-commercial uses thereof, but you may not make any
  derivative work or commercial use … without the prior written consent of the relevant member
  institution(s)." That is *more* restrictive than SA and would BLOCK public redistribution of those
  specific World Bank series. This only matters if a future wave adds World Bank series.

### 3.3 Datasets to DROP or restrict because upstream is incompatible with public redistribution

- **DROP-candidate / restrict — Primary energy consumption by source (EI-sourced).** The Energy Institute
  Statistical Review is copyright-reserved. Public redistribution of the full country-level annual matrix
  is plausibly "extensive reproduction," which EI requires written permission for, and may contain
  S&P-Global-sourced cells that are "strictly prohibited" from redistribution. **Do not publicly
  redistribute this dataset without either (a) EI written permission or (b) a scope reduction to
  quotation-level excerpts.** Internal-analysis fetch is lower risk but still bounded by EI terms.
- **RESTRICT — Electricity mix & renewable share (EI-fallback rows).** Redistribute the Ember-sourced
  rows freely (CC BY 4.0). Withhold or flag the EI-direct backfill rows under the same reasoning as above.
  Practically, this may mean truncating the series to Ember's coverage window (Ember covers roughly 2000+
  for most countries) and dropping the EI-backfilled earlier years for public redistribution.
- **KEEP — CO₂ per capita and CO₂ per GDP.** Fully CC BY 4.0. No restriction.

---

## 4. Rate-limit / TOS constraints

### 4.1 Stated API/CSV endpoints

From the OWID Chart Data API docs (https://docs.owid.io/projects/etl/api/chart-api/):

- `GET /grapher/{slug}.csv` → chart data as CSV (params: `slug` req, `csvType` full|filtered,
  `useColumnShortNames`, `v`, `nocache`).
- `GET /grapher/{slug}.metadata.json` → chart metadata JSON.
- `GET /grapher/{slug}.zip` → CSV + metadata + README bundle.
- `GET /grapher/{slug}.readme.md` → data-package README.
- Full per-indicator metadata: `GET https://api.ourworldindata.org/v1/indicators/{id}.metadata.json`.

### 4.2 Rate limits

- **No explicit numeric rate limit is published** in the OWID API documentation (docs.owid.io) or the
  ETL API index page as of 2026-07-18. The docs carry a warning: "These APIs are under active
  development." Absence of a stated limit is **not** permission for aggressive fetching. Recommended
  self-imposed courtesy limit for ingest: serialize requests, ≤1 request/second, honor HTTP caching, and
  set a descriptive `User-Agent`. Re-verify against `robots.txt` at ingest time (not fetched in this
  audit — add to §6).

### 4.3 Non-redistributable flag at the API layer

From the API docs, both `GET /grapher/{slug}.csv` and `GET /grapher/{slug}.zip` can return:

> "403 - Data is non-redistributable"

This is OWID's machine-readable signal that a given series' upstream license forbids redistribution. As
of 2026-07-18 **all four target slugs return HTTP 200** (verified live), i.e. none is currently flagged
403. **The ingest script MUST check for 403 on every fetch and abort/quarantine that series if seen** —
the flag can be added by OWID when a source license changes.

### 4.4 TOS on automated ingestion / bulk download / caching

- The API docs actively **support** automated access: they provide `curl`, Python `requests`, JavaScript
  `fetch`, and Rust `reqwest` examples and reference example notebooks — so programmatic CSV/JSON fetching
  is explicitly an intended use.
- **Caching:** every endpoint accepts `nocache` ("If present, bypasses the cache"), implying OWID serves
  cached responses by default. We should cache aggressively and use `nocache` only when we deliberately
  need a fresh pull.
- **Terms of use for the website:** the FAQ points to OWID's legal disclaimer for site terms of use (not
  separately quoted here; add to §6 if the emperor wants the full disclaimer audited).
- **License stated on the API docs:** `CC BY 4.0` — but note this is the license for OWID-produced/
  redistributable output; it does not override the per-series 403 non-redistributable flag or upstream
  terms.

---

## 5. Recommendations for our ingest code

*(This is guidance for a future gated task. No ingest code is written or authorized by this document.)*

### 5.1 Attribution the ingest script must emit alongside each fetched value

1. Fetch and store the per-indicator metadata JSON for **every** column ingested, and persist the
   `citationLong`, `citationShort`, and each origin's `license.name` + `license.url` + `producer` +
   `dateAccessed`. Do not hardcode citations — read them from metadata so they track OWID updates.
2. For each stored value/series, emit **dual attribution**: the OWID credit **and** the upstream provider
   credit, using the verbatim strings in §3.1.
3. Store the upstream `license.name` (e.g. `"CC BY 4.0"` vs `"© Energy Institute 2025"`) as a
   machine-readable field per series so downstream consumers can filter by redistribution status.

### 5.2 UPSTREAM_LICENSES.md excerpts required on the dashboard (Historian's "apparatus criticus" binding)

Per the Historian's binding, the dashboard must surface, adjacent to each rendered series:

- The exact in-line attribution string from §3.1.
- The upstream provider name and its license name/URL (from metadata `license` object).
- For any EI-sourced series: a visible notice that the underlying Statistical Review is "© Energy
  Institute — all rights reserved," free to access, quotable with attribution, with extensive
  reproduction requiring EI written permission, and an S&P-Global redistribution carve-out.
- For CC BY series: the "CC BY 4.0" badge linking to the license and the provider.
- A footer line reproducing OWID's own disclaimer: "Our World in Data is almost never the original
  producer of the data … it is your responsibility to ensure that you adhere to the sources' license."

### 5.3 Which datasets to REMOVE / restrict from the ingest list

- **CO₂ per capita** — INGEST (clean CC BY 4.0).
- **CO₂ per GDP** — INGEST (clean CC BY 4.0).
- **Electricity generation mix** — INGEST **Ember-sourced rows only** for public redistribution; flag/
  withhold EI-backfill rows pending the emperor's decision.
- **Renewable electricity share** — same treatment as electricity mix.
- **Primary energy consumption by source** — **HOLD**. Do not publicly redistribute until the emperor
  chooses among: (a) obtain EI written permission (contact statisticalreview@energyinst.org), (b) restrict
  to non-redistributed internal analysis, or (c) drop the dataset. If kept for internal use only, gate it
  behind a non-public flag and never expose the full matrix via our public endpoints.

### 5.4 Operational guards the ingest code must include

- Abort/quarantine any series returning `403 - Data is non-redistributable`.
- Self-throttle (≤1 req/s), cache responses, set a descriptive User-Agent, and check `robots.txt`.
- Re-run this audit whenever OWID reports a source-license change (metadata `lastUpdated`/`nextUpdate`
  fields flag update cycles — e.g. EI energy "Next update: August 2026").

---

## 6. Open questions for the emperor

1. **Energy Institute "extensive reproduction" threshold — BLOCK.** EI permits quotation-with-attribution
   but requires written permission for "extensive reproduction of tables and/or charts." Does publishing
   the full country-by-country annual TWh matrix on our public shelf cross that line? Recommend we treat
   it as "yes" (extensive) and either seek EI permission (statisticalreview@energyinst.org) or restrict
   scope. **Decision needed before ingesting the primary-energy dataset.**
2. **S&P Global carve-out — BLOCK.** EI states S&P-Global-sourced data is "strictly prohibited" from
   redistribution without S&P authorization. We cannot currently identify which Statistical Review cells
   are S&P-derived from OWID metadata. Do we (a) ask EI/S&P which series are affected, (b) drop all EI
   series to be safe, or (c) accept the risk for internal-only use? Recommend (b) for public
   redistribution.
3. **Ember relicense authority.** Ember publishes its compiled "Yearly Electricity Data" as CC BY 4.0
   even though it aggregates from EIA, Eurostat, Energy Institute, and UN. We are relying on Ember's
   assertion that it may relicense the compiled product. Is the council comfortable relying on Ember's
   CC BY relicense for EI-origin data that flows *through* Ember, or should EI-via-Ember rows be treated
   with the same caution as EI-direct rows? Recommend accepting Ember's CC BY for the Ember-published
   product (that is the standard interpretation) while flagging EI-*direct* rows.
4. **OWID legal disclaimer / website ToS not fully audited.** This audit covered the FAQ, per-indicator
   reuse blocks, README, and API docs. The separate OWID legal disclaimer (linked from the FAQ under
   "What are the terms of use for your website?") was not quoted verbatim. Want it fully audited before
   ingest?
5. **robots.txt / published rate limits not fetched.** No numeric rate limit is published in the API
   docs. We did not fetch `https://ourworldindata.org/robots.txt` in this pass. Confirm we should verify
   robots.txt and any crawl-delay directive at ingest time.
6. **Population series composition.** The CO₂-per-capita denominator uses OWID's "Various sources"
   population series (published CC BY 4.0 by OWID). That series itself stitches many upstreams
   (https://ourworldindata.org/population-sources). We accepted OWID's CC BY 4.0 for the compiled series;
   confirm the council is comfortable not auditing each population sub-source individually (low risk —
   population data is broadly openly licensed, and OWID assumes the compiler attribution).
7. **Version pinning.** OWID series update on a schedule (e.g. EI energy "Next update: August 2026";
   Ember "2026" vintage). Do we pin to an archived OWID snapshot (OWID offers archived chart URLs, e.g.
   `https://archive.ourworldindata.org/...`) for reproducibility, or track latest? Pinning strengthens
   our citation record and freezes the license state we audited.

---

## Appendix 0 — Extended verbatim license text (for the permanent record)

This appendix preserves longer verbatim excerpts so future auditors do not need to re-fetch pages that
may change or disappear. All excerpts retrieved 2026-07-18.

### A0.1 Energy Institute — Terms and Conditions (https://www.energyinst.org/terms)

> "The EI is the owner or the licensee of all intellectual property rights in our Sites, and in the
> material published on it, unless explicitly indicated otherwise. Those works are protected by copyright
> laws and treaties around the world. All such rights are reserved."

> "Copies of documents contained on the Sites may only be made available for information purposes and
> solely for the private use of the Sites' users. Any use or reproduction of such documents for any other
> purpose whatsoever is expressly forbidden without the written permission of the EI."

> "No licence or right, other than the right to view on the Sites, is granted to any person in respect of
> any intellectual property rights."

> "The corporate name, logos and devices of the EI mentioned or depicted on the Sites are the property of
> the EI and may not be used without the prior written agreement of the EI."

> "Our status (and that of any identified contributors) as the authors of content on our Sites must
> always be acknowledged."

> "Users should note that some parts of the Product may be owned by third parties and as such is governed
> by Licences provided by those third parties. The EI will endeavour to ensure that you are made aware of
> any instance where this may occur."

> "Photocopying of pages printed from EI documents is especially forbidden unless such privileges are
> arranged for under separate contract with the EI."

> "The Product may not be distributed, in whole or in part, elsewhere."

**Auditor note:** The phrase "The Product may not be distributed, in whole or in part, elsewhere" appears
in the paid-product licensing section of the EI Terms; the Statistical Review is separately described as
"completely free for users to access," and the "About" page grants a narrow quote-with-attribution
permission. The two must be read together: the Statistical Review is free-to-access and quotable with
attribution, but bulk redistribution of the data tables is not clearly licensed and "extensive
reproduction" needs written permission. This ambiguity is exactly why the primary-energy dataset is a
HOLD (see §5.3, §6.1).

### A0.2 Energy Institute — Statistical Review "About" (https://www.energyinst.org/statistical-review/about)

> "It is completely free for users to access."

> "Publishers are welcome to quote from this document provided that they attribute the source to the
> Energy Institute Statistical Review of World Energy 2023."

> "However, where extensive reproduction of tables and/or charts is planned, permission must first be
> obtained from: [Email: statisticalreview@energyinst.org]"

> "The redistribution or reproduction of data whose source is S&P Global is strictly prohibited without
> prior authorization from S&P Global."

### A0.3 Ember — Creative Commons (https://ember-energy.org/creative-commons/)

> "Ember content is released under a Creative Commons Attribution Licence (CC-BY-4.0)"

> "This means you're free to share and adapt our work – as long as you credit us."

> "If you would like to use our logo, we ask that you request permission."

> "Please let us know if you're using our work: there might be a way for us to collaborate!"

> "More data will often be available on request."

### A0.4 IEA — Terms (https://www.iea.org/terms) — for the Skeptic's proprietary-IEA warning

> "The IEA makes much of its content available under open Creative Commons licences."

> "Unless one of the below exceptions to the Open Use Terms applies, all text content, reports, articles,
> commentaries, standalone graphs, figures and infographics produced by and/or sourced to the IEA and
> hosted on the IEA Websites are licensed under a Creative Commons Attribution 4.0 International (CC BY
> 4.0) licence."

> "The following items are made available under a CC BY 4.0 licence as part of the Open Use Terms: not …
> Standalone datasets, data explorers and databases, including those listed at
> https://www.iea.org/data-and-statistics/data-sets; Data annexes to the World Energy Outlook or other
> IEA publications; Any content identified as a joint or collaborative work with one or more third
> parties; and The Policies and Measures Databases."

> "Any IEA Material that is neither made available under a Creative Commons licence nor subject to the
> Terms of Use for the Polices and Measures Database is referred to as the 'Non-CC Material.' … For
> clarity, the Non-CC Material includes the Oil Market Report and most IEA paid datasets."

**Auditor note:** This confirms the Skeptic's warning in principle — IEA standalone datasets and paid
datasets are **not** CC BY. However, **no IEA origin is listed on any of our four target OWID
indicators**, so this restriction does not bind our current ingest. It is preserved here as a standing
rule: if any future OWID series lists IEA as an origin, that series is presumptively non-redistributable
unless the specific IEA material carries a CC BY notice.

### A0.5 World Bank — Terms of Use for Datasets
(https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets) — for the Skeptic's share-alike warning

> "For some of the Materials, such as the Datasets listed in The World Bank Data Catalog or the
> Publications made available in the Open Knowledge Repository. The World Bank Group has additional
> specific terms of use, all of which are hereby incorporated by reference. Those specific terms of use
> are available on the pages through which the relevant Materials are accessible …"

> "For the remainder of the Materials, you may make non-commercial uses thereof, but you may not make any
> derivative work or commercial use, including without limitation reselling them, charging to access them,
> charging to redistribute them, or charging for derivative works based on them, without the prior written
> consent of the relevant member institution(s)."

> "The foregoing limited license rights are conditioned upon your providing proper attribution to The
> World Bank Group, including the relevant member institution(s), the individual author(s) of the work, if
> any, and any third party content providers …"

> "However, you may not in any event use the APIs to facilitate commercial uses of the Materials,
> including without limitation reselling them, charging to access them, charging to redistribute them, or
> charging to create derivative works based on them."

**Auditor note on the Skeptic's "share-alike-like" phrasing:** The World Bank general dataset terms do
**not** contain a true share-alike (viral copyleft) clause. What they *do* contain is arguably **more**
restrictive for our purposes: a default of non-commercial + no-derivative-without-consent for the
"remainder of Materials," plus per-dataset terms incorporated by reference. Many popular World Bank
indicators (e.g. World Development Indicators) are separately released under CC BY 4.0 via the Data
Catalog, but that must be confirmed **per dataset** — the blanket site terms are not CC BY. Because no
World Bank series is a direct upstream in our four target datasets, this does not block the current
ingest. Flagged for any future World Bank additions (Wave 3).

### A0.6 OWID data-package README disclaimer (per-slug `.readme.md`)

> "Our World in Data is almost never the original producer of the data - almost all of the data we use
> has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you
> adhere to the sources' license and to credit them correctly. Please note that a single time series may
> have more than one source - e.g. when we stich together data from different time periods by different
> producers or when we calculate per capita metrics using population data from a second source."

---

## Appendix C — Per-indicator OWID variable IDs (for reproducible re-audit)

These are the OWID internal variable IDs behind the columns we intend to ingest. Fetch each at
`https://api.ourworldindata.org/v1/indicators/{id}.metadata.json` to re-verify license state on any
future re-audit.

**Primary energy consumption by source (`energy-consumption-by-source-and-country`) — all EI-sourced:**

| Column | Variable ID | Upstream license (OWID-recorded) |
|---|---|---|
| Other renewables (incl. geothermal & biomass) - TWh | 1077639 | © Energy Institute 2025 |
| Biofuels consumption - TWh | 1077522 | © Energy Institute 2025 |
| Solar consumption - TWh | 1077656 | © Energy Institute 2025 |
| Wind consumption - TWh | 1077661 | © Energy Institute 2025 |
| Hydro consumption - TWh | 1077596 | © Energy Institute 2025 |
| Nuclear consumption - TWh | 1077605 | © Energy Institute 2025 |
| Gas consumption - TWh | 1077570 | © Energy Institute 2025 |
| Coal consumption - TWh | 1077523 | © Energy Institute 2025 |
| Oil consumption - TWh | 1077624 | © Energy Institute 2025 |

**Electricity generation mix (`share-elec-by-source`) — Ember (CC BY 4.0) + EI backfill:**

| Column | Variable ID | Upstream license (OWID-recorded) |
|---|---|---|
| Coal - % electricity | 1227970 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Gas - % electricity | 1227973 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Hydro - % electricity | 1227990 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Solar - % electricity | 1228024 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Wind - % electricity | 1228031 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Oil - % electricity | 1227997 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Nuclear - % electricity | 1227994 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Other renewables excl. bioenergy - % electricity | 1227998 | Ember CC BY 4.0 + © Energy Institute 2025 |
| Bioenergy - % electricity | 1227965 | Ember CC BY 4.0 + © Energy Institute 2025 |

**Renewable electricity share (`share-electricity-renewables`):**

| Column | Variable ID | Upstream license (OWID-recorded) |
|---|---|---|
| Renewables - % electricity | 1228020 | Ember CC BY 4.0 + © Energy Institute 2025 |

**CO₂ per capita (`co-emissions-per-capita`) and CO₂ per GDP (`co2-intensity`):**

| Column | Variable ID | Upstream license (OWID-recorded) |
|---|---|---|
| Annual CO₂ emissions (per capita) | 1119914 | Global Carbon Budget CC BY 4.0 + Population CC BY 4.0 |
| Annual CO₂ emissions per GDP (kg per int-$) | 1119915 | Global Carbon Budget CC BY 4.0 + Maddison CC BY 4.0 |

---

## Appendix D — License compatibility matrix (redistribution decision)

| Upstream provider | License class | Attribution required | Share-alike | No-derivatives | Commercial allowed | Public redistribution OK? |
|---|---|---|---|---|---|---|
| Our World in Data (own output) | CC BY 4.0 | Yes | No | No | Yes | Yes |
| Ember | CC BY 4.0 | Yes | No | No | Yes | Yes |
| Global Carbon Project / GCB | CC BY 4.0 | Yes | No | No | Yes | Yes |
| Maddison Project 2023 (RUG/GGDC) | CC BY 4.0 | Yes | No | No | Yes | Yes |
| OWID population (Various sources) | CC BY 4.0 | Yes | No | No | Yes | Yes |
| Energy Institute — Statistical Review | © all-rights-reserved; quote-with-attribution; extensive reproduction by permission | Yes | n/a | Effectively yes (permission-gated) | By permission only | **Conditional / likely NO for full-matrix redistribution** |
| Embedded S&P Global data (within EI) | Proprietary | Yes | n/a | Yes | No | **NO without S&P authorization** |
| IEA standalone/paid datasets (not in our 4) | Non-CC / proprietary | Yes | n/a | Yes | No | **NO** (does not affect current 4) |
| World Bank general dataset terms (not in our 4) | Non-commercial + no-derivative-without-consent (varies per dataset) | Yes | No | Yes (default) | No (default) | **Per-dataset; default NO** |

---

## Appendix A — Source URLs consulted (all retrieved 2026-07-18)

- OWID FAQs & user guidelines: https://ourworldindata.org/faqs
- OWID Energy topic page: https://ourworldindata.org/energy
- OWID ETL / API index: https://docs.owid.io/projects/etl/api/
- OWID Chart Data API docs: https://docs.owid.io/projects/etl/api/chart-api/
- OWID chart metadata (per slug): `https://ourworldindata.org/grapher/{slug}.metadata.json`
  (slugs: `energy-consumption-by-source-and-country`, `share-elec-by-source`,
  `share-electricity-renewables`, `co-emissions-per-capita`, `co2-intensity`)
- OWID per-indicator metadata: `https://api.ourworldindata.org/v1/indicators/{id}.metadata.json`
  (ids: 1077624, 1227970, 1119914, 1119915, and the sibling energy/electricity indicators)
- OWID data-package README (per slug): `https://ourworldindata.org/grapher/{slug}.readme.md`
- Energy Institute Terms and Conditions: https://www.energyinst.org/terms
- Energy Institute Statistical Review home: https://www.energyinst.org/statistical-review
- Energy Institute Statistical Review "About": https://www.energyinst.org/statistical-review/about
- Ember Creative Commons page: https://ember-energy.org/creative-commons/
- Ember Yearly Electricity Data: https://ember-energy.org/data/yearly-electricity-data/
- IEA Terms: https://www.iea.org/terms
- World Bank Terms of Use for Datasets:
  https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets
- Global Carbon Budget: https://globalcarbonbudget.org/ ; Zenodo record
  https://doi.org/10.5281/zenodo.17417124 ; ICOS data license
  https://www.icos-cp.eu/data-services/about-data-portal/data-license
- Maddison Project Database 2023:
  https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023

## Appendix B — Live endpoint status check (2026-07-18)

| Slug | `.csv` HTTP status | Redistributable flag |
|---|---|---|
| `energy-consumption-by-source-and-country` | 200 | not flagged 403 (but upstream EI terms still apply) |
| `share-elec-by-source` | 200 (not individually re-checked; sibling `share-electricity-renewables` = 200) | mixed upstream |
| `share-electricity-renewables` | 200 | mixed upstream |
| `co-emissions-per-capita` | 200 | clean CC BY |
| `co2-intensity` | (metadata 200; csv not separately re-checked) | clean CC BY |

**Reminder:** HTTP 200 means OWID will serve the bytes; it does **not** grant redistribution rights. The
upstream license governs redistribution, per OWID's own README disclaimer.
