import { normalizePublication } from "./connectors.js";
import {
  ACADEMIC_FIXTURES,
  CALENDAR_FIXTURES,
  CBINSIGHTS_RAW,
  GITHUB_FIXTURES,
  GMAIL_FIXTURES,
  STATISTA_RAW,
  WEB_FIXTURES,
  WILEY_RAW,
} from "./fixtures.js";
import { DEFAULT_ADAPTER_CONFIG, MockAdapter } from "./mock.js";
import type { AdapterConfig, AdapterId, ResearchAdapter } from "./types.js";

/**
 * Build the full set of mock research adapters. Every adapter is disabled and
 * read-only by default. Dependency injection: callers pass a config map to
 * (only ever, in a secure backend) enable specific adapters.
 */
export function buildMockAdapters(
  overrides: Partial<Record<AdapterId, AdapterConfig>> = {},
): Record<AdapterId, ResearchAdapter> {
  const cfg = (id: AdapterId): AdapterConfig => overrides[id] ?? DEFAULT_ADAPTER_CONFIG;

  const statista = STATISTA_RAW.map((r) => normalizePublication(r, "statista"));
  const cbinsights = CBINSIGHTS_RAW.map((r) => normalizePublication(r, "cbinsights"));
  const wiley = WILEY_RAW.map((r) => normalizePublication(r, "wiley"));

  return {
    github: new MockAdapter("github", GITHUB_FIXTURES, cfg("github")),
    web: new MockAdapter("web", WEB_FIXTURES, cfg("web")),
    academic: new MockAdapter("academic", ACADEMIC_FIXTURES, cfg("academic")),
    gmail: new MockAdapter("gmail", GMAIL_FIXTURES, cfg("gmail")),
    calendar: new MockAdapter("calendar", CALENDAR_FIXTURES, cfg("calendar")),
    statista: new MockAdapter("statista", statista, cfg("statista")),
    cbinsights: new MockAdapter("cbinsights", cbinsights, cfg("cbinsights")),
    wiley: new MockAdapter("wiley", wiley, cfg("wiley")),
  };
}
