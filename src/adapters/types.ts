import type { Evidence, EvidenceProvenance } from "../recursions/knowledge.js";

/**
 * Research-plus-adapter layer (secure, optional, READ-ONLY).
 *
 * These adapters normalize external sources into a common citation-bearing
 * result type that can be turned into K evidence with provenance. In this
 * milestone all adapters are mock-backed and DISABLED BY DEFAULT. Live calls,
 * if ever enabled, must run host/server-side only — never from a mobile/web
 * client, never with tokens embedded in client code. See docs/backend-boundary.
 */

export type AdapterId =
  | "github"
  | "web"
  | "academic"
  | "gmail"
  | "calendar"
  | "statista"
  | "cbinsights"
  | "wiley";

/** Normalized, source-agnostic search result. */
export interface NormalizedResult {
  /** Stable id within the source (e.g. omnipub_uuid, message id, URL hash). */
  readonly id: string;
  readonly title: string;
  /** Snippet / content excerpt. */
  readonly content: string;
  /** Canonical URL for citation, if any. */
  readonly url?: string;
  /** Publisher / author / repo owner, source-dependent. */
  readonly publisher?: string;
  /** ISO timestamp of the source item, if known. */
  readonly timestamp?: string;
  /** Relevance score in [0,1] if the source provides one. */
  readonly score?: number;
  /** The adapter that produced this result. */
  readonly source: AdapterId;
}

export interface NormalizedCitation {
  readonly source: AdapterId;
  readonly url?: string;
  readonly title: string;
}

export interface AdapterQuery {
  readonly queries: readonly string[];
  /** Optional source-specific hints (collection ids, date ranges). */
  readonly options?: Readonly<Record<string, unknown>>;
  /** Max results to return. */
  readonly limit?: number;
}

export interface AdapterConfig {
  /** Live calls are OFF unless explicitly enabled by the host. */
  readonly enabled: boolean;
  /** If true, adapter must never mutate remote state (send email, edit calendar). */
  readonly readOnly: boolean;
}

export interface ResearchAdapter {
  readonly id: AdapterId;
  readonly config: AdapterConfig;
  /** Returns normalized results. Mock adapters serve from fixtures. */
  search(query: AdapterQuery): Promise<readonly NormalizedResult[]>;
}

/** Build a citation from a normalized result. */
export function toCitation(r: NormalizedResult): NormalizedCitation {
  return {
    source: r.source,
    title: r.title,
    ...(r.url !== undefined ? { url: r.url } : {}),
  };
}

/**
 * Convert normalized results into K evidence for a hypothesis space.
 * The mapping is deliberately simple and explicit: each result contributes a
 * likelihood ratio derived from its relevance score toward the hypothesis whose
 * id is named in `supports`. Provenance carries the source and citation so K
 * revisions remain auditable.
 */
export function resultsToEvidence(
  results: readonly NormalizedResult[],
  supports: string,
  step: number,
): Evidence {
  const likelihoods: Record<string, number> = {};
  let total = 0;
  for (const r of results) {
    const s = r.score ?? 0.5;
    total += s;
  }
  // Aggregate relevance boosts the supported hypothesis's likelihood.
  const boost = 1 + Math.min(2, total);
  likelihoods[supports] = boost;

  const first = results[0];
  const provenance: EvidenceProvenance = {
    source: `adapter.${first ? first.source : "unknown"}`,
    step,
    reason: `external evidence (${results.length} results) supports hypothesis "${supports}"`,
    ...(first?.url !== undefined ? { citation: first.url } : {}),
  };
  return { likelihoods, provenance };
}
