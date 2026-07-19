# Session 5 — Wave 2 Gate 1 Ruling

**Recorded:** 2026-07-18 (same day as council convening)
**Governed by:** [`2026-07-18-session-5-expansion-plan.md`](2026-07-18-session-5-expansion-plan.md) — nine binding items
**Emperor's decisions on:** OWID / IRENA / public-domain source ingest scope

## Context

Wave 2 of the Session-5 expansion opened with a license-audit gate per the Skeptic's binding: no ingest code may be written against any of the five new sources until upstream licenses have been read, understood, and recorded in `references/<source>/UPSTREAM_LICENSES.md`.

Three audits were run in parallel and committed to `main` at [`fcc8f4b`](https://github.com/giomj/dev/commit/fcc8f4b):

- [`references/UPSTREAM_TERMS.md`](../../references/UPSTREAM_TERMS.md) — NOAA SWPC, USGS Earthquake, JPL HORIZONS (public-domain, rate-limit terms)
- [`references/owid/UPSTREAM_LICENSES.md`](../../references/owid/UPSTREAM_LICENSES.md) — OWID upstream chain (BLOCK on Energy Institute)
- [`references/irena/UPSTREAM_LICENSES.md`](../../references/irena/UPSTREAM_LICENSES.md) — IRENA three-regime license + operational WAF blocker

The audits surfaced three decisions requiring emperor adjudication. This ruling records them.

## Ruling — three decisions

### Decision 1 — Energy Institute (OWID BLOCK)

**Ruling: Drop the primary-energy-by-source dataset entirely. Ingest only the Ember-sourced rows of the electricity mix and renewable share.**

Rationale: The Energy Institute Statistical Review is `© Energy Institute 2025 — all rights reserved` with a narrow quote-with-attribution permission and explicit "extensive reproduction needs written permission" language. Publishing the full country-year matrix on a public archive plausibly crosses that line. S&P Global data embedded in EI is expressly non-redistributable and we cannot isolate which cells are affected. Requesting written EI permission (path (c)) would delay Wave 2 by 1-2 weeks with uncertain outcome; the shelf can proceed cleanly without EI data.

**Datasets authorized for OWID ingest under this ruling:**

| OWID slug | Upstream | Status | Notes |
|---|---|---|---|
| `co-emissions-per-capita` | Global Carbon Budget v15 + OWID population | AUTHORIZED | Fully CC BY 4.0 |
| `co2-intensity` | Global Carbon Budget v15 + Maddison 2023 | AUTHORIZED | Fully CC BY 4.0 |
| `share-elec-by-source` | Ember (2026) + Energy Institute backfill | AUTHORIZED — Ember rows only | Filter to rows where OWID's metadata lists Ember as the origin; drop EI-backfilled rows |
| `share-electricity-renewables` | Ember (2026) + Energy Institute backfill | AUTHORIZED — Ember rows only | Same filter as above |
| `energy-consumption-by-source-and-country` | Energy Institute (100%) | **DROPPED** | Do not ingest |

### Decision 2 — IRENA operational posture

**Ruling: Manual/assisted download. No automated ingestion of IRENASTAT until IRENA is contacted, and no contact required for Wave 2.**

Rationale: The `www.irena.org` domain sits behind an Azure WAF with a JavaScript challenge; automated ingestion is nowhere explicitly authorized. IRENA's own release schedule is annual (March for capacity, July for generation), so real-time polling is unnecessary and would be discourteous. The correct posture is a one-time manual PxWeb export of the tables we intend to publish, committed to `references/irena/data/` as pinned CSVs with `FETCHED_ON` provenance, and treated as replay-only during ingest.

**IRENA ingest rules under this ruling:**

- Pinned CSV files committed to `references/irena/data/<dataset>/FETCHED_<date>.csv`, one per dataset.
- Each file accompanied by a sibling `<dataset>-provenance.json` documenting: dataset name, URL of the PxWeb query that produced it, date fetched, IRENA publication year for citation, exact filter parameters used.
- Ingest script reads these pinned files — no live IRENA fetches from CI or from the ingest job.
- Every ingested row emits `© IRENA <year>` + the verbatim citation string per the audit's Section 6.1 recommendations.
- Manual PxWeb export is a Wave-2 emperor-executed step (or agent-executed with a screenshot record); this ruling does not require IRENA to be contacted before Wave 2 begins.

**Datasets authorized for IRENA ingest under this ruling:**

| Dataset | IRENA source | Status |
|---|---|---|
| Installed renewable capacity by country and technology | *Renewable Capacity Statistics 2025* / IRENASTAT | AUTHORIZED — pinned CSV |
| Renewable power generation by country and technology | *Renewable energy statistics 2025* / IRENASTAT | AUTHORIZED — pinned CSV |
| Capacity additions per year, by technology | *Renewable Capacity Statistics 2025* / IRENASTAT | AUTHORIZED — pinned CSV |
| Renewable energy costs — LCOE by technology (global averages) | *Renewable Power Generation Costs in 2024* (published PDF/tables) | AUTHORIZED — pinned CSV from published tables (permissive license block per audit §1.1) |

### Decision 3 — Commercial-use posture

**Ruling: The Grand Council reference shelf is a non-commercial personal reference archive. This is recorded here for citation and is the operative interpretation of "commercial use" for all upstream license compliance.**

The shelf has no monetization, no advertising, no gated content, no paid tier, no B2B redistribution, no derivative products for sale. It is a personal archive maintained by a single individual (James Gianotti) for public reference, transparency, and reproducibility. It is not a subscription service, not a data broker, not a resale product.

This interpretation applies to:

- IRENA's yearbook clause about third-party-embedded values potentially carrying commercial-use restrictions (audit §7.1).
- World Bank's non-commercial + no-derivative-without-consent default (audit §A0.5) — relevant only if Wave 3 adds World Bank series.
- Any future license that draws a commercial/non-commercial distinction.

Recording it here means every future reference-shelf reader can verify the interpretation we're operating under.

## Bindings issued from this ruling

1. **Ingest scope frozen to the tables above.** Anything not listed is out of Wave 2. Adding a source in a future wave requires its own license audit + ruling entry.
2. **Every ingested value carries dual attribution** per the OWID audit's §1.5 requirement: OWID + upstream provider for OWID-mediated data; upstream provider directly for IRENA/NOAA/USGS/HORIZONS data.
3. **Every ingest script's `known_failure_modes` includes a license-related failure mode**: e.g. "OWID CSV returns 403 Data-is-non-redistributable — halt and re-audit" and "IRENASTAT export changes format — replay from pinned CSV only." Extends Session-4's `known_failure_modes` binding.
4. **The `LICENSE.md` shelf file** ([`references/LICENSES.md`](../../references/LICENSES.md), pre-existing) will be extended to list every ingested dataset's upstream license inline. Wave 2 must update it.
5. **Non-commercial posture is a permanent shelf property.** If it ever changes — e.g. the shelf becomes a hosted service with any revenue mechanism — a new ruling must supersede this one before any dataset with a commercial-use restriction remains ingested.
6. **The Historian's apparatus criticus binding applies:** each panel on the eventual Wave-3 dashboard must display, alongside its value, (a) the upstream citation string, (b) the git commit hash of the ingest logic that produced the value, and (c) a link to the relevant `UPSTREAM_LICENSES.md` section.

## Consequences

- Wave 2 ingest is now authorized against these datasets under these bindings.
- Wave 3 dashboard work (per-source pages, schemas explorer, apparatus criticus panels) will surface the license text at the panel level, not just in a legal footer.
- Wave 4 Zenodo DOI registration will include this ruling in the archive bundle — the DOI record must not misrepresent the license posture.

## Recorded

Ruling authored by the Grand Council Synthesist per the emperor's spoken decision: "Expand" (with the specific path 1(a) + 2(a) + non-commercial personal reference archive recommended in the Gate-1 report).
