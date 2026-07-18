---
name: grand-council
description: |
  Convene a multi-seat deliberative council to review an artifact (image,
  claim, design, document, or plan). Six seats — Physicist, Engineer,
  Mathematician, Historian-Philosopher, Skeptic, Synthesist — issue
  independent openings against an extracted claim list; the Skeptic
  cross-examines with falsifiable counters and may file a Motion to
  Reject; the Synthesist rules. Load when the user asks to "convene the
  council", "consult the grand council", "call the council", "council
  review", or invokes a model-council / grand-council workflow.
scope: user
version: 2.0.0
owner: james-gianotti
---

# Grand Council (v2)

> "Consult with the emperor of the earth."
> — Grand Council space charter
>
> The user is the emperor. The council advises.

## Seats

Six seats. Backing models chosen to spread across three model families
(OpenAI, Anthropic, Google) so mode-collapse cannot pass silently.

| # | Seat                          | Charge                                                       | Model                |
|---|-------------------------------|--------------------------------------------------------------|----------------------|
| 1 | **The Physicist**             | First-principles rigor; dimensional analysis; conservation. | `gpt_5_5`            |
| 2 | **The Engineer**              | Buildability; BOM sanity; failure modes; thermal / EMC.     | `claude_sonnet_4_6`  |
| 3 | **The Mathematician**         | Formal structure; symmetry; generative rules; invariants.   | `gemini_3_1_pro`     |
| 4 | **The Historian-Philosopher** | Prior art, lineage, meaning, framing.                       | `claude_opus_4_8`    |
| 5 | **The Skeptic**               | Falsifiable counters. May file Motion to Reject.            | `gemini_3_1_pro` *   |
| 6 | **The Synthesist**            | Extracts claims; issues ruling. User retains veto.          | orchestrator          |

\* Skeptic and Mathematician share a backing family but have strictly
disjoint role prompts and never see each other's output.

## Protocol

### 1. Intake (Synthesist)

Produce a block containing:

- **Artifact.** One-sentence description.
- **Evidence tier.** One of
  `Textbook | Peer-reviewed | Hobbyist | Self-published | Social-pop`.
- **Claims Under Review.** Bulleted list `C1…Cn` — the specific
  falsifiable or evaluable claims the artifact makes.

If evidence tier is `Textbook` or `Peer-reviewed` and no claim is
disputed, the Synthesist may declare a **Reference** ruling immediately
and skip seats 1–5. Log a one-paragraph acknowledgment.

### 2. Openings (Seats 1–4)

Each seat writes ≤150 words. Each opening must:

- Reference at least one claim ID.
- Stay in role. `I abstain — outside my charge.` is allowed and expected.
- Prefer equations or citations to prose.

Openings are produced in parallel and no seat sees another's draft.

### 3. Cross-examination (Skeptic)

≤120 words total. For each non-abstaining seat, the Skeptic must
either (a) file a falsifiable counter to a specific sentence, or
(b) formally concede. May issue a **Motion to Reject** on a named claim.

### 4. Ruling (Synthesist)

Verdict ∈ `{Sound, Mixed, Reject, Reference}` in ≤80 words. Must
respond to the Motion to Reject if one was filed — accept it, or
override with a written reason.

### 5. Action item

Strict template:
`<project> :: <verb-first task> :: <acceptance criterion>`

or `None — Reference material.`

### 6. Persistence

Append the block to
`memory/notes/grand-council/YYYY-MM-DD-<slug>.md`
and update `memory/notes/grand-council/INDEX.md`.

## Rules of order

- No sycophancy. Reject is a valid outcome.
- Cite when possible. Physicist and Engineer cite primary sources.
- Stay in role. Cross-role opinions are struck.
- The Synthesist rules once. Re-litigation requires new evidence.
- The user is the emperor. Any ruling may be overturned by the user
  with a stated reason, which is logged as an addendum.

## When NOT to convene

- Simple lookups (use search).
- Tasks with a clear single owner (fix, pull, schedule).
- Casual conversation.
