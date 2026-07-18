import { describe, expect, it } from "vitest";
import {
  breakEvenDutyCycle,
  createEnergyState,
  resolveHarvest,
  stepEnergy,
  validateEnergyConfig,
  type EnergyConfig,
} from "../src/recursions/energy.js";
import { mW, uW, type Joules, type Ratio, type Seconds, type Watts } from "../src/domain/units.js";
import { ILLUSTRATIVE } from "../src/engine/scenario.js";

const cfg: EnergyConfig = {
  capacityJ: 1e-2 as Joules,
  brownoutJ: 1e-3 as Joules,
  leakageW: uW(1),
  quiescentW: uW(1),
  coldStartFloorW: uW(10),
};

describe("energy config validation", () => {
  it("rejects brownout >= capacity", () => {
    expect(() =>
      validateEnergyConfig({ ...cfg, brownoutJ: 1e-2 as Joules }),
    ).toThrow(/brownoutJ/);
  });
  it("rejects negative fields", () => {
    expect(() => validateEnergyConfig({ ...cfg, leakageW: -1 as Watts })).toThrow();
  });
  it("rejects non-positive capacity", () => {
    expect(() => validateEnergyConfig({ ...cfg, capacityJ: 0 as Joules })).toThrow();
  });
});

describe("no double conversion", () => {
  it("applies RF->DC then converter exactly once when given RF incident", () => {
    const r = resolveHarvest({
      rfIncidentW: 100e-6 as Watts,
      etaRfToDc: 0.5 as Ratio,
      etaConverter: 0.8 as Ratio,
    });
    expect(r.harvestedDcW).toBeCloseTo(50e-6, 12); // 100µW * 0.5
    expect(r.netDcW).toBeCloseTo(40e-6, 12); // * 0.8, not squared
  });

  it("does NOT re-apply RF->DC when given post-rectifier harvested DC", () => {
    const r = resolveHarvest({ harvestedDcW: 50e-6 as Watts, etaConverter: 0.8 as Ratio });
    expect(r.harvestedDcW).toBeCloseTo(50e-6, 12);
    expect(r.netDcW).toBeCloseTo(40e-6, 12); // only converter applied once
  });
});

describe("clipping and brownout", () => {
  it("clips stored energy at capacity", () => {
    const state = createEnergyState(cfg, 9.9e-3 as Joules);
    const res = stepEnergy(
      cfg,
      state,
      { harvestedDcW: mW(1), etaConverter: 1 as Ratio },
      0 as Watts,
      10 as Seconds,
    );
    expect(res.state.storedJ).toBe(cfg.capacityJ);
  });

  it("never goes below zero and flags brownout", () => {
    const state = createEnergyState(cfg, 1.5e-3 as Joules);
    const res = stepEnergy(
      cfg,
      state,
      { harvestedDcW: 0 as Watts, etaConverter: 1 as Ratio },
      mW(1),
      100 as Seconds,
    );
    expect(res.state.storedJ).toBeGreaterThanOrEqual(0);
    expect(res.state.brownedOut).toBe(true);
  });

  it("cold-start blocks harvest below floor while at reserve", () => {
    const state = createEnergyState(cfg, 1e-3 as Joules); // at brownout reserve
    const res = stepEnergy(
      cfg,
      state,
      { harvestedDcW: uW(8), etaConverter: 1 as Ratio }, // 8µW < 10µW floor
      0 as Watts,
      1 as Seconds,
    );
    expect(res.ledger.coldStartBlocked).toBe(true);
    // No net DC credited -> passive load only, energy should not increase.
    expect(res.state.storedJ).toBeLessThanOrEqual(state.storedJ);
  });
});

describe("break-even duty cycle regression (report §6.3b)", () => {
  it("treats ~8µW net DC vs ~15mW radio as ~0.05% duty, not continuous", () => {
    // "before other losses": leakage ignored, quiescent ~1µW per report.
    const d = breakEvenDutyCycle(
      ILLUSTRATIVE.indoorHarvestDcW, // 8 µW treated as usable DC
      0 as Watts,
      uW(1),
      ILLUSTRATIVE.bleActiveW, // 15 mW
    );
    // (8 - 1) / 15000 = 4.667e-4
    expect(d).toBeGreaterThan(4e-4);
    expect(d).toBeLessThan(6e-4);
    // Emphatically NOT continuous feasibility.
    expect(d).toBeLessThan(1e-2);
  });

  it("returns 0 duty when passive budget already exceeds harvest", () => {
    const d = breakEvenDutyCycle(uW(1), uW(2), uW(2), mW(15));
    expect(d).toBe(0);
  });
});
