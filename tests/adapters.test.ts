import { describe, expect, it } from "vitest";
import { buildMockAdapters } from "../src/adapters/registry.js";
import { CONNECTOR_CONTRACTS, normalizePublication, type RawPublication } from "../src/adapters/connectors.js";
import { resultsToEvidence } from "../src/adapters/types.js";
import { createKnowledgeState, mapHypothesis, updateKnowledge } from "../src/recursions/knowledge.js";

describe("mock adapters", () => {
  it("are all disabled and read-only by default", () => {
    const adapters = buildMockAdapters();
    for (const a of Object.values(adapters)) {
      expect(a.config.enabled).toBe(false);
      expect(a.config.readOnly).toBe(true);
    }
  });

  it("expose all eight sources", () => {
    const adapters = buildMockAdapters();
    expect(Object.keys(adapters).sort()).toEqual(
      ["academic", "calendar", "cbinsights", "github", "gmail", "statista", "web", "wiley"].sort(),
    );
  });

  it("search filters fixtures by substring and is deterministic", async () => {
    const { academic } = buildMockAdapters();
    const r1 = await academic.search({ queries: ["5g"] });
    const r2 = await academic.search({ queries: ["5g"] });
    expect(r1).toEqual(r2);
    expect(r1.length).toBeGreaterThan(0);
    const none = await academic.search({ queries: ["no-such-term-xyz"] });
    expect(none).toHaveLength(0);
  });

  it("normalizes publication responses without personal data", async () => {
    const { statista } = buildMockAdapters();
    const results = await statista.search({ queries: ["iot"] });
    expect(results[0]?.source).toBe("statista");
    expect(results[0]?.url).toMatch(/^https:\/\//);
  });
});

describe("connector contracts", () => {
  it("forbid mutating gmail/calendar operations", () => {
    expect(CONNECTOR_CONTRACTS["gmail"]!.forbidden).toContain("send_email");
    expect(CONNECTOR_CONTRACTS["calendar"]!.forbidden).toContain("modify_calendar");
  });
  it("carry known publication collection ids", () => {
    expect(CONNECTOR_CONTRACTS["statista"]!.collections).toMatchObject({ premium: 367 });
    expect(CONNECTOR_CONTRACTS["cbinsights"]!.collections).toMatchObject({ default: 440 });
    expect(CONNECTOR_CONTRACTS["wiley"]!.collections).toMatchObject({ default: 370 });
  });
  it("normalizePublication maps the tested response shape", () => {
    const raw: RawPublication = {
      content: "abc",
      view_source_url: "https://example.invalid/x",
      score: 0.9,
      omnipub_uuid: "uuid-1",
      omnipub_title: "Title",
      publisher: "Pub",
      published_at: "2025-01-01T00:00:00Z",
    };
    const n = normalizePublication(raw, "wiley");
    expect(n.id).toBe("uuid-1");
    expect(n.title).toBe("Title");
    expect(n.url).toBe("https://example.invalid/x");
    expect(n.score).toBeCloseTo(0.9, 12);
  });
});

describe("adapter evidence feeds K with provenance", () => {
  it("external results shift K and record provenance", async () => {
    const { academic } = buildMockAdapters();
    const results = await academic.search({ queries: ["multipath"] });
    let k = createKnowledgeState([
      { id: "los", label: "los", confidence: 0.5 },
      { id: "nlos", label: "nlos", confidence: 0.5 },
    ]);
    const evidence = resultsToEvidence(results, "nlos", 7);
    k = updateKnowledge(k, evidence);
    expect(mapHypothesis(k).id).toBe("nlos");
    expect(k.provenance[0]!.source).toMatch(/adapter\.academic/);
    expect(k.provenance[0]!.step).toBe(7);
  });
});
