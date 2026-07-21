# Reference — Mulligan, "Espionage in Our AI Future" (2026)

**Source:** Thomas Mulligan, "Espionage in Our AI Future: Why Human Intelligence Still Matters," *Studies in Intelligence* 70, no. 1 (Extracts, March 2026).
**Publisher:** Central Intelligence Agency, Center for the Study of Intelligence.
**Canonical URL:** <https://www.cia.gov/resources/csi/studies-in-intelligence/studies-in-intelligence-vol-70-no-1-extracts-march-2026/espionage-in-our-ai-future-why-human-intelligence-still-matters/>
**PDF:** <https://www.cia.gov/resources/csi/static/Article-Espionage-in-Our-AI-Future-Studies-70-1-Mar2026.pdf>
**Local copy:** [`2026-03-mulligan-espionage-in-our-ai-future.pdf`](./2026-03-mulligan-espionage-in-our-ai-future.pdf)
**Read date:** 2026-07-21
**Reviewer seat:** Emperor + Council (see companion briefing).

---

## Why this is here

Mulligan's thesis — that widespread AI deployment raises rather than lowers
the marginal value of human intelligence tradecraft — is the mirror-image of
the problem C3MS.blackcat trains against. Blackcat's blue-team scenarios
assume adversaries who use the same AI tooling Mulligan describes:
LLM-generated cover stories, deepfake-enabled phishing, gait/behavior biometric
counter-surveillance, and real-time persuasive coaching. The article is a
concise doctrinal statement of what the *offensive* side of that curve looks
like from an IC practitioner's point of view, and it is a well-argued source
for three specific claims that inform blackcat's threat model and its
resilience module.

## Thesis

AI increases the marginal value of HUMINT. Five things change (§2); three
things do not (§3). The argument is robust across futurist upper-bound
scenarios (§4), including partial loss-of-control cases.

## Three claims that map into blackcat

1. **AI-enabled fabrication is asymmetric on the attacker side.**
   §2.2 argues that LLM-generated legends are cheap to produce and expensive
   to detect. This is the operative assumption behind blackcat's
   synthetic-identity red-team injections and phishing-with-deepfake
   scenarios. Mulligan does not solve the problem; he names it as an
   enduring feature of the environment.

2. **AI surveillance changes what "sloppy" means.**
   §2.3 catalogs ubiquitous cameras, drones and nano-drones, gait/behavior
   biometrics, and the collapse of anonymity in urban environments. For
   blackcat's blue team this reframes "operational security" from a set of
   discrete gestures (VPN, burner, PGP) into a continuous posture problem
   that AI-augmented adversaries can attack from many low-cost angles at once.

3. **Encryption assumptions may weaken; analog fallbacks re-enter scope.**
   §3.3 argues that AI-augmented cryptanalysis (and possibly quantum) may
   degrade the security of electronic communication faster than the
   defensive stack catches up. Even a partial success case raises the
   relative value of channels that are AI-resistant *by construction* —
   physical, low-bandwidth, human-to-human. For blackcat this is not a
   recommendation to teach dead drops; it is a design pressure toward
   *communication-plan resilience*: every training scenario should include
   a "cryptographic assumption breaks" branch.

## What Mulligan does not do

- **Adversary symmetry is not modeled.** Costs of AI-augmented tradecraft
  fall on both sides. Blackcat's scenarios must reflect this rather than
  treating the adversary as a monolith with unlimited AI leverage.
- **Institutional lag is unquantified.** Human retraining, tool
  procurement, and legal review pace matter for both attacker and defender.
- **The loss-of-control section relies on external scenarios** (ai-2027.com,
  Somani et al. 2025) rather than an independent argument. Blackcat should
  treat that section as one possible upper-bound scenario, not a
  probability-weighted forecast.

## Direct integrations into blackcat

| Blackcat surface | Mulligan section | Integration note |
| --- | --- | --- |
| Threat model — synthetic identity | §2.2 | Add "LLM-generated legend" as a first-class attacker capability, not a subtype of phishing. |
| Threat model — physical + digital surveillance | §2.3 | Cross-domain scenarios where gait/behavior biometrics correlate with credential compromise. |
| Curriculum — agent/insider validation | §2.4 | Introduce a "micro-expression classifier is wrong" exercise; do not train blue teams to trust the ML output uncritically. |
| Curriculum — social engineering | §2.5, §3.2 | Real-time AI-coached social engineering as a red-team capability; blue team learns to recognize *shape* of coaching, not content. |
| Resilience module — comms fallback | §3.3 | Every scenario must include a "primary channel compromised at cryptographic layer" branch. |
| Doctrine — "signal in noise" | §3.2 | Blue-team epistemics: how to weight sources when the channel is polluted with AI-generated persuasion. |

## Cited works worth pulling forward

The following works cited by Mulligan are candidates for their own reference
entries in this directory once reviewed:

- Abbas & Taeihagh (2024), "Unmasking Deepfakes" — [DOI](https://doi.org/10.1016/j.eswa.2024.124260)
- Diel et al. (2024), "Human Performance in Detecting Deepfakes" — meta-analysis of 56 papers, [DOI](https://doi.org/10.1016/j.chbr.2024.100538)
- Hussain et al. (2024), "AI-driven Behavior Biometrics" — [DOI](https://doi.org/10.1016/j.engappai.2023.107218)
- Matz et al. (2024), "Generative AI for Personalized Persuasion" — [DOI](https://doi.org/10.1038/s41598-024-53755-0)
- Bao et al. (2022), Benamira et al. (2021), Gohr (2019) — ML-based cryptanalysis; relevant to §3.3 resilience module.
- Peterson (2025) on "epistemic collapse" — relevant to §3.2 blue-team epistemics.

## Status

- [x] Sourced and archived locally
- [x] Annotation drafted
- [x] Council briefing paper drafted — see [`skills/grand-council/briefings/2026-07-21-ai-humint-blackcat.md`](../../skills/grand-council/briefings/2026-07-21-ai-humint-blackcat.md)
- [ ] Blackcat threat-model diff opened (Phase-B work)
- [ ] Cited works reviewed and, where appropriate, ingested as their own references
