# Grand Council — Session Index

The Grand Council is a multi-seat deliberation construct for reviewing
artifacts (images, claims, designs, documents). Six seats — Physicist,
Engineer, Mathematician, Historian-Philosopher, Skeptic, Synthesist —
each backed by a distinct model, produce independent openings against
an extracted claim list; the Skeptic cross-examines with falsifiable
counters and may file a Motion to Reject; the Synthesist rules.

Skill definition: `SKILL.md`.
Architect's self-review: `architect-review.md`.

## Sessions

| Date        | Slug                            | Artifacts | Rulings                                              |
|-------------|---------------------------------|-----------|------------------------------------------------------|
| 2026-07-18  | `seven-artifacts`               | 7 → 5     | A Sound · B Reference · C Reject · D Mixed · E Sound |
| 2026-07-18  | `session-2-four-artifacts`      | 4         | See `rulings/2026-07-18-session-2-four-artifacts.md` |
| 2026-07-18  | `session-3-three-sources`       | 4 (J/K/L/M) | J Sound · K Sound · L Sound · M Mixed (Motion to Reject GOGPT↔RSD accepted) |
| 2026-07-18  | `session-4-distribution`        | 4 (C1..C4)  | C1 Sound (reinforced) · C2 Sound (corrected) · C3 Mixed (Motion to Modify accepted) · C4 Sound (bound) |

## Session 4 layout

- `rulings/2026-07-18-session-4-distribution.md` — addendum ruling on distribution posture
- `artifacts-4.md` — C1..C4 intake (repo posture, service posture, SDK posture, dashboard posture)
- `openings-4/` — Engineer, Historian, Skeptic openings
- `introductions-4/` — full council introductions (Physicist, Mathematician, Scribe [new permanent], Architect [formalized])
- `session-3-sources/` (hardened) — public shelf: three JSON schemas, TypeScript bindings, CI attribution gate, three-tier LICENSES.md
- `.github/workflows/attribution.yml` (repo root) — CI-enforced attribution + rate-of-change check

## Session 3 layout

- `2026-07-18-grand-council-session-3.pdf` — 7-page PDF ruling
- `build_pdf_s3.py` — ReportLab renderer
- `artifacts-3.md` — intake with C1..Cn claim lists per artifact
- `openings-3/` — per-seat openings (physicist, engineer, mathematician, historian, skeptic)
- `rulings/2026-07-18-session-3-three-sources.md` — full ruling markdown
- `session-3-sources/` — source catalogs for n2yo, SatDump, GOGPT (+ live ISS TLE sample). This is the seed of the new `conceptual-engineering-references` project of record.
