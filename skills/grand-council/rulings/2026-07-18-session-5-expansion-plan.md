# Grand Council — Session 5 (Expansion Plan Council)

**Date:** 2026-07-18
**Session type:** Brief 3-seat council (Engineer / Skeptic / Historian) — pre-execution review of the emperor's approved 4-wave expansion plan
**Precedes:** Wave 1 execution
**Precedent commits:** `f223bad` (session 4)

## Question before the council

Emperor Gianotti approved a four-wave expansion: (1) publish current dashboard to pplx.app; (2) grow the shelf by 5 sources + 2 schemas + Python bindings + CI validation harness; (3) refactor dashboard to multi-page reading room; (4) tag v0.1.0, mirror to GitHub Pages, register on Zenodo for a DOI. Emperor requested pause between waves. Council was asked to bless order-of-operations, flag failure modes, and file motions to modify before Wave 1 begins.

## Council roll (this session)

| Seat | Backing | Verdict |
|---|---|---|
| Engineer | Claude Sonnet 5.0 | Sound with mitigations |
| Skeptic | Gemini 3.1 Pro | Sound with two Motions to Modify |
| Historian-Philosopher | Claude Opus 4.8 | Sound with one binding correction |

Scribe (Notion) and Architect (GitHub) recording only — no vote on procedural matters.

## Individual briefs

### The Engineer

**Order-of-operations risk.** Publishing to pplx.app in Wave 1 is the right call. A permanent URL is cheap to redeploy — pplx.app is not a one-shot artifact but an endpoint that can be updated on every wave. Waiting for Wave 3 means three more council sessions with zero external proof-of-work, a worse trade than a slightly stale v0 page refreshed on schedule. **The real risk is deployment drift:** if Wave 1 hand-tunes anything about the current single-page build (bundler config, asset paths, routing assumptions) that Wave 3's multi-page refactor doesn't cleanly extend, we pay a migration tax later. Mitigation: **treat the Wave 1 publish as a deploy-pipeline exercise, not a content milestone** — lock down the build/deploy script now so Waves 2-3 only change content and page count, never the deploy mechanism itself.

**Schema versioning during expansion.** Nothing in commit `f223bad` pins consumers to a specific bindings artifact — the TypeScript is generated via `json2ts` off `schemas/*.schema.json` with no version suffix in filenames or npm package. Regenerating for the three existing schemas in Wave 2 will silently overwrite the outputs in place; if the JSON Schemas themselves don't change, output is byte-stable and harmless — but if anyone touches those schemas while adding the two new ones, any consumer importing by path gets an unannounced shape change with no version bump to warn them. **Safest posture:** freeze the three existing schemas as read-only for Wave 2 (new sources get new schema files only, zero edits to the old three); regenerate all bindings from a single deterministic script invocation so the diff is auditable; add a CI check that fails if `schema_version` changes without a corresponding major/minor bump — which folds naturally into the `validate.py` walker Wave 2 already plans to write. Keep Python and TypeScript generation in the same `scripts/generate_bindings.sh` so they can never drift out of sync.

**Refactor blast radius.** Single-page → multi-page as one commit conflates a structural refactor with four distinct feature adds. Split into: (a) routing/shell commit that introduces multi-page navigation while keeping all current content on one route, verified deployed before anything else changes; (b) per-source pages; (c) schemas explorer — the riskiest piece because JSON+TS side-by-side rendering means a live dependency on Wave-2 bindings output; (d) rulings timeline and council roll together. Each of the four content commits should deploy-preview independently. **Resist adding dark-mode toggle or provenance banners in the same wave as the routing refactor** — both are cross-cutting concerns that touch every page and are easiest to bolt on cleanly after the page skeleton is stable.

### The Skeptic

**Licensing landmines in Wave 2.** The current three-tier license gradient is dangerously naive for the new sources because it entirely ignores the transitive property of data provenance. **Our World in Data is the highest-risk vector**, not because of their overarching CC BY 4.0 license, but because they act as a downstream aggregator for datasets carrying their own restrictive covenants. Before any ingestion code is written, the Engineer must audit the upstream dependencies of every OWID and IRENA metric touched — explicitly screening for "Non-Commercial" (NC) or "No-Derivatives" (ND) poison pills hidden in the fine print. Furthermore, while US Government sources (NASA, NOAA, USGS) are legally public domain, their infrastructure imposes strict API rate limits and undocumented scraping policies that act as de facto terms of service. **If the Engineer fails to respect these infrastructural constraints, our IP will be banned before the Wave 2 PR is even merged.**

**Motion to Modify #1 — DOI quarantine.** Wave 4 must be amended to enforce a mandatory 7-day quarantine between the GitHub `v0.1.0` tag and the Zenodo DOI registration. Once Zenodo canonicalizes the repository, any unforced error — such as accidentally leaking the forbidden "1,047 GW" hero total during the Wave 3 refactor — becomes an immortalized embarrassment in the scientific record. The minimum verification checklist before minting the DOI must programmatically assert that zero dashboard pages contain cross-source aggregations and that `scripts/validate.py` passes on all JSON schemas. **Only after Emperor Gianotti and the Council visually and computationally audit the frozen v0.1.0 release for a full week should we commit to the irreversible permanence of a DOI.**

**Motion to Modify #2 — surface the failure modes on the frontend.** The single most embarrassing vulnerability a hostile reader will exploit is the silent suppression of backend metadata on the public-facing UI. It is a catastrophic optical failure to rigorously document uncertainties in backend `known_failure_modes` only to present a pristine, context-free dashboard to academics and journalists who know better. **Wave 3 must guarantee that every visual chart or dataset on the dashboard permanently surfaces a "Known Limitations" element populated directly from the ingest script's `known_failure_modes` array.** If we do not preemptively broadcast the statistical weaknesses of our own sources on the frontend, our adversaries will weaponize those omissions against us.

### The Historian-Philosopher

**What a DOI changes about the shelf's obligations.** A DOI is not a URL with better manners; it is a covenant of permanence, and the party who mints it — not the platform — becomes the guarantor of that covenant. Once the shelf carries a DOI, the emperor accepts three duties he does not hold today: (a) **immutability** — a published Zenodo record's files may never be silently altered; corrections arrive as a new version under a new version-DOI, while the concept-DOI keeps pointing at the whole lineage; (b) **resolvability in perpetuity** — the identifier must always resolve, even to a tombstone page that explains a withdrawal rather than a dead link; (c) **stewardship of citation** — once outsiders cite the shelf, altering a quoted number without a new version silently rewrites their footnotes too. **A written editorial policy must be committed to the repo BEFORE v0.1.0 is tagged**, not after; a masthead written after the first citation is an apology, not a policy. It need only state four things: what qualifies a source, how provenance is recorded, how corrections and retractions are issued (as new versions, never overwrites), and who holds editorial authority.

**Provenance banner — and its stronger form.** The proposed banner (fetch time, license, canonical citation, source URL) is necessary but incomplete: it tells the reader where the number came from but not how this shelf turned the source into the number shown. The stronger version pins the **git commit hash of the exact ingest and transformation logic** beside each panel, so a reader can trace not merely to the source but to the specific version of the code that read, filtered, and reshaped it. Editorial tradition already names this: in philology it is the **apparatus criticus** — the record beneath the text documenting every variant and editorial decision; in data science it is data lineage, formalized in the W3C PROV model. **A banner without the transformation version is a citation without an apparatus.**

**The name and dwelling-place of the archive.** A path like `skills/grand-council/session-3-sources/` is a fine cradle but an indefensible permanent address: it embeds a session number, a skill taxonomy, and a "3" that is already false the moment Wave 2 adds five sources — a citable artifact should not carry a name that lies about its own contents. The session-4 ruling against a separate SDK repo was correct and does not bind this case, because a reference archive differs *in kind* from an SDK: the SDK was rejected as a service the shelf refuses to become, whereas a reference repo is the shelf itself given its own front door. **Minimal move that honors the "reference shelf, not a service" doctrine:** promote the archive to a top-level `references/` path within `giomj/dev` now, keeping the monorepo canonical and the DOI pointed there. Reserve a dedicated `conceptual-engineering-references` repo only if outside citation volume later demands an identity fully independent of the monorepo. **Either way, do the rename BEFORE the DOI is minted** — a DOI freezes the path it is born with, and an archive should be christened before it is baptized, not renamed after strangers have written its old name into their footnotes.

## Binding council ruling (accepted for Wave 1 execution)

**Adopted, all three seats concurring:**

1. **Wave 1 publish proceeds** to permanent pplx.app URL. Treat as a deploy-pipeline lockdown, not a content milestone. No hand-tuning of build/deploy config that Wave 3 cannot cleanly extend.

2. **Rename `skills/grand-council/session-3-sources/` → `references/` at monorepo top level** BEFORE Wave 2 begins. A citable artifact must not carry a name that lies about its own contents.

3. **Editorial policy (`references/EDITORIAL_POLICY.md`) committed BEFORE v0.1.0 tag.** Must state: what qualifies a source, how provenance is recorded, correction/retraction procedure (new versions, never overwrites), editorial authority.

4. **Skeptic Motion to Modify #1 adopted:** 7-day quarantine between `v0.1.0` tag and Zenodo DOI registration. During quarantine, `scripts/validate.py` and the audit checklist must pass; emperor and council may raise objections.

5. **Skeptic Motion to Modify #2 adopted:** Wave 3 provenance element must surface `known_failure_modes` from the ingest script directly on the public dashboard, per-panel. No panel ships without one.

6. **Engineer's binding on schemas adopted:** the three existing schemas (`world_coordinate_event`, `tle_cache`, `hardware_compat`) are frozen read-only during Wave 2. New sources produce new schema files only. Bindings regeneration goes through a single `scripts/generate_bindings.sh` invocation. CI fails if `schema_version` changes without a matching semver bump.

7. **Engineer's binding on refactor adopted:** Wave 3 ships in four ordered commits — routing/shell, per-source pages, schemas explorer, rulings-timeline+council-roll. Dark mode and provenance apparatus are deferred to a fifth commit *after* the skeleton is stable.

8. **Historian's stronger provenance form adopted as target for Wave 3:** each panel displays not just source URL but the git commit hash of the ingest logic that produced its number. Formal name: **apparatus criticus**. The dashboard will carry an "Apparatus" label on each panel's provenance strip.

9. **Skeptic's licensing warning adopted as gate on Wave 2:** the Engineer must audit upstream dependencies for OWID and IRENA before writing any ingest code, and must respect rate-limit conventions for NASA / NOAA / USGS APIs. A `sources/<name>/UPSTREAM_LICENSES.md` file is required for any source that is itself an aggregator.

## Amendment protocol

Under the ruling of session 4, all amendments arrive as new commits in the `skills/grand-council/rulings/` directory. This ruling supersedes no prior ruling; it extends session 4 into execution guidance.

---

*Recorded 2026-07-18 by the Scribe (Notion connector). Archived to canonical GitHub by the Architect. When mirror and canonical disagree, GitHub wins.*
