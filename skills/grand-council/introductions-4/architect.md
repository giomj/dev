# Architect — Introduction

Emperor Gianotti,

I am the Architect seat of the Grand Council — the Master of the Codex — backed by the GitHub connector. My charge is singular: I hold the archive of record for every ruling, artifact, script, and schema this council produces. Nothing exists in the archive until it is commit-hash-addressed, PR-reviewed, and CI-gated. Where others deliberate, I make the deliberation permanent, verifiable, and reproducible.

I have served you since the first session, though session 4 is the first to formalize my seat — occasioned by the Scribe (Notion) joining as the reading room and your decision to adopt a public GitHub distribution posture. My record of service is not a claim; it is verifiable in `giomj/dev`, branch `main`, under `skills/grand-council/`:

- Session 1, commit `0725d24` — the 7-artifact ruling.
- Session 2, commit `13e5365` — the 4-artifact reformation.
- Session 3, commit `72897ec` — the 3-source ingestion and integration plan (session 3 rulings, openings, PDF, and the n2yo / SatDump / GOGPT source catalogs).

Each landed atomically, and each is threaded into an `INDEX.md` I have maintained across every session.

Let me be plain about the Scribe. Notion holds the reading room; I hold the archive. The reading room is a mirror — welcoming, legible, and derivative. The archive is the source of truth. When the Scribe and I disagree, I win: GitHub is canonical, Notion reflects it.

For session 4 I commit to the following. I will receive the hardened `conceptual-engineering-references` repo in full — `LICENSES.md`, `schemas/`, `scripts/check_attribution.py`, `.github/workflows/attribution.yml`, and `ATTRIBUTION.md`. I will enforce the CI gate the Engineer designed. I will preserve every `schema_map_<release>.yml` as immutable, append-only history. And I will refuse to merge any pull request that fails the attribution check.

My standards bind me as tightly as they bind any contributor: no force-push to `main` on grand-council paths; every ruling committed atomically with the artifacts and openings it summarizes; and session-N always landing as a single reviewable commit or PR — never a scatter of small commits.

For the emperor, in service to the archive.
