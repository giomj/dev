# IRENA — Upstream License Audit

**Audited:** 2026-07-18
**Auditor:** Grand Council license-audit subagent
**Scope:** Datasets planned for ingest in Wave 2 of Session 5 expansion.

> **Binding this audit satisfies (Session 5, the Skeptic's ruling):**
> "IRENA data is often described as 'freely available' but the actual license terms on their platform (irena.org, IRENASTAT, statistics pages) vary by dataset and include attribution + no-derivatives-of-analysis clauses in some cases. Before writing any IRENA ingest code, produce `references/irena/UPSTREAM_LICENSES.md` documenting the actual terms, dataset by dataset, with URLs and verbatim quotes."

---

## 0. Executive summary (read this first)

This audit confirms the Skeptic's core suspicion: **"freely available" is not the whole story.** IRENA's terms are not a single clean open-data license. There are (at least) **three distinct license regimes** in play, and one **hard structural blocker**:

1. **The generic IRENA publication license** (used on most reports and on the LCOE / *Renewable Power Generation Costs* series): permissive — free reuse **provided IRENA is acknowledged as source and copyright holder**.
2. **The statistical-yearbook license** (used on *Renewable Capacity Statistics* 2024/2025 and *Renewable energy statistics* 2025 — i.e. exactly the capacity/generation numbers we want): **more restrictive** — free reuse **only if** the material bears a copyright **notation** `© IRENA` with the year, **and** third-party material within may carry separate terms **"including restrictions in relation to any commercial use."**
3. **The raw-microdata carve-out** (documented in IRENA's own methodology): IRENA **does not own the rights to redistribute all the underlying raw data** it collects from external sources; some data is *"only available in aggregated graphical format."*

**BLOCK-level structural issue:** IRENA's public statistics are **collated from national/member-state submissions and third-party sources** (industry associations, consultants, news). IRENA's own license text repeatedly warns that **third-party material may carry separate terms and separate copyright**, and that some of it cannot be redistributed in raw form at all. This means we **cannot treat any IRENA dataset as blanket-open** the way we would a CC0 government dataset.

**Operational blocker:** `www.irena.org` sits behind an **Azure Web Application Firewall (WAF) with a JavaScript challenge** that returns **HTTP 403** to non-browser clients. The IRENASTAT query platform (`pxweb.irena.org`) is reachable but is a PxWeb/IIS query tool, not a documented bulk API. **Automated ingestion is not explicitly authorized anywhere we could find**, and is technically impeded on the main domain.

**Net recommendation:** All four datasets are *ingestible in principle with attribution*, but **each fetched value must carry (a) an `© IRENA <year>` copyright notation, (b) the verbatim citation string for its source publication, and (c) an "aggregated / derived from IRENA statistics" disclaimer.** See §6. No dataset needs to be dropped outright on license grounds, **but** see §7 for open questions that the emperor should resolve before we ingest — particularly around commercial-redistribution restrictions on the yearbook data and third-party embedded content.

---

## 1. IRENA's data licensing — general terms

IRENA does **not** publish a single "data license" page in the manner of a data.gov CC0 statement. Instead, the operative license text lives **inside each publication's copyright page** and inside its **methodology documentation**. There are two boilerplate copyright blocks in wide use, plus an "as is" disclaimer, plus a methodology-level statement about raw-data redistribution rights.

### 1.1 The generic publication license (permissive form)

This is the block that appears on the front matter of most IRENA reports, including the **LCOE / *Renewable Power Generation Costs* series** and joint/thematic reports. Verbatim, from the *Renewable power generation costs in 2024* summary (© IRENA 2025):

> "© IRENA 2025
> Unless otherwise stated, material in this publication may be freely used, shared, copied, reproduced, printed and/or stored, provided that appropriate acknowledgement is given of IRENA as the source and copyright holder. Material in this publication that is attributed to third parties may be subject to separate terms of use and restrictions, and appropriate permissions from these third parties may need to be secured before any use of such material."

Source: *IRENA (2025), Renewable power generation costs in 2024* (summary), hosted copy — https://www.kenergia.it/wordpress/wp-content/uploads/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf

The same block, verbatim, on the 2022 costs report (© IRENA 2022):

> "Unless otherwise stated, material in this publication may be freely used, shared, copied, reproduced, printed and/or stored, provided that appropriate acknowledgement is given of IRENA as the source and copyright holder. Material in this publication that is attributed to third parties may be subject to separate terms of use and restrictions, and appropriate permissions from these third parties may need to be secured before any use of such material.
> Citation: IRENA (2022), Renewable power generation costs in 2022, International Renewable Energy Agency, Abu Dhabi.
> ISBN 978-92-9260-544-5"

Source: *IRENA (2022), Renewable power generation costs in 2022* (summary), hosted copy — https://elettricomagazine.it/wp-content/uploads/2023/09/IRENA_Renewable_power_generation_costs_in_2022_SUMMARY.pdf

**Key feature of the permissive form:** the only precondition is *appropriate acknowledgement of IRENA as source and copyright holder*. There is **no explicit share-alike** and **no explicit no-derivatives** clause. The nearest thing to a restriction is the standing warning that **third-party-attributed material may carry separate terms.**

### 1.2 The statistical-yearbook license (restrictive form)

This is the block that appears on the **statistical yearbooks** — i.e. *Renewable Capacity Statistics* and *Renewable energy statistics*, which are **the exact publications backing the capacity, generation, and capacity-additions numbers we intend to ingest.** Verbatim, from *Renewable Capacity Statistics 2025* (© IRENA 2025):

> "Copyright © IRENA 2025
> Unless otherwise stated, this publication and material featured herein are the property of the International Renewable Energy Agency (IRENA) and are subject to copyright by IRENA.
> Material in this publication may be freely used, shared, copied, reproduced, printed and/or stored, provided that all such material is clearly attributed to IRENA and bears a notation that it is subject to copyright (© IRENA), with the year of the copyright.
> Material contained in this publication attributed to third parties may be subject to third party copyright and separate terms of use and restrictions, including restrictions in relation to any commercial use.
> ISBN: 978-92-9260-652-7
> Citation: IRENA (2025), Renewable capacity statistics 2025, International Renewable Energy Agency, Abu Dhabi."

Source (mirror of the IRENA report front matter): https://www.slideshare.net/slideshow/irena_renewable-capacity-statistics-2025/277232858

The **identical restrictive block** appears on *Renewable Capacity Statistics 2024* (© IRENA 2024), verbatim:

> "Copyright © IRENA 2024
> Unless otherwise stated, this publication and material featured herein are the property of the International Renewable Energy Agency (IRENA) and are subject to copyright by IRENA.
> Material in this publication may be freely used, shared, copied, reproduced, printed and/or stored, provided that all such material is clearly attributed to IRENA and bears a notation that it is subject to copyright (© IRENA), with the year of the copyright.
> Material contained in this publication attributed to third parties may be subject to third party copyright and separate terms of use and restrictions, including restrictions in relation to any commercial use.
> This publication and the material featured herein are provided 'as is', for informational purposes.
> ... Neither IRENA nor any of its officials, agents, data or other third-party content providers or licensors provides any warranty, including as to the accuracy, completeness, or fitness for a particular purpose or use of such material, or regarding the non-infringement of third-party rights, and they accept no responsibility or liability with regard to the use of this publication and the material featured therein."

Source (hosted copy of the IRENA 2024 report front matter): https://www.developmentaid.org/api/frontend/cms/file/2024/03/IRENA_RE_Capacity_Statistics_2024.pdf

**Why this matters — three differences from the permissive form:**
1. It asserts the material is **"the property of IRENA and subject to copyright by IRENA"** (stronger IP assertion than the permissive block).
2. It requires not just acknowledgement but a **copyright notation** — reused material must **"bear a notation that it is subject to copyright (© IRENA), with the year of the copyright."** A bare "Source: IRENA" is **insufficient** under this license; the `© IRENA <year>` mark must travel with the data.
3. Third-party material within may carry **"restrictions in relation to any commercial use"** — an explicit commercial-use flag that the permissive block does not spell out.

### 1.3 The "as is" / no-warranty disclaimer (all products)

Present on essentially all IRENA outputs. Verbatim (costs series):

> "This publication and the material herein are provided 'as is'. ... However, neither IRENA nor any of its officials, agents, data or other third-party content providers provides a warranty of any kind, either expressed or implied, and they accept no responsibility or liability for any consequence of use of the publication or material herein."

Source: *IRENA/OEE (2023)* front matter — https://www.oceanenergy-europe.eu/wp-content/uploads/2023/03/IRENA_OEE_Scaling_up_investment_ocean_energy_2023.pdf

And from IRENA's REsource data methodology:

> "while IRENA strives to ensure the accuracy and completeness of the data, content is provided 'as is', without any conditions, warranties or other terms of any kind."

Source: IRENA REsource Data Methodology — https://dashboard.irena.org/download/methodology.pdf

### 1.4 The raw-data redistribution carve-out (methodology-level — the important one)

This is the single most consequential general term for an ingest project. Verbatim, from IRENA's REsource data methodology:

> "Since some of the information is collected from external sources, IRENA does not own the rights to distribute all the data in raw format. Therefore, the data is only available in aggregated graphical format."

Source: IRENA REsource Data Methodology — https://dashboard.irena.org/download/methodology.pdf

This confirms that **IRENA itself is not the sole rights-holder over all the numbers it publishes.** For any value sourced from a third party (national submission, industry association, consultant), IRENA is redistributing under whatever arrangement it has, and downstream users are on notice that separate terms may attach.

### 1.5 The IRENASTAT platform footer (verbatim)

The IRENASTAT Online Data Query Tool (`pxweb.irena.org`) carries a copyright footer and the standard UN-style boundaries disclaimer:

> "© 2026 IRENA - International Renewable Energy Agency. All Rights Reserved."

> "The designations employed and the presentation of materials herein do not imply the expression of any opinion whatsoever on the part of the International Renewable Energy Agency concerning the legal status of any country, territory, city or area or of its authorities, or concerning the delimitation of its frontiers or boundaries."

Source: IRENASTAT Online Data Query Tool footer — https://pxweb.irena.org/pxweb/en/IRENASTAT (captured 2026-07-19). Note: the "All Rights Reserved" phrasing on the platform footer is **more restrictive-sounding than the publications' "may be freely used" language**; the operative reuse permission still comes from the publication front matter, not the platform footer, but this discrepancy is flagged in §7.

---

## 2. Dataset-by-dataset terms

All four target datasets are published through the **same statistical program** and are therefore governed by the **restrictive statistical-yearbook license (§1.2)** — with the sole exception of the **LCOE cost figures**, which come from the *Renewable Power Generation Costs* analytical series and carry the **permissive publication license (§1.1)**. This is the analyses-vs-database split the task asked us to identify (see §2.5).

### 2.1 Installed renewable capacity by country and technology (annual)

- **IRENA landing page:** https://www.irena.org/Data/View-data-by-topic/Capacity-and-Generation/Statistics-Time-Series (topic hub) and https://www.irena.org/Publications/2025/Jul/Renewable-energy-statistics-2025 (backing yearbook). Query access: https://pxweb.irena.org/pxweb/en/IRENASTAT → "Power Capacity and Generation".
- **Access mechanism:** (1) **IRENASTAT Online Data Query Tool** (PxWeb, interactive query + export). (2) **Downloads / Tables / Yearbooks** on the topic page ("IRENASTAT Tools", "Downloads", "Tables", "Yearbooks" are the listed access buttons). (3) **PDF/trilingual tables** in the *Renewable Capacity Statistics* yearbook. There is **no documented public REST API** and **no Python SDK** (third-party catalogs confirm "API access: No").
- **License / TOS:** Restrictive statistical-yearbook license, §1.2. Governing publication: *IRENA (2025), Renewable capacity statistics 2025* (ISBN 978-92-9260-652-7) / *IRENA (2025), Renewable energy statistics 2025*. Verbatim license text quoted in §1.2. URL: https://www.slideshare.net/slideshow/irena_renewable-capacity-statistics-2025/277232858 (front-matter mirror) and https://www.irena.org/Publications/2025/Jul/Renewable-energy-statistics-2025.
- **Attribution requirement (verbatim):** material must be "clearly attributed to IRENA and bears a notation that it is subject to copyright (© IRENA), with the year of the copyright." Citation string: **"IRENA (2025), Renewable capacity statistics 2025, International Renewable Energy Agency, Abu Dhabi."**
- **Redistribution / derivatives:** Redistribution and derivatives are **permitted** ("freely used, shared, copied, reproduced ... and/or stored") **provided** the `© IRENA <year>` notation + attribution travel with the data. **Caveat:** any value attributed to a third party (national statistics office, industry association) "may be subject to third party copyright and separate terms of use and restrictions, including restrictions in relation to any commercial use." No share-alike; no explicit no-derivatives on IRENA's own material.

### 2.2 Renewable power generation by country and technology (annual)

- **IRENA landing page:** https://www.irena.org/Data/View-data-by-topic/Capacity-and-Generation/Statistics-Time-Series ; backing yearbook https://www.irena.org/Publications/2025/Jul/Renewable-energy-statistics-2025. Query access: https://pxweb.irena.org/pxweb/en/IRENASTAT → "Power Capacity and Generation".
- **Access mechanism:** Same as §2.1 — IRENASTAT query tool + Downloads/Tables + yearbook PDF. Note IRENA states generation data lags capacity data by a year: the 2025 yearbook "provides datasets on power-generation capacity for 2015-2024, **actual power generation for 2015-2023**." Release cadence: "renewable power generation and renewable energy balances data sets are released in July" (capacity released in March). Sources: https://www.irena.org/Publications/2025/Jul/Renewable-energy-statistics-2025 and https://www.irena.org/Data.
- **License / TOS:** Restrictive statistical-yearbook license, §1.2 (same publication family as capacity). Citation: **"IRENA (2025), Renewable energy statistics 2025, International Renewable Energy Agency, Abu Dhabi."**
- **Attribution requirement (verbatim):** as §2.1 — attribution to IRENA **plus** `© IRENA <year>` notation.
- **Redistribution / derivatives:** As §2.1. Same third-party-content caveat applies and is arguably *more* material here, because generation figures for many countries are drawn from national statistics/official publications.

### 2.3 Renewable energy costs — LCOE by technology, annual global averages

- **IRENA landing page:** https://www.irena.org/Data/View-data-by-topic/Costs/Global-Trends (and sub-pages "Global LCOE and Auction values", "Solar costs", "Wind Costs"); backing analysis: *Renewable Power Generation Costs* annual report + its accompanying **datafile**. Latest: *IRENA (2025), Renewable power generation costs in 2024*.
- **Access mechanism:** (1) **Costs topic dashboards** on irena.org. (2) A downloadable **datafile** accompanying the costs report (e.g. "IRENA-Datafile-RenPwrGenCosts-in-2023-v1", distributed as XLSX). (3) The costs report PDF itself. LCOE numbers are **not** in the IRENASTAT PxWeb tool (IRENASTAT covers Finance, Heat Generation, and Power Capacity and Generation only — LCOE is a separate analytical product).
- **License / TOS:** **Permissive publication license, §1.1** — this is IRENA's own **analysis**, not raw member-state statistics. Verbatim: "material in this publication may be freely used, shared, copied, reproduced, printed and/or stored, provided that appropriate acknowledgement is given of IRENA as the source and copyright holder. Material in this publication that is attributed to third parties may be subject to separate terms of use and restrictions ..." Citation (2024 data): **"IRENA (2025), Renewable power generation costs in 2024, International Renewable Energy Agency, Abu Dhabi."** For 2023 data: **"IRENA (2024), Renewable power generation costs in 2023, International Renewable Energy Agency, Abu Dhabi."** (ISBN 978-92-9260-621-3). URLs: https://www.kenergia.it/wordpress/wp-content/uploads/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf and https://www.scribd.com/document/788207369/IRENA-Renewable-power-generation-costs-in-2023-executive-summary.
- **Attribution requirement (verbatim):** "appropriate acknowledgement is given of IRENA as the source and copyright holder." (No explicit "© notation" requirement in this block — but see §6 for why we recommend applying the `© IRENA <year>` mark uniformly.)
- **Redistribution / derivatives:** Permitted with acknowledgement. **Important underlying-data caveat:** LCOE is computed by IRENA from the **IRENA Renewable Cost Database**, which per the methodology contains "around 9 000 utility-scale projects ... a further 6 000 projects ... [and] around 740 000 data points for small-scale residential solar PV systems." The **published global weighted-average LCOE values are IRENA's own analytical output** and are the cleanest to redistribute; the **project-level raw cost database is not offered for redistribution** (contact costs@irena.org). We intend to ingest only the **published annual global averages**, which fall under the permissive license. Source: https://dashboard.irena.org/download/methodology.pdf.

### 2.4 Capacity additions per year, by technology

- **IRENA landing page:** Not a separate publication — **derived from the capacity time series** (§2.1). Year-over-year additions are the first difference of the installed-capacity series in *Renewable Capacity Statistics* / IRENASTAT. IRENA does report additions narratively (e.g. "In 2024, global renewable power capacity additions reached ... 582 gigawatts (GW) ... 19.8% increase compared to ... 2023").
- **Access mechanism:** Two options: (a) compute additions ourselves as `capacity[t] − capacity[t−1]` from the ingested capacity series (§2.1); or (b) take IRENA's stated additions figures from the yearbook / press summaries.
- **License / TOS:** **Governed by whichever source we use.** If computed from the capacity series → restrictive statistical-yearbook license (§1.2), and the derived "additions" values are a **derivative of IRENA statistics** (permitted, with attribution + `© IRENA` notation). If taken from a costs/press narrative → permissive publication license (§1.1). Source for the 582 GW figure: https://renewablemarketwatch.com/blog/irenas-renewable-power-generation-costs-study-shows-renewable-energy-is-the-most-cost-effective-source-of-new-electricity-generation-in-2024/ (reporting IRENA figures).
- **Attribution requirement (verbatim):** Inherits §2.1 (yearbook license) if derived from the capacity series. We must attribute IRENA **and** label the additions series as **"derived from IRENA Renewable Capacity Statistics"** so we do not misrepresent a computed figure as an official IRENA-published number.
- **Redistribution / derivatives:** Permitted as a derivative with attribution; label clearly as our own computation over IRENA data (see §6).

### 2.5 The analyses-vs-database distinction (explicit finding)

The task asked us to identify whether IRENA licenses its **analyses** (LCOE reports) differently from its **statistical database** (IRENASTAT capacity/generation). **It does, and the difference is material:**

| | Statistical database (capacity, generation, additions) | Analytical products (LCOE / costs) |
|---|---|---|
| Backing publication | *Renewable Capacity Statistics* / *Renewable energy statistics* | *Renewable Power Generation Costs* |
| Delivery | IRENASTAT PxWeb tool + yearbook | Costs dashboards + datafile + report |
| License block | **Restrictive (§1.2)** — property of IRENA, requires `© IRENA` notation, flags third-party commercial-use restrictions | **Permissive (§1.1)** — free reuse with acknowledgement |
| Data provenance | Mostly **member-state submissions** + estimates + third-party data | IRENA's **own computation** from IRENA Renewable Cost Database |
| Raw-redistribution risk | **Higher** — many values are third-party-sourced; methodology says IRENA "does not own the rights to distribute all the data in raw format" | Lower for published averages; **project-level DB not redistributable** |

Provenance evidence (methodology, verbatim): "Most of the data are official statistics submitted by countries to IRENA using the IRENA renewable energy statistics questionnaire during its annual data collection cycle or taken from official publications. Where official statistics are unavailable, the statistics are supplemented with IRENA estimates or third party data such as that from industry associations." Source: https://dashboard.irena.org/download/methodology.pdf. Corroborated on the Data page: "This data is collected directly from members using the IRENA Renewable Energy Statistics questionnaire and is also supplemented by desk research where official statistics are not available." Source: https://www.irena.org/Data.

---

## 3. IRENA-specific gotchas

1. **Third-party-sourced values inside "IRENA" data.** IRENA's statistics are a *blend*: member-state questionnaire returns, official national publications, IRENA estimates, and third-party/industry data. IRENA's license text repeatedly warns that third-party-attributed material "may be subject to third party copyright and separate terms of use and restrictions, **including restrictions in relation to any commercial use**." We cannot resolve, value-by-value, which numbers carry third-party strings, because IRENASTAT does not surface per-cell provenance. **Assume some cells carry third-party terms.** Verbatim source: https://www.developmentaid.org/api/frontend/cms/file/2024/03/IRENA_RE_Capacity_Statistics_2024.pdf.

2. **Raw microdata is explicitly *not* fully redistributable.** "IRENA does not own the rights to distribute all the data in raw format. Therefore, the data is only available in aggregated graphical format." We are ingesting the **aggregated/published** series (country × technology × year), which is what IRENA does publish — but we must **not** attempt to reconstruct or redistribute anything IRENA withholds (e.g. the project-level cost database). Source: https://dashboard.irena.org/download/methodology.pdf.

3. **The yearbook license is stricter than the report license.** The exact datasets we most want (capacity/generation) carry the **restrictive** block requiring the `© IRENA <year>` **notation**, not just a source line. A dashboard that shows "Source: IRENA" without the copyright mark would **not** satisfy the yearbook license as written.

4. **"For statistical purposes only" — not found, but "for informational purposes" is present.** We did **not** find an explicit "for statistical purposes only" or "no commercial redistribution" clause on IRENA's *own* material. The yearbook block does say the publication is provided "**for informational purposes**," and — critically — the commercial-use restriction it flags applies to **third-party-attributed material within**, not to IRENA's own content. This is a meaningful nuance for §7.

5. **Platform footer vs publication license mismatch.** The IRENASTAT platform footer says **"All Rights Reserved,"** while the publications say material "may be freely used." The reuse permission we rely on comes from the **publication front matter**, not the platform chrome — but this is exactly the kind of ambiguity the emperor may want confirmed in writing from IRENA (§7).

6. **IRENA distinguishes its analyses from raw member-state submissions.** Yes — see §2.5. The methodology explicitly describes a validation/judgement process over member submissions and separately describes the LCOE computation over the Cost Database. Treat capacity/generation as **collated statistics** (restrictive license, third-party risk) and LCOE as **IRENA analysis** (permissive license).

7. **UN-style boundaries disclaimer.** Present on IRENASTAT and publications. If our dashboard renders country names/borders, we should carry IRENA's disclaimer that designations "do not imply ... any opinion ... concerning the legal status of any country ... or ... its frontiers or boundaries." Source: https://pxweb.irena.org/pxweb/en/IRENASTAT.

8. **No warranty / "as is".** IRENA accepts "no responsibility or liability for any consequence of use." Our apparatus criticus should note the data is provided by IRENA "as is." Source: https://dashboard.irena.org/download/methodology.pdf.

---

## 4. Aggregate obligations we must satisfy

### 4.1 Required attribution strings (verbatim, per dataset)

| Dataset | License regime | Citation string to emit (verbatim) | Copyright notation required? |
|---|---|---|---|
| Installed renewable capacity | Restrictive (§1.2) | `IRENA (2025), Renewable capacity statistics 2025, International Renewable Energy Agency, Abu Dhabi.` (and/or `IRENA (2025), Renewable energy statistics 2025, ...`) | **Yes** — `© IRENA 2025` |
| Renewable power generation | Restrictive (§1.2) | `IRENA (2025), Renewable energy statistics 2025, International Renewable Energy Agency, Abu Dhabi.` | **Yes** — `© IRENA 2025` |
| LCOE / renewable energy costs | Permissive (§1.1) | `IRENA (2025), Renewable power generation costs in 2024, International Renewable Energy Agency, Abu Dhabi.` (or `IRENA (2024), Renewable power generation costs in 2023, ...`) | Acknowledgement required; `©` notation recommended |
| Capacity additions (derived) | Restrictive (§1.2) — inherits capacity | `Derived from IRENA (2025), Renewable capacity statistics 2025, International Renewable Energy Agency, Abu Dhabi.` | **Yes** — `© IRENA 2025` |

The mandatory attribution wording for the restrictive datasets is set by this verbatim clause: material must be "clearly attributed to IRENA and bears a notation that it is subject to copyright (© IRENA), with the year of the copyright."

### 4.2 Share-alike / no-derivatives clauses

- **No share-alike (copyleft) clause** was found on any IRENA own-content license block.
- **No blanket no-derivatives clause** on IRENA's own material — derivatives are expressly allowed ("freely used, shared, copied, reproduced ... stored").
- **The only derivative-style restriction** appears in **joint publications** (e.g. IRENA/IEA/REN21), which require a specific derivative-work notice — *not applicable to our four target datasets*, but flagged so we don't accidentally ingest a jointly-licensed product under the wrong terms. That joint-work clause reads: "If you produce works derived from this publication, including translations, you must include the following in your derivative work: 'This work/translation is partially based on ... but the resulting work has been prepared by [insert your legal entity name] and does not necessarily reflect the views of IRENA ...'." Source: https://www.ren21.net/wp-content/uploads/2019/06/17-8622_Policy_FullReport_web_FINAL.pdf.

### 4.3 Datasets to DROP for license incompatibility with public redistribution

**None require dropping on a pure license-incompatibility basis.** All four are redistributable with attribution + copyright notation. **However**, two conditional flags:
- If our ingest is deemed a **commercial** redistribution and any target series contains **third-party-attributed** values, the yearbook's "restrictions in relation to any commercial use" clause on that third-party content could bite. Because we cannot see per-cell provenance, this is an **unresolved risk to escalate (§7)** rather than an automatic drop.
- The **project-level Renewable Cost Database** (behind the LCOE averages) must **not** be ingested — only the published global-average LCOE values. This is already outside our scope, but the ingest code must be written so it never reaches for the raw cost DB.

---

## 5. Access / rate-limit / TOS constraints

1. **IRENASTAT platform (`pxweb.irena.org`) terms of use.** The platform is the **IRENASTAT Online Data Query Tool** (PxWeb software on Microsoft IIS). It exposes three topic folders: **Finance, Heat Generation, Power Capacity and Generation.** Its footer asserts "© 2026 IRENA ... All Rights Reserved." There is **no separate machine-readable TOS or API-terms document** surfaced on the platform; the operative reuse permission is the publication license (§1). Source: https://pxweb.irena.org/pxweb/en/IRENASTAT (captured 2026-07-19).

2. **Main site is behind Azure WAF with a JS challenge.** Direct programmatic requests to `www.irena.org` (including report PDFs under `/-/media/...` and even `/robots.txt`) return **HTTP 403** and an **Azure WAF JavaScript-challenge page** ("Please enable JavaScript to run this application"). This means naive `curl`/`requests`-style ingestion of the main domain **will be blocked**. Observed 2026-07-19: `GET https://www.irena.org/robots.txt` → 403 Azure WAF; `GET https://www.irena.org/-/media/.../IRENA_Renewable_capacity_statistics_2025.pdf` → 403.

3. **No published robots.txt we could read.** `www.irena.org/robots.txt` is intercepted by the WAF (403). `pxweb.irena.org/robots.txt` returns **404** (no robots file present on the PxWeb subdomain). Absence of a robots.txt is **not** authorization to automate; see §7.

4. **No documented public API or SDK.** Third-party data catalogs that index IRENASTAT report "API access: No" and "Python SDK: No." IRENA's own Data pages advertise interactive tools and bulk **downloads/tables/yearbooks**, not a REST API. Bulk access is via the PxWeb export UI and via the yearbook/table PDFs.

5. **Rate limits.** **None stated publicly.** No documented rate-limit, crawl-delay, or bulk-download cap was found. The practical constraint is the Azure WAF on the main domain, which may throttle or challenge automated clients irrespective of any stated limit.

6. **Is automated ingestion permitted?** **Not explicitly authorized anywhere we could find.** The permission we have is a **reuse/redistribution license** on the *content*, not an explicit **access/automation** license on the *platform*. The reuse license (freely used/shared/copied) strongly implies downstream data reuse is intended, but the presence of an Azure WAF challenge on the main domain signals IRENA actively manages automated access. **Recommended posture:** prefer the IRENASTAT PxWeb export UI (or a one-time manual download of the yearbook tables), fetch politely and infrequently (annual refresh cadence matches IRENA's own release schedule — March for capacity, July for generation), identify our client honestly, and do **not** hammer `www.irena.org`. Escalate the automation question in §7.

---

## 6. Recommendations for our ingest code

**This is a gate, not an implementation. The following are requirements the eventual ingest code must satisfy; no code is written here.**

### 6.1 Attribution the ingest script must emit alongside each fetched value

Every ingested record (row / value / series) must carry, as metadata:
1. **Copyright notation:** `© IRENA <copyright-year>` — mandatory for capacity, generation, additions (restrictive license); recommended for LCOE.
2. **Verbatim citation string** for the source publication (see the §4.1 table), e.g. `IRENA (2025), Renewable capacity statistics 2025, International Renewable Energy Agency, Abu Dhabi.`
3. **Source URL** of the publication / IRENASTAT table.
4. **Provenance / derivation flag:** for the **capacity-additions** series, the record must be labelled `Derived from IRENA statistics — computed as year-over-year difference` so it is never presented as an IRENA-published figure.
5. **Third-party-content notice:** a standing field noting "May include values attributed to third parties, which can carry separate terms; see UPSTREAM_LICENSES.md."
6. **"As is" / no-warranty notice.**

Practically: store these as fixed fields in the ingest schema so **no value can be persisted without its attribution block.**

### 6.2 What UPSTREAM_LICENSES.md excerpts must appear on the dashboard (Historian's "apparatus criticus" binding)

The dashboard must surface, per dataset panel (at minimum on hover/expand, and in a footer/credits view):
- The **`© IRENA <year>`** mark.
- The **verbatim citation string** for that dataset (§4.1).
- For capacity/generation/additions, the **restrictive-license attribution sentence** verbatim: *"Material ... freely used ... provided that all such material is clearly attributed to IRENA and bears a notation that it is subject to copyright (© IRENA), with the year of the copyright."*
- For LCOE, the **permissive-license sentence** verbatim: *"material in this publication may be freely used ... provided that appropriate acknowledgement is given of IRENA as the source and copyright holder."*
- The **third-party-content caveat**: *"Material contained in this publication attributed to third parties may be subject to third party copyright and separate terms of use and restrictions, including restrictions in relation to any commercial use."*
- The **boundaries disclaimer** if any map/country presentation is shown.
- A link back to this `UPSTREAM_LICENSES.md`.

### 6.3 Which datasets (if any) to REMOVE from the ingest list

- **Keep all four**, subject to the §7 escalations being resolved (particularly commercial-use posture).
- **Hard exclusion inside scope:** the **project-level IRENA Renewable Cost Database** (raw ~9,000+ project cost records / 740,000 residential PV data points) — ingest only the **published global-average LCOE** values, never the underlying project microdata (IRENA does not offer it for redistribution).
- **Do not** ingest any IRENA product using the wrong license block — verify each fetched publication's own front matter before treating it as permissive vs restrictive.

### 6.4 Access-hygiene requirements for the fetcher

- Prefer **IRENASTAT PxWeb export** and **yearbook table downloads** over crawling `www.irena.org`.
- Expect and **handle the Azure WAF JS challenge** gracefully (fail loudly, do not retry-hammer). If a browser-context fetch is needed, treat it as a **manual/assisted step**, not an unattended loop.
- Match IRENA's **annual release cadence** (capacity ~March, generation ~July); a once-a-year refresh is sufficient and minimizes access footprint.
- Send an **honest User-Agent** and a contact address.

---

## 7. Open questions for the emperor

1. **Commercial-use posture on third-party-embedded values.** The yearbook license permits free reuse of IRENA's own material but flags that **third-party-attributed** material inside "may be subject to ... restrictions in relation to any commercial use." IRENASTAT does not expose per-cell provenance, so we cannot mechanically separate IRENA-owned cells from third-party cells. **Is our reference shelf a "commercial use"?** If yes, do we accept the residual risk on third-party-sourced cells, or do we seek written confirmation/clearance from IRENA (statistics@irena.org)? — *This is the single most important open question and the closest thing to a BLOCK.*

2. **Platform footer vs publication license ("All Rights Reserved" vs "may be freely used").** These coexist. We are relying on the publication front-matter permission. Should we obtain a short written confirmation from IRENA that the IRENASTAT-exported data inherits the yearbook reuse license despite the "All Rights Reserved" platform footer?

3. **Is automated ingestion of IRENASTAT permitted?** The content is licensed for reuse, but no document grants **access-level** permission to automate, and the main domain runs an active WAF challenge. Do we (a) restrict ourselves to manual/assisted downloads, or (b) ask IRENA whether polite automated export of IRENASTAT tables is acceptable?

4. **Exactly which yearbook edition/citation year to freeze per series.** Capacity (2015–2024) and generation (2015–2023) come from the 2025 yearbook; additions derive from capacity. Do we pin to a single edition per refresh and record the edition-year in the citation, or track the latest continuously? (Affects the `© IRENA <year>` we emit.)

5. **`© IRENA <year>` notation on LCOE.** The LCOE (permissive) license only strictly requires *acknowledgement*, not a `©` notation. We recommend applying the notation uniformly for consistency — confirm that's acceptable and not over-claiming.

6. **Derived "capacity additions" labeling.** Confirm the emperor is comfortable presenting a **computed** additions series (year-over-year differences) labelled as *derived from* IRENA statistics rather than as an official IRENA figure, and that this satisfies the "no misrepresentation" spirit of the attribution clause.

7. **Third-party joint products.** If any future IRENA product we ingest is a **joint publication** (IRENA/IEA/REN21 etc.), it carries an additional **derivative-work notice** requirement. Confirm we will route such products through a separate license check rather than the two regimes documented here.

---

## Appendix A — Source ledger (URLs used in this audit)

| # | What it evidences | URL | Access note |
|---|---|---|---|
| 1 | IRENA Data hub — provenance, release cadence | https://www.irena.org/Data | Fetched via cache |
| 2 | Capacity & Generation topic hub — access buttons list | https://www.irena.org/Data/View-data-by-topic/Capacity-and-Generation/Statistics-Time-Series | Fetched via cache |
| 3 | Renewable energy statistics 2025 publication page | https://www.irena.org/Publications/2025/Jul/Renewable-energy-statistics-2025 | Fetched via cache |
| 4 | IRENASTAT PxWeb query tool — footer, topics, boundaries disclaimer | https://pxweb.irena.org/pxweb/en/IRENASTAT | Screenshot captured 2026-07-19 |
| 5 | IRENA REsource Data Methodology — raw-data carve-out, provenance, "as is", Cost DB | https://dashboard.irena.org/download/methodology.pdf | Fetched via cache |
| 6 | Renewable Capacity Statistics 2025 — restrictive license block, citation, ISBN 978-92-9260-652-7 | https://www.slideshare.net/slideshow/irena_renewable-capacity-statistics-2025/277232858 | Front-matter mirror |
| 7 | Renewable Capacity Statistics 2024 — identical restrictive block + "as is" + no-warranty | https://www.developmentaid.org/api/frontend/cms/file/2024/03/IRENA_RE_Capacity_Statistics_2024.pdf | Hosted copy of IRENA front matter |
| 8 | Renewable power generation costs in 2024 — permissive block, LCOE citation | https://www.kenergia.it/wordpress/wp-content/uploads/IRENA_TEC_RPGC_in_2024_Summary_2025.pdf | Hosted copy |
| 9 | Renewable power generation costs in 2022 — permissive block, citation, ISBN | https://elettricomagazine.it/wp-content/uploads/2023/09/IRENA_Renewable_power_generation_costs_in_2022_SUMMARY.pdf | Hosted copy |
| 10 | Renewable power generation costs in 2023 — permissive block, ISBN 978-92-9260-621-3 | https://www.scribd.com/document/788207369/IRENA-Renewable-power-generation-costs-in-2023-executive-summary | Mirror |
| 11 | Costs datafile in 2023 (project-level datafile exists; not for our raw ingest) | https://www.scribd.com/document/781406836/IRENA-Datafile-RenPwrGenCosts-in-2023-v1 | Mirror |
| 12 | Generic permissive block + no-warranty (joint report example) | https://www.oceanenergy-europe.eu/wp-content/uploads/2023/03/IRENA_OEE_Scaling_up_investment_ocean_energy_2023.pdf | Hosted copy |
| 13 | Joint-work derivative-notice clause (IRENA/IEA/REN21) | https://www.ren21.net/wp-content/uploads/2019/06/17-8622_Policy_FullReport_web_FINAL.pdf | Hosted copy |
| 14 | OWID mirror — confirms IRENA source license passes through; citation format | https://ourworldindata.org/grapher/installed-global-renewable-energy-capacity-by-technology | Fetched via cache |
| 15 | 2024 capacity additions figure (582 GW) reported from IRENA | https://renewablemarketwatch.com/blog/irenas-renewable-power-generation-costs-study-shows-renewable-energy-is-the-most-cost-effective-source-of-new-electricity-generation-in-2024/ | Secondary reporting |
| 16 | Azure WAF 403 on www.irena.org (main domain) | https://www.irena.org/robots.txt | 403 Azure WAF, observed 2026-07-19 |
| 17 | No robots.txt on PxWeb subdomain | https://pxweb.irena.org/robots.txt | 404, observed 2026-07-19 |

## Appendix B — The two license blocks, side by side (verbatim, for the apparatus criticus)

**PERMISSIVE (LCOE / costs / most reports):**
> "Unless otherwise stated, material in this publication may be freely used, shared, copied, reproduced, printed and/or stored, provided that appropriate acknowledgement is given of IRENA as the source and copyright holder. Material in this publication that is attributed to third parties may be subject to separate terms of use and restrictions, and appropriate permissions from these third parties may need to be secured before any use of such material."

**RESTRICTIVE (capacity / generation / additions — the statistical yearbooks):**
> "Unless otherwise stated, this publication and material featured herein are the property of the International Renewable Energy Agency (IRENA) and are subject to copyright by IRENA. Material in this publication may be freely used, shared, copied, reproduced, printed and/or stored, provided that all such material is clearly attributed to IRENA and bears a notation that it is subject to copyright (© IRENA), with the year of the copyright. Material contained in this publication attributed to third parties may be subject to third party copyright and separate terms of use and restrictions, including restrictions in relation to any commercial use."

**METHODOLOGY CARVE-OUT (why raw redistribution is limited):**
> "Since some of the information is collected from external sources, IRENA does not own the rights to distribute all the data in raw format. Therefore, the data is only available in aggregated graphical format."

---

*End of audit. This document is a gate: no IRENA ingest code should be written until §7 items 1–3 are resolved by the emperor.*
