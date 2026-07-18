# Backend boundary contract (research adapters)

The RSD simulator core runs **fully offline and deterministically**. The research-plus-adapter
layer is an *optional* enrichment that can feed external evidence into the **K** state with
provenance. This document defines the security boundary any real deployment must honor.

## Principles

1. **Disabled by default.** Every adapter ships with `{ enabled: false, readOnly: true }`
   (`DEFAULT_ADAPTER_CONFIG`). A live call requires an explicit host-side config override.
2. **Read-only.** Adapters must never mutate remote state. Gmail/Calendar connectors expose
   search only; sending email or modifying the calendar is forbidden (`CONNECTOR_CONTRACTS`).
3. **Host/server-side only.** Live connector invocation happens on a trusted backend. The
   client (mobile/web/CLI) never holds tokens, never reads connector credentials, and never
   shells out to a connector. If the product is client-only, ship the mock adapters and this
   contract, not live calls.
4. **No personal data in the repo.** Fixtures are generic, non-personal, and use `example.invalid`
   URLs.
5. **Determinism preserved.** The simulator does not depend on any adapter to run. Adapter
   evidence is an additive input to K, applied through the same audited `updateKnowledge` path.

## Contract shape

A backend implements the `ResearchAdapter` interface (`src/adapters/types.ts`):

```ts
interface ResearchAdapter {
  readonly id: AdapterId;
  readonly config: AdapterConfig;           // { enabled, readOnly }
  search(query: AdapterQuery): Promise<readonly NormalizedResult[]>;
}
```

Results are normalized to `NormalizedResult` (id, title, content, url?, publisher?, timestamp?,
score?, source) and turned into `Evidence` via `resultsToEvidence`, which stamps provenance
(source + citation + step + reason) onto every K revision.

## Runtime connector reference (host-side)

These are **descriptors** (`CONNECTOR_CONTRACTS`), not live bindings in this milestone:

| Adapter | source_id | tool(s) | Forbidden | Collections |
|---|---|---|---|---|
| gmail | `gcal` | `search_email({queries})` | send_email, modify_mailbox | — |
| calendar | `gcal` | `search_calendar({start_date,end_date,queries})` | create/modify/delete event | — |
| statista | `statista_mcp_cashmere` | `search_publications({query,...})` | — | 368 non-premium, 367 premium |
| cbinsights | `cbinsights_mcp_cashmere` | `search_publications({query,...})` | — | 440 |
| wiley | `wiley_mcp_cashmere` | `search_publications({query,...})` | — | 370 |

Publication search responses are JSON arrays of objects with `content`, `view_source_url`,
`score`, `omnipub_uuid`, `omnipub_title`, publisher fields and timestamps; `normalizePublication`
maps them to `NormalizedResult`.

Web and Academic adapters normalize citation metadata the same way and remain mock-backed unless
a secure backend already exists.

## Wiring a live backend (future milestone, not implemented here)

1. Instantiate real adapters host-side that call the connector tools with the source ids above.
2. Enforce `readOnly` and the `forbidden` operation list before every call.
3. Inject them via the same `ResearchAdapter` interface the mocks implement (dependency
   injection) so the simulator/tests are unchanged.
4. Keep credentials in the backend's secret store; never serialize them to the client or into
   simulation output.
