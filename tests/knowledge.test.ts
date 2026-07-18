import { describe, expect, it } from "vitest";
import {
  createKnowledgeState,
  expectedInfoGainBits,
  mapHypothesis,
  updateKnowledge,
  validateKnowledgePriors,
  type Evidence,
} from "../src/recursions/knowledge.js";

const priors = [
  { id: "los", label: "line of sight", confidence: 0.5 },
  { id: "nlos", label: "non line of sight", confidence: 0.5 },
];

describe("knowledge validation", () => {
  it("rejects empty hypothesis set", () => {
    expect(() => validateKnowledgePriors([])).toThrow();
  });
  it("rejects duplicate ids", () => {
    expect(() =>
      validateKnowledgePriors([
        { id: "a", label: "a", confidence: 1 },
        { id: "a", label: "a2", confidence: 1 },
      ]),
    ).toThrow(/duplicate/);
  });
  it("normalizes priors to sum to 1", () => {
    const s = createKnowledgeState([
      { id: "a", label: "a", confidence: 3 },
      { id: "b", label: "b", confidence: 1 },
    ]);
    const total = s.hypotheses.reduce((acc, h) => acc + h.confidence, 0);
    expect(total).toBeCloseTo(1, 12);
    expect(mapHypothesis(s).id).toBe("a");
  });
});

describe("Bayesian update + provenance", () => {
  it("shifts confidence toward supported hypothesis and reduces entropy", () => {
    let s = createKnowledgeState(priors);
    const before = s.entropy;
    const ev: Evidence = {
      likelihoods: { los: 3, nlos: 1 },
      provenance: { source: "test", step: 0, reason: "evidence favors LOS" },
    };
    s = updateKnowledge(s, ev);
    expect(mapHypothesis(s).id).toBe("los");
    expect(s.entropy).toBeLessThan(before);
  });

  it("records a provenance entry per revision with before/after and reason", () => {
    let s = createKnowledgeState(priors);
    s = updateKnowledge(s, {
      likelihoods: { los: 2, nlos: 1 },
      provenance: {
        source: "adapter.academic",
        step: 3,
        reason: "academic evidence",
        citation: "https://example.invalid/paper",
      },
    });
    expect(s.provenance).toHaveLength(1);
    const rev = s.provenance[0]!;
    expect(rev.step).toBe(3);
    expect(rev.source).toBe("adapter.academic");
    expect(rev.reason).toBe("academic evidence");
    expect(rev.citation).toBe("https://example.invalid/paper");
    expect(rev.before["los"]).toBeCloseTo(0.5, 12);
    expect(rev.after["los"]!).toBeGreaterThan(0.5);
    expect(rev.entropyAfter).toBeLessThan(rev.entropyBefore);
  });

  it("throws when evidence zeroes all posterior mass", () => {
    const s = createKnowledgeState(priors);
    expect(() =>
      updateKnowledge(s, {
        likelihoods: { los: 0, nlos: 0 },
        provenance: { source: "test", step: 0, reason: "impossible" },
      }),
    ).toThrow();
  });

  it("expected info gain scales with entropy and informativeness", () => {
    const s = createKnowledgeState(priors); // entropy = 1 bit
    expect(expectedInfoGainBits(s, 0.5)).toBeCloseTo(0.5, 12);
    expect(() => expectedInfoGainBits(s, 2)).toThrow();
  });
});
