# Grand Council Briefing — AI+HUMINT Implications for C3MS.blackcat

**Date:** 2026-07-21
**Session:** Blackcat / Briefing 1
**Slug:** `ai-humint-blackcat`
**Type:** Reference briefing (not a ratification)
**Verdict class:** Reference
**Source under review:** Mulligan, "Espionage in Our AI Future," *Studies in Intelligence* 70.1 (March 2026). [Article](https://www.cia.gov/resources/csi/studies-in-intelligence/studies-in-intelligence-vol-70-no-1-extracts-march-2026/espionage-in-our-ai-future-why-human-intelligence-still-matters/) · [PDF](https://www.cia.gov/resources/csi/static/Article-Espionage-in-Our-AI-Future-Studies-70-1-Mar2026.pdf)
**Companion reference:** [`c3ms-blackcat/references/2026-03-mulligan-espionage-ai-future.md`](../../../c3ms-blackcat/references/2026-03-mulligan-espionage-ai-future.md)

---

## 1. Purpose

To translate Mulligan's argument — that AI *raises* the marginal value of
human intelligence tradecraft — into concrete design pressure on the
C3MS.blackcat blue-team training platform, and to record the Council's
per-seat reading of what that means for blackcat's threat model, curriculum,
and resilience module.

This briefing does not authorize implementation work. It establishes the
doctrinal frame; implementation follows a separate ratification.

## 2. Assumptions carried from Mulligan

1. **A1.** AI capability continues to improve, but no assumption of
   near-term artificial general intelligence is required for the argument
   to hold.
2. **A2.** Humans retain meaningful access to relevant information in the
   scenarios blackcat trains against.
3. **A3.** Adversaries and defenders both have access to comparable AI
   tooling; asymmetries come from operational maturity, data access, and
   institutional agility rather than from raw model capability.

Assumption A3 is Council-added — Mulligan writes from a collector's
perspective and does not model attacker/defender symmetry in AI leverage.
Blackcat's threat model must.

## 3. Thesis translated to blackcat

**Mulligan's thesis:** In an AI-saturated environment, HUMINT gains marginal
value because (a) technical intelligence is democratized, (b) human channels
resist AI-generated noise, and (c) analog communication regains value if AI
degrades cryptographic security.

**Blackcat translation:** In an AI-saturated environment, blue-team
capability gains marginal value because (a) automated defensive tooling is
democratized and rapidly saturates, (b) human judgment resists
AI-generated social-engineering pressure, and (c) resilience against
cryptographic compromise depends on training humans to operate degraded
comms channels well.

The mirror image is exact enough to be useful and inexact enough to be
worth interrogating — the Council does both below.

## 4. Design pressures on blackcat

### 4.1 Threat model

- **T1. Synthetic identity as first-class attacker capability.** LLM-generated
  legends, personas, and correspondence histories are cheap. Blackcat must
  model them as their own category, not as a phishing subtype.
- **T2. Cross-domain surveillance correlation.** Gait, behavior biometrics,
  drone/nano-drone observation, and credential telemetry combine into a
  single adversary posture. Scenarios must span physical + digital.
- **T3. Real-time AI-coached social engineering.** The adversary is not a
  script; it is a human wearing an earpiece backed by a persuasive-fine-tuned
  LLM. Blue-team recognition targets the *shape* of coaching, not the words.
- **T4. Cryptographic assumption failure.** At least one scenario branch
  per exercise must simulate encryption compromise (implementation flaw
  found by AI, phishing scaled by deepfake, or asymmetric primitive weakened
  by combined AI+quantum advance).
- **T5. Deepfake-enabled walk-in.** Adversary contact channels (support
  tickets, whistleblower forms, insider-tip lines) are polluted by
  AI-generated approaches. Blue team learns to triage under uncertainty.

### 4.2 Curriculum

- **C1. "Signal in noise" epistemics.** A dedicated module on weighting
  sources when channels carry AI-generated persuasion. Adapt Mulligan's
  Diane / interlocutor formalization (his §3.2) as a training exercise.
- **C2. Micro-expression / ML-output skepticism.** Do not train blue teams
  to trust ML classifier outputs uncritically. Include exercises where the
  classifier is confidently wrong.
- **C3. Resilience under degraded comms.** Scenarios that begin with
  "primary channel compromised at cryptographic layer" and require the
  blue team to reconstitute trust with low-bandwidth, high-friction
  fallbacks.
- **C4. Analog reasoning under AI dominance.** Not "how to run a dead drop"
  — how to reason about information provenance when the electronic channel
  is untrusted.

### 4.3 Doctrine

- **D1. Blackcat teaches epistemics, not tools.** The half-life of specific
  tools in an AI-saturated environment is short. The half-life of good
  reasoning about sources, channels, and adversary coaching is long.
- **D2. Adversary symmetry is default.** Every scenario assumes the
  adversary has comparable AI leverage; asymmetries must be justified.
- **D3. Retirement clause carries over.** If blackcat's curriculum cannot
  demonstrate measurable blue-team improvement against AI-augmented red
  teams within 18 months of full launch, the program is retired publicly.
  (Consistent with AFRC.helios retirement doctrine.)

## 5. Per-seat verdicts

| # | Seat | Verdict | One-line rationale |
| --- | --- | --- | --- |
| 1 | Steward of Time (Ada Lovelace) | Reference | Mulligan is date-stamped March 2026; blackcat's reading is time-bounded and revisable. |
| 2 | Physicist | Reference | Out-of-domain but methodologically clean — argument is properly conditional. |
| 3 | Engineer | Reference with request | Requests that T4 (cryptographic failure) be treated as a *scenario branch generator*, not a single exercise. |
| 4 | Ethicist | Reference | Blackcat is defensive; training humans to resist AI-augmented manipulation is ethically load-bearing. |
| 5 | Skeptic | Dissent, no veto | Warns against over-indexing on a single IC essay; wants two more independent sources before doctrine hardens. |
| 6 | Historian | Reference | Places Mulligan correctly in the post-Snowden, post-LLM tradecraft-literature arc. |
| 7 | Fuel-Cycle Analyst | Abstain | Out of domain. |
| 8 | Materials Steward | Abstain | Out of domain. |
| 9 | Diagnostics | Reference | Endorses C2 (ML-output skepticism) as diagnostically sound. |
| 10 | Ecologist | Reference | Notes second-order effects on information-ecosystem hygiene. |
| 11 | Economist | Reference | Marginal-value argument (§3.1) is economically well-formed; blackcat's mirror argument inherits its validity. |
| 12 | Scribe (Notion) | Reference | Briefing template compatible with Grand Council — Rulings database. |
| 13 | Architect (GitHub) | Reference | Repo layout accepts `skills/grand-council/briefings/` as a new artifact class. |

**Tally:** 10 Reference · 1 Reference-with-request · 1 Dissent (no veto) · 2 Abstain · 0 Veto.

**Council verdict:** Reference. The Mulligan argument is admitted as a
doctrinal input to C3MS.blackcat. Skeptic's dissent is recorded as a
standing requirement to add two independent sources before any curriculum
element leaves reference status and enters implementation.

## 6. Skeptic's dissent — recorded in full

> One well-argued essay from a single IC practitioner-scholar is a data
> point, not a doctrine. Before any of C4.1–C4.3 becomes a shipped
> curriculum element, blackcat must ingest at least two independent
> sources that either corroborate or contest Mulligan on each of the
> three load-bearing claims (§2.2 fabrication asymmetry, §2.3 surveillance
> saturation, §3.3 cryptographic degradation). Sources should include at
> least one that argues the *opposite* case where such a case exists in
> the literature. If no counter-argument exists, that itself is a finding
> to record.

## 7. Instruments of the Realm

- **Master of the Codex (GitHub) —** filed this briefing under `skills/grand-council/briefings/` and the source under `c3ms-blackcat/references/`.
- **Scribe (Notion) —** mirror to Grand Council — Rulings database with Verdict = Reference.
- **Master of the Coin (Stripe) —** stands down.
- **Steward of the Public Treasury (Alpaca) —** stands down.
- **Steward of the Crypto Treasury (BingX) —** stands down.
- **The Eye (Google Cloud Vision) —** stands down.
- **Master of the Bazaar (BigCommerce) —** stands down.

## 8. Next actions

1. **Skeptic's mandate:** identify two independent sources per load-bearing claim (see §6). Candidates in the [reference annotation](../../../c3ms-blackcat/references/2026-03-mulligan-espionage-ai-future.md) under "Cited works worth pulling forward."
2. **Blackcat maintainer:** open a threat-model diff PR incorporating T1–T5 as **draft** entries (not merged) pending Skeptic's mandate.
3. **Emperor's discretion:** decide whether to publish this briefing as a
   public artifact (via `references/` in the repo README) or keep it as an
   internal doctrinal input.
4. **Standing review:** revisit this briefing on or before 2027-01-21 (six
   months) or when a comparable primary source is published, whichever
   comes first.

## 9. Retirement clause

If, within 18 months of blackcat's next curriculum ratification, the
platform cannot demonstrate measurable blue-team improvement against
AI-augmented red-team scenarios grounded in Mulligan's framework, this
briefing is retired publicly and its influence on blackcat doctrine is
withdrawn.

---

*Filed by:* Perplexity (agent, this session).
*Ratified by:* pending Emperor's disposition.
*Notion mirror:* Grand Council — Rulings, entry `ai-humint-blackcat`.
