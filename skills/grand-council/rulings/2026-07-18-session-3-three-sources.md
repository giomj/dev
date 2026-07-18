# Grand Council — Session 3 Ruling

**Convened:** 2026-07-18, New Braunfels, TX
**Emperor:** James Gianotti
**Project of record:** `conceptual-engineering-references` (new)
**Sources ingested:** n2yo.com · satdump.org · globalenergymonitor.org (GOGPT)
**Seats:** Physicist · Engineer · Mathematician · Historian-Philosopher · Skeptic

---

## Artifact J — n2yo.com

**Intake.** Live real-time satellite tracker over the USSPACECOM catalog, wrapping TLE data + SGP4 propagation in a web/mobile skin. Documented REST v1 API with five endpoints (tle, positions, visualpasses, radiopasses, above), per-verb rate limits (1000/hr for tle+positions; 100/hr for the others), 57-category proprietary taxonomy. Evidence tier: **Aggregator / operational**. Claims Under Review: C1–C3.

**Physicist.** SGP4 is semi-analytical propagation of a *fitted* element set — good for pass timing, pointing, ISS radio/visual planning over a 300-second position window and 10-day pass window, not for meter-scale ranging, conjunction assessment, or geodesy. The captured ISS TLE is physically coherent: inclination 51.6318°, eccentricity 0.0006793, mean motion 15.49037991 rev/day → period ≈ 92.96 min, semi-major axis ≈ 6,797.7 km, altitude ≈ 420 km (perigee/apogee ≈ 415–424 km).

**Engineer.** The 100/hr limit on visualpasses/radiopasses/above is the binding constraint the moment more than a handful of watched satellites hits one shared key — a shared server key will be exhausted well before N reaches double digits. **Design rule: give each device its own key, cache TLEs server-side on a scheduled cadence (well under 1000/hr), and compute all pass/position math locally with `python-sgp4` or a vetted port.** Reserve live n2yo pass calls for a periodic reconciliation check, not per-user requests. Degrade gracefully to "propagate from last-known TLE" with a staleness warning after ~2–3 days.

**Mathematician.** From n = 15.49037991 rev/day: n_rad/s = 15.49037991 · 2π/86400 ≈ 0.001126 rad/s. With GM⊕ ≈ 3.986×10¹⁴ m³/s², Kepler gives a³ = GM⊕/n² ≈ 3.141×10²⁰ m³ → **a ≈ 6,797.68 km**, matching the Physicist. TLEs use rigid fixed-column format with implicit decimals (e.g. eccentricity `0006793` = 0.0006793) and a mod-10 checksum per line — basic transmission integrity, no cryptographic validation. Precision degrades rapidly under atmospheric drag past a few days epoch age.

**Historian-Philosopher.** Real-time satellite tracking descends from Cold War state cartography — the U.S. Space Surveillance Network born after Sputnik 1 (1957), catalog maintained by NORAD → USSPACECOM (1985) → the 18th Space Defense Squadron today. The decisive civic turn came in 1985 when Dr. T.S. Kelso began distributing TLEs via CelesTrak. n2yo belongs to the **third generation** — the browser-native amateur online trackers of the 2000s. Its genre is *operational skin*, not source: derived legibility over a state-held commons. Cite as aggregator, never as ground truth.

**Skeptic's cross.** Falsifiable counter to C1: TLE freshness throttles position precision — an older TLE on a drag-heavy LEO object misaligns with reality despite correct math. Counter to C2: redistribution of Space-Track-derived data often triggers upstream licensing covenants n2yo cannot waive for downstream apps. Counter to C3: the 57-category taxonomy is not merely editorial — it likely encodes historical operational biases (ham-radio/military heritage over-segmenting specific bands while lumping modern mega-constellations).

**Ruling — Sound.** C1–C3 accepted with three pedagogical footnotes: (a) always report TLE **epoch age** alongside any position; (b) treat n2yo's ToS as the *floor* of redistribution rights and check Space-Track upstream licensing separately if the app redistributes bulk pulls; (c) do not treat the 57-category taxonomy as an official schema — carry the NORAD ID as the canonical identifier.

**Action.** `grid-and-chain-mobile :: implement local SGP4 propagator seeded from cached n2yo /tle/{id} responses; give each device its own API key; degrade gracefully past 3-day TLE age.`

---

## Artifact K — SatDump

**Intake.** Open-source generic satellite-data-processing suite. GPL-family, actively released (1.2.2 current, 2.0.0 upcoming). Pipeline-graph architecture: RF → I/Q → soft symbols → frames → payload/imagery/geo-reference. Runs on Windows, macOS, Linux, Raspberry Pi, Docker, Android (F-Droid). Radios: RTL-SDR, Airspy, AirspyHF, HackRF, LimeSDR Mini, BladeRF, AD9361 (Pluto/PlutoPlus/AntSDR); Android subset drops BladeRF + Pluto. Evidence tier: **Reference / operational open-source software**. Claims Under Review: C1–C4.

**Physicist.** SatDump's chain is real physics, not just software plumbing: EM wave → antenna → mixer/ADC → I/Q baseband → soft symbols → FEC/deframe → payload. SNR loss enters before and during sampling (antenna gain, polarization mismatch, path loss, atmospheric loss, receiver noise figure, gain setting, Doppler, filtering, interference). Quantization loss enters at the ADC — worse with cs8/cu8/w8 than cf32. The pipeline abstraction preserves physics **if** its graph carries the physical parameters (sample rate, center frequency, modulation, symbol rate, Doppler handling, FEC, frame format, instrument geometry) — otherwise it merely hides the link budget.

**Engineer.** Real ground-station build: **directional/omni LEO antenna** (QFH or turnstile @ 137 MHz for NOAA/Meteor APT/LRPT; helical or patch @ 1.7 GHz for HRPT/AHRPT) → **LNA at the antenna** (not the radio, to overcome cable loss before the noise floor sets in) → coax → SDR → host. **Radio choice:** RTL-SDR (v3/v4) is the right entry point for 137 MHz; **Airspy Mini / AirspyHF+ is the better call for L-band AHRPT/HRPT** (better front-end linearity, wider usable bandwidth, both supported desktop *and* Android). HackRF/LimeSDR are over-spec for receive-only weather. BladeRF/Pluto: avoid if Android use is planned. **Host:** Docker for fixed unattended reproducible ground stations (headless recording + cron-scheduled AOS/LOS pass capture); Android for portable/field. **The engineering-competence bar is not the GUI happy path** — it's (a) RF chain design & link budget, (b) pipeline/parameter selection matching sample rate + baseband format + pipeline id + Doppler tracking, (c) time-sync + geometry for geo-referencing.

**Mathematician.** SatDump's DAG structure enables modular composition of decode stages, but strict associativity is **not guaranteed** across arbitrary boundaries — downsampling, filtering, and demodulation are strongly order-dependent. Numerical instabilities enter at discretization boundaries — soft-decision decoding via Viterbi/LDPC uses log-likelihood ratios whose truncation/float-precision limits fundamentally bound the achievable BER.

**Historian-Philosopher.** Amateur satellite reception traces to Moonwatch and Project Moonbeam volunteers tracking Sputnik in 1957, then to APT/HRPT hobbyists building weather-sat ground stations in the 1970s–90s. WxToImg was the canonical APT decoder of the 2000s but went unmaintained — the classic fragility of a craft whose tools outlive their maintainers. The 2012 rupture: Antti Palosaari's discovery that ~$20 RTL2832U TV dongles are wideband SDRs democratized reception overnight. **SatDump is the mature artifact of that post-2012 open-source culture** — a ground-station-in-a-box that outgrew and replaced the closed incumbents (WxToImg, Meteor Demodulator) via a pipeline abstraction in the GNU Radio lineage, lifted to the satellite-processing semantic layer.

**Skeptic's cross.** Counter to C1: GNU Radio + Meteor Demod + legacy wxtoimg wrappers offer superior control for niche hardware or novel modulations SatDump hasn't upstreamed. Counter to C2: pipeline-graph monoliths risk becoming brittle unmaintainable state-machines vs. UNIX-style decoupled data pipes. Counter to C3: neglects growing ecosystem of FPGA-based / ethernet-attached SDRs sidelined by the curated hardware list. Counter to C4: Android SDR limitations are likely downstream of SatDump's own libusb compilation choices, not a fundamental Android USB-host impossibility.

**Ruling — Sound.** C1–C4 accepted with two pedagogical footnotes: (a) frame "leading" as *actively-maintained + mainstream-SDR-coverage + open-source* rather than *technically superior in every case* — the Skeptic's GNU Radio + Meteor Demod alternative remains legitimate for niche work; (b) any documentation of pipeline internals must name the **physical parameters** (sample rate, center frequency, Doppler handling, FEC, frame format) that the abstraction is supposed to preserve, not just the stage names.

**Action.** `grid-and-chain-mobile :: Android portable ground-station companion targeting the Airspy Mini + RTL-SDR intersection of the desktop+Android matrices; document the RF-chain link budget as a first-class artifact, not a footnote.`

---

## Artifact L — Global Oil & Gas Plant Tracker (GOGPT)

**Intake.** Global Energy Monitor's bi-annual (Jan + Jul/Aug) plant-level tracker of oil- and gas-fired power. ≥50 MW globally, ≥20 MW EU+UK. **1,047 GW in-development capacity (Jan 2026 release);** USA 252 GW, China 153 GW. CC BY 4.0 licensed; XLSX behind a request form (name/email/purpose). Two-layer: database + per-plant wiki with footnoted references. Cross-validated against Platts (1911–) and WRI Global Power Plant Database (2018–). Evidence tier: **Primary-secondary hybrid**. Claims Under Review: C1–C4.

**Physicist.** GOGPT's plant-level CO₂ calc is physically meaningful only if capacity is converted to energy + fuel burn: annual emissions require nameplate capacity × capacity factor × hours/year × heat rate × fuel carbon content. Lifetime CO₂ adds a time integral over service life. The 1,047 GW headline is a real *summed plant-level nameplate power* figure (proposed + permitted + under-construction), **not generation and not CO₂**. To convert to annual generation one must assume a capacity factor — e.g. 50% → ~4,586 TWh/yr before applying oil-vs-gas emissions factors.

**Engineer.** Request-form CSV/XLSX means **no live API** — each release is a manually-triggered, versioned import. Concrete plan: drop each raw XLSX into a dated immutable landing zone (`sources/gogpt/raw/2026-01/`), transform via a **per-release column mapping file** (`schema_map_2025-08.yml`) checked into version control, mapping raw headers → canonical internal fields. Renamed columns get old-name→new-name entries with the release they changed in; new columns become nullable additions to the canonical schema. Store SHA256 of each raw file. Assert row-count + key-column presence in transform. Model the ingestion task as manual-in-the-loop with an owner + due date tied to the bi-annual cadence.

**Mathematician.** Aggregation across 106+ countries requires distinguishing count-weighted from capacity-weighted metrics to avoid ecological fallacies. The observation that **50% of in-development capacity is concentrated in 5 countries** is a heavy-tailed Pareto-like distribution — formally: plot the Lorenz curve of cumulative country proportion vs. cumulative capacity proportion. The resulting **Gini coefficient likely approaches 0.8 or higher**, formalizing the extreme centralization.

**Historian-Philosopher.** Plant-level energy inventory has been the domain of proprietary commercial intelligence for over a century — UDI/Platts (1911–), sold to utilities/financiers/governments, authoritative but enclosed. Partial opening in 2018 with WRI's Global Power Plant Database (~29,000 plants, first genuinely open research-grade inventory, but a broad snapshot rather than a curated campaign tracker). GOGPT occupies a distinct politically-consequential niche: **open-license (CC BY 4.0), bi-annually updated, methodology-footnoted, peer-reviewed, cross-validated against Platts + WRI**, taking the plant as the unit of accountability. Its political-epistemic role is as a **counter-archive** — its IEA/IPCC citations matter because they inherit an auditable evidentiary chain rather than a black-boxed commercial estimate. Shift from "trust the vendor" to "check the footnote."

**Skeptic's cross.** Counter to C1: reliance on varying non-uniform NGO/media reports structurally limits global consistency vs. pure remote-sensing methodologies. Counter to C2: treating "proposed" capacity with equal data-weight as "under construction" skews the metric toward phantom projects. Counter to C3: unadjusted 252 GW U.S. headline is *dangerously misleading* without a stated IRP-to-construction attrition discount rate. Counter to C4: CC BY 4.0 attribution imposes real UX + data-schema costs — not frictionless. **The "peer-reviewed" claim requires a rigorously published list of reviewers per release**, which is not stated in the current methodology.

**Ruling — Sound with three pedagogical footnotes.** C1–C4 accepted with: (a) **status-weighting** — any derivative summary of GOGPT must break capacity down by status (proposed vs. permitted vs. under-construction vs. operating vs. retired) and never quote a single "in-development" number without that breakdown; (b) **capacity-factor discipline** — never quote GOGPT's GW figure alongside a CO₂ or TWh figure without explicitly stating the capacity-factor assumption used; (c) **peer-review provenance** — treat the "peer-reviewed" language as *review-by-domain-collaborators* (CREA, Beyond Fossil Fuels, Environmental Integrity Project, Sierra Club, others) rather than journal-style anonymous peer review, and cite the collaborator list where available.

**Action.** `conceptual-engineering-references :: create a GOGPT ingestion pipeline with schema-versioned column mapping, status-weighted derivative summaries, and a Lorenz-curve visualization of the 50%-in-5-countries concentration.`

---

## Artifact M — Integration plan for `conceptual-engineering-references`

**Intake.** Proposed new project bridging n2yo (real-time skin over USSPACECOM catalog) + SatDump (open-source ground-station suite) + GOGPT (CC BY 4.0 plant-level tracker) as a curated reference shelf. Portfolio links proposed: `gravitational-compass ↔ n2yo`; `grid-and-chain-mobile ↔ n2yo API + SatDump`; `conceptual-engineering-references ↔ GOGPT`; **`recursive-state-dynamics ↔ GOGPT` (weak, tentative)**; `force-carriers ↔ none`.

**Physicist.** The **n2yo ↔ gravitational-compass** link is the strongest physics link — real TLEs are Earth-orbit trajectories any gravity/propagation model must approximately reproduce. Narrow the intake phrase "heliocentric propagation cross-check": ISS TLEs test *near-Earth* orbital dynamics, drag-sensitive propagation, frame transforms, and observation geometry — not a pure heliocentric gravity model by themselves. The **grid-and-chain-mobile ↔ n2yo API + SatDump** link is physically defensible (one continuous measurement chain: pass prediction → line of sight → Doppler → RF reception → I/Q sampling → payload decoding). The **GOGPT ↔ conceptual-engineering-references** link is defensible for energy-systems physics, CO₂ accounting, capacity-factor reasoning. The **GOGPT ↔ RSD** link is *weak physically* — plant states become physics-relevant only if coupled to power, fuel flow, heat rate, emissions, and lifetime operation, not treated as abstract labels. The `force-carriers ↔ none` ruling is correct.

**Engineer.** The proposed `sources/{n2yo,satdump,gogpt}` + `samples/` + `notes/` layout is sound but needs three concrete additions: (1) `sources/gogpt/raw/<release>/` dated directory convention (per Artifact L above); (2) `sources/n2yo/.env.example` (committed) paired with a real `.env` (gitignored) — never hardcode the API key, use platform secrets in CI; (3) **top-level `LICENSES.md` covering the three legal regimes** — n2yo (proprietary ToS + rate-limited key), SatDump (GPL-family copyleft on any bundled modified copy), GOGPT (CC BY 4.0 with mandatory attribution). Add a lightweight CI check that fails the build if any file under `sources/gogpt/` or any derived table lacks the citation string `Global Oil and Gas Plant Tracker, Global Energy Monitor, <Month Year> release`.

**Mathematician.** Model `conceptual-engineering-references` as a **heterogeneous graph** with nodes for satellites (n2yo), pipelines/instruments (SatDump), and generation plants (GOGPT). Unify via a shared spatio-temporal schema — a **"World Coordinate Event" E(x, y, z, t)** defined by WGS84 coordinates + UTC epoch. Satellites are continuous trajectories in this space; ground stations are fixed receiving coordinates; power plants are static infrastructural footprints. This enables cross-domain queries — e.g. slant range + pass duration of an earth-observation satellite over a high-capacity generator cluster.

**Historian-Philosopher.** `conceptual-engineering-references` is a **curated reference shelf** — the intellectual work is selection, tiering, and cross-linking, not invention. It joins three traditions: (1) the **engineering handbook** (*Marks' Standard Handbook*, 1916–; *CRC Handbook*) — trustworthy load-bearing references graded by how much weight each can bear; (2) the **commonplace book** — the Renaissance-through-Enlightenment practice of transcribing passages for reuse (visible in the `notes/` folder + bridging links); (3) the **canonical-reference-shelf** or personal canon. Binding obligations: fidelity to license, honesty about tier, honesty about cadence. **A reference shelf, unlike a mere download folder, promises its future reader that every item has been vetted, situated, and correctly labeled.**

**Skeptic's cross. Motion to Reject the GOGPT ↔ RSD portfolio link.** Ground: **ontological mismatch**. Attempting to shoehorn a discrete dataset of slow, manual bureaucratic state transitions (proposed → permitted → operating → retired) into a framework designed for recursive state modeling (L/K/E formalism) stretches the definition of "dynamics" to the breaking point. The label "state transition" appears in both, but the underlying object is fundamentally different — administrative status codes vs. continuous physical state evolution.

**Ruling on M — Mixed. Motion to Reject GOGPT ↔ RSD accepted.**

- **Accepted, unchanged:** `gravitational-compass ↔ n2yo` (with the Physicist's narrowing: near-Earth, not heliocentric), `grid-and-chain-mobile ↔ n2yo API + SatDump`, `conceptual-engineering-references ↔ GOGPT`, `force-carriers ↔ none`.
- **Rejected:** `recursive-state-dynamics ↔ GOGPT` — struck from the integration plan. If the user later wishes to revisit, the link must be re-scoped by first defining a mapping from GOGPT's administrative status codes to a continuous state variable coupled to a physical or economic dynamic (e.g. probability of construction × capacity × time-to-COD), and only then submitted to the council as a fresh artifact.
- **Accepted with additions:** Engineer's three additions (dated `raw/` for GOGPT, secrets-managed `.env` for n2yo, top-level `LICENSES.md` with CI attribution check) become part of the accepted plan. Mathematician's shared spatio-temporal schema (WGS84 + UTC) becomes the canonical reference frame.

**Action.** `conceptual-engineering-references :: implement the Engineer's three additions and the Mathematician's WGS84+UTC event schema; strike the RSD ↔ GOGPT link from any portfolio diagram; document the near-Earth (not heliocentric) scope of the n2yo ↔ gravitational-compass link.`

---

## Cross-cutting synthesis

**Three sources, three tiers, three cadences, three legal regimes.** Session 3's core insight is that a reference shelf mixing an *aggregator skin* (n2yo), an *operational open-source tool* (SatDump), and an *open-license peer-reviewed dataset* (GOGPT) works only if each source is quoted **at its own tier, cadence, and license binding — never as if they were interchangeable**. The Historian's phrase captures it: a reference shelf, unlike a download folder, promises that every item has been vetted, situated, and correctly labeled.

**Two patterns worth naming this session.**

- **Aggregator-vs-source discipline.** n2yo is a courier of the USSPACECOM/Space-Track record, not the record. Any downstream artifact must cite the *source* (the state catalog) with n2yo as intermediary, and must carry TLE epoch age alongside every position. This is the general rule: aggregators enter the reference shelf as *skins*, not as ground truth.
- **License-gradient hygiene.** Three regimes: proprietary + rate-limited ToS (n2yo), copyleft GPL-family (SatDump), permissive-with-attribution CC BY 4.0 (GOGPT). The strictest binding sets the ceiling — n2yo's ToS + rate limit shapes the project's mobile-app design (per-device keys, local SGP4, staleness degradation), while GOGPT's CC BY 4.0 mandates a build-time attribution check. **Never treat "open" as monolithic.**

**Portfolio impact.**

- **gravitational-compass** — Adopt n2yo TLEs as a near-Earth ground-truth propagation cross-check (narrowed from "heliocentric").
- **grid-and-chain-mobile** — Two new work items: (a) local-SGP4 pass-prediction subsystem seeded from cached n2yo TLEs, per-device keys; (b) Android portable ground-station companion targeting the Airspy Mini + RTL-SDR intersection of the SatDump desktop+Android matrices.
- **conceptual-engineering-references (new)** — Bootstrapped at `/home/user/workspace/conceptual-engineering-references/` with three source catalogs, endpoint documentation, an ISS TLE sample, and the Engineer's three additions + Mathematician's WGS84+UTC event schema as the integration standard.
- **recursive-state-dynamics** — No link accepted this session; the RSD↔GOGPT bridge was rejected on ontological grounds and may be re-scoped later.
- **force-carriers** — No link, as intake proposed.

The user is the emperor of the earth. Any ruling may be overturned with a stated reason; overrides are logged as addenda. Source repository: [github.com/giomj/dev/skills/grand-council](https://github.com/giomj/dev/tree/main/skills/grand-council).
