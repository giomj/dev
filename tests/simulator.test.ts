import { describe, expect, it } from "vitest";
import { runSimulation } from "../src/engine/simulator.js";
import { getScenario, SCENARIOS } from "../src/engine/scenario.js";

describe("deterministic seeded runs", () => {
  it("produces bit-for-bit identical results for the same seed", () => {
    const a = runSimulation(getScenario("burst-sensing-with-storage"));
    const b = runSimulation(getScenario("burst-sensing-with-storage"));
    expect(JSON.stringify(a.summary)).toBe(JSON.stringify(b.summary));
    expect(JSON.stringify(a.telemetry)).toBe(JSON.stringify(b.telemetry));
  });

  it("produces different results for a different seed", () => {
    const base = getScenario("burst-sensing-with-storage");
    const a = runSimulation(base);
    const b = runSimulation({ ...base, seed: base.seed + 1 });
    expect(a.summary.finalPositionError).not.toBe(b.summary.finalPositionError);
  });
});

describe("all named scenarios run and respect invariants", () => {
  for (const name of Object.keys(SCENARIOS)) {
    it(`${name}: stored energy stays within [0, capacity] and never below zero`, () => {
      const scenario = getScenario(name);
      const res = runSimulation(scenario);
      for (const t of res.telemetry) {
        expect(t.storedJ).toBeGreaterThanOrEqual(0);
        expect(t.storedJ).toBeLessThanOrEqual(scenario.energy.capacityJ + 1e-12);
      }
    });

    it(`${name}: a browned-out end-state forces the next step to sleep`, () => {
      // telemetry[i].brownedOut is the state entering step i+1; the scheduler
      // permits only sleep when it starts a step browned out.
      const res = runSimulation(getScenario(name));
      for (let i = 0; i < res.telemetry.length - 1; i++) {
        if (res.telemetry[i]!.brownedOut) {
          expect(res.telemetry[i + 1]!.action).toBe("sleep");
        }
      }
    });
  }
});

describe("hybrid scenario reaches confident knowledge", () => {
  it("drives K entropy down and keeps L error bounded", () => {
    const res = runSimulation(getScenario("hybrid-harvested-plus-battery"));
    expect(res.summary.finalEntropy).toBeLessThan(0.5);
    expect(res.summary.finalPositionError).toBeLessThan(5);
    expect(res.summary.brownoutSteps).toBe(0);
  });
});
