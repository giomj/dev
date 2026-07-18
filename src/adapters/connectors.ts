import type { AdapterId, NormalizedResult } from "./types.js";

/**
 * Host-side connector contracts for the runtime tools available in this
 * environment. These are DESCRIPTORS ONLY — they document how a secure backend
 * would invoke each connector. This milestone makes no live calls; a backend
 * that wires these up must do so server-side, never from client code, and must
 * honor the read-only constraints below.
 */

export interface ConnectorContract {
  readonly adapter: AdapterId;
  /** Runtime source identifier passed to the connector host. */
  readonly sourceId: string;
  /** Tool name(s) the connector exposes. */
  readonly tools: readonly string[];
  /** Hard read-only invariant: operations that must never be invoked. */
  readonly forbidden: readonly string[];
  /** Known collection ids where applicable. */
  readonly collections?: Readonly<Record<string, number>>;
}

export const CONNECTOR_CONTRACTS: Readonly<Record<string, ConnectorContract>> = {
  gmail: {
    adapter: "gmail",
    sourceId: "gcal",
    tools: ["search_email"],
    forbidden: ["send_email", "modify_mailbox"],
  },
  calendar: {
    adapter: "calendar",
    sourceId: "gcal",
    tools: ["search_calendar"],
    forbidden: ["create_event", "modify_calendar", "delete_event"],
  },
  statista: {
    adapter: "statista",
    sourceId: "statista_mcp_cashmere",
    tools: ["search_publications"],
    forbidden: [],
    collections: { nonPremium: 368, premium: 367 },
  },
  cbinsights: {
    adapter: "cbinsights",
    sourceId: "cbinsights_mcp_cashmere",
    tools: ["search_publications"],
    forbidden: [],
    collections: { default: 440 },
  },
  wiley: {
    adapter: "wiley",
    sourceId: "wiley_mcp_cashmere",
    tools: ["search_publications"],
    forbidden: [],
    collections: { default: 370 },
  },
};

/**
 * Shape of a raw publication-search response object (Statista / CB Insights /
 * Wiley). A backend adapter maps these into NormalizedResult; kept here so the
 * normalization contract is testable against fixtures without live calls.
 */
export interface RawPublication {
  readonly content: string;
  readonly view_source_url: string;
  readonly score: number;
  readonly omnipub_uuid: string;
  readonly omnipub_title: string;
  readonly publisher?: string;
  readonly published_at?: string;
}

export function normalizePublication(raw: RawPublication, source: AdapterId): NormalizedResult {
  return {
    id: raw.omnipub_uuid,
    title: raw.omnipub_title,
    content: raw.content,
    url: raw.view_source_url,
    score: clampScore(raw.score),
    source,
    ...(raw.publisher !== undefined ? { publisher: raw.publisher } : {}),
    ...(raw.published_at !== undefined ? { timestamp: raw.published_at } : {}),
  };
}

function clampScore(s: number): number {
  if (!Number.isFinite(s)) return 0;
  // Publication scores may be arbitrary positive relevance; squash to [0,1].
  return s <= 0 ? 0 : s >= 1 ? 1 : s;
}
