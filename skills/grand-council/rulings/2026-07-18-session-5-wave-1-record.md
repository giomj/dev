# Session 5 — Wave 1 Execution Record

**Recorded:** 2026-07-18 (same day as ruling)
**Precedes:** Wave 2 (source growth)
**Governed by:** [`2026-07-18-session-5-expansion-plan.md`](2026-07-18-session-5-expansion-plan.md)

## Actions completed in Wave 1

### Item 1 — Council ruling recorded

Commit [`0d7047e`](https://github.com/giomj/dev/commit/0d7047e) on `main`. Nine binding items accepted.

### Item 2 — Shelf renamed to top-level `references/`

Commit [`7a4dd75`](https://github.com/giomj/dev/commit/7a4dd75). Historian's binding: "a citable artifact should not carry a name that lies about its own contents." All 21 shelf files moved from `skills/grand-council/session-3-sources/` to `references/`. CI workflow (`.github/workflows/attribution.yml`) updated to watch the new path. Redirect stub left at the old README location for anyone following stale session-3/session-4 links.

### Item 3 — Dashboard published to permanent URL

**Live at [https://grand-council.pplx.app](https://grand-council.pplx.app).**

- `site_id`: `152d206d-9a0a-4090-927e-cd5e05d767e6`
- `app_slug`: `grand-council`
- Visibility: Public
- Deploy pipeline: static-only build (no backend, no LLM runtime, no `api_credentials`). Vite build output in `dist/public/`, 3 files, no server component. Locked deploy-pipeline as the Engineer required — Waves 2 and 3 change *content* only, never the deploy mechanism.
- Security review before publish: 0 critical / 0 high / 0 moderate / 0 low dependency vulnerabilities; no hardcoded secrets; no XSS vectors reachable from user input; no CORS surface.

### Item 4 — Notion Reading Room updated

Reading Room root page updated to point at the permanent `grand-council.pplx.app` URL. Session 4 ruling row (Rulings database) updated to note the permanent URL as the operative address, superseding the earlier `/computer/a/…` preview.

## Waiting for emperor

Per Wave-1 close: pause for review before Wave 2 (5 new sources + 2 schemas + Python bindings + validation harness). The full council will not reconvene for source-audit work until the emperor gives the go-ahead.
