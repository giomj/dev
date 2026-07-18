# Architect's Self-Review — v1 → v2

## Rigid critique of the v1 proposal

**What was proposed (v1):**
5→6 seats (Physicist, Engineer, Mathematician, Historian-Philosopher, Skeptic, Emperor), one model per seat, ≤150 word openings, one Skeptic cross-exam, Emperor ruling in {Sound, Mixed, Reject}, log to memory/notes.

**Defects surfaced by the new brief and expanded artifact set:**

1. **Model coverage collision.** Historian-Philosopher and Skeptic were both assigned `claude_opus_4_8`. That defeats the "distinct models to reduce mode collapse" premise. → Fix: give Skeptic a different backing model (`gpt_5_5` shared with Physicist is fine because the *role prompt* differentiates them; better still, use `gemini_3_1_pro` for Skeptic so we get three families across the six seats).

2. **No abstention discipline for the Emperor.** The Emperor rules on everything, which is wrong for artifacts that are pedagogical reference material (Lorenz card, Sam Mathverse matrix pages) where there is nothing to litigate. → Fix: add a `Reference` verdict alongside `Sound / Mixed / Reject` for material that is correct-but-not-a-claim-under-dispute. Emperor issues a one-line acknowledgment and skips the full ritual.

3. **Missing evidence-tier field.** Some artifacts are peer-reviewed physics (Lorenz), some are hobbyist renders (ZVS), some are pop-social-media (Dimensions), some are self-published cosmology (PKM-BLT). Treating them at the same evidentiary weight is dishonest. → Fix: add `evidence_tier ∈ {Textbook, Peer-reviewed, Hobbyist, Self-published, Social-pop}` to intake.

4. **Skeptic's cross was undifferentiated.** In v1 the Skeptic writes one blob challenging "each opener." Better: Skeptic must target *at least one specific claim* per opener with a falsifiable counter, or explicitly concede that seat.

5. **Action item was hand-wavy.** "One concrete next step tied to a project" — but no template. → Fix: action item takes the form
   `PROJECT :: verb-first task :: acceptance criterion`
   e.g. `gravitational-compass :: implement two-body superposed-Φ toy model in Python :: reproduce equilibrium point r_L1 to 3 sig figs`.

6. **Persistence path was defined but not wired.** v1 said "log to memory/notes/grand-council/…" but never actually creates the directory or the index. → Fix: create the notes directory in this session and drop a running index.

7. **No mechanism for the user to overrule.** The Emperor is described as final. In practice the *user* is the emperor of the earth; the council advises. → Fix: rename the seat "Synthesist," not Emperor. The user retains veto and can flip Reject→Sound with a stated reason that gets logged.

8. **Rigidity concern.** User asked for "rigid" review — the Skeptic should be empowered to Reject the entire artifact when it fails a falsifiability test, not just "cross-examine." → Fix: Skeptic gains a `Motion to Reject` power that the Synthesist must either accept or explicitly override with a written reason.

9. **No claim extraction step.** Skipping directly to seat openings means seats debate different implicit claims. → Fix: intake includes a bulleted **Claims Under Review** list extracted by the Synthesist before seats open. Seats must reference claim IDs (C1, C2, …) in their openings.

## v2 protocol (adopted)

- Six seats. Backing models: Physicist=`gpt_5_5`, Engineer=`claude_sonnet_4_6` (orchestrator role, seat opening written inline), Mathematician=`gemini_3_1_pro`, Historian-Philosopher=`claude_opus_4_8`, Skeptic=`gemini_3_1_pro` with a distinct role prompt, Synthesist=orchestrator.
- Intake block: **Artifact**, **Evidence tier**, **Claims Under Review (C1…Cn)**.
- Seats 1–4 write ≤150 word openings, each referencing at least one claim ID.
- Skeptic writes ≤120 words with at least one falsifiable counter per non-abstaining seat, or a formal **Motion to Reject** on a named claim.
- Synthesist issues **Ruling ∈ {Sound, Mixed, Reject, Reference}** in ≤80 words.
- Action item in the strict template above, or `None — Reference material`.
- Log to `memory/notes/grand-council/2026-07-18-seven-artifacts.md` with links from the index.

## Artifact list (v2, seven items)

1. Lorenz equation infographic (chaos theory pedagogy) — Reference tier expected.
2. Sam Mathverse matrix pages (three pages: sec 3–7, sec 8–11, sec 12–15) — Reference tier; one combined ruling.
3. PKM-BLT "Cosmic Evolution Model" — Self-published cosmology. Highest-scrutiny item; likely Reject candidate.
4. 1000W ZVS induction heater schematic — Hobbyist. Mixed candidate.

Note: this consolidates the seven images into four rulings because three of the seven are a single-source matrix reference series.
