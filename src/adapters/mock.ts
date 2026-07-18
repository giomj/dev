import type {
  AdapterConfig,
  AdapterId,
  AdapterQuery,
  NormalizedResult,
  ResearchAdapter,
} from "./types.js";

/** Default config: disabled + read-only. Safe by construction. */
export const DEFAULT_ADAPTER_CONFIG: AdapterConfig = {
  enabled: false,
  readOnly: true,
};

/**
 * A deterministic mock adapter backed by in-memory fixtures. It performs no
 * network I/O and requires no credentials, so the simulator stays fully offline
 * and deterministic. Filtering is a simple case-insensitive substring match
 * against title/content so tests are predictable.
 */
export class MockAdapter implements ResearchAdapter {
  readonly id: AdapterId;
  readonly config: AdapterConfig;
  private readonly fixtures: readonly NormalizedResult[];

  constructor(
    id: AdapterId,
    fixtures: readonly NormalizedResult[],
    config: AdapterConfig = DEFAULT_ADAPTER_CONFIG,
  ) {
    this.id = id;
    this.config = config;
    this.fixtures = fixtures;
  }

  async search(query: AdapterQuery): Promise<readonly NormalizedResult[]> {
    const terms = query.queries.map((q) => q.toLowerCase()).filter((q) => q.length > 0);
    const matches = this.fixtures.filter((r) => {
      if (terms.length === 0) return true;
      const hay = `${r.title} ${r.content}`.toLowerCase();
      return terms.some((t) => hay.includes(t));
    });
    const limit = query.limit ?? matches.length;
    return matches.slice(0, limit);
  }
}
