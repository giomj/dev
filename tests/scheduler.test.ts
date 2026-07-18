import { describe, expect, it } from "vitest";
import {
  SLEEP_ACTION,
  selectAction,
  type Action,
  type SchedulerConfig,
} from "../src/scheduler/scheduler.js";
import { createEnergyState, type EnergyConfig } from "../src/recursions/energy.js";
import { mW, uW, type Joules, type Seconds, type Watts } from "../src/domain/units.js";

const eCfg: EnergyConfig = {
  capacityJ: 1 as Joules,
  brownoutJ: 0.1 as Joules,
  leakageW: uW(1),
  quiescentW: uW(1),
  coldStartFloorW: uW(10),
};
const sCfg: SchedulerConfig = { energyNeutralHeadroomJ: 1 as Joules };
const sleep = SLEEP_ACTION(uW(1), 1 as Seconds);

describe("scheduler action choice", () => {
  it("prefers the highest EIG-per-joule feasible action", () => {
    const energy = createEnergyState(eCfg, 0.5 as Joules);
    const cheapHighValue: Action = {
      kind: "sense",
      powerW: mW(0.5),
      durationS: 0.05 as Seconds,
      expectedInfoGainBits: 1,
    };
    const expensiveLowValue: Action = {
      kind: "communicate",
      powerW: mW(15),
      durationS: 0.05 as Seconds,
      expectedInfoGainBits: 1.1,
    };
    const d = selectAction(sCfg, energy, uW(8), [cheapHighValue, expensiveLowValue], sleep, 1 as Seconds);
    expect(d.action.kind).toBe("sense");
    expect(d.efficiencyBitsPerJ).toBeGreaterThan(0);
    expect(d.rationale).toMatch(/information per joule/);
  });

  it("refuses actions that would breach the brownout reserve", () => {
    const energy = createEnergyState(eCfg, 0.101 as Joules); // ~1 mJ above reserve
    const bigAction: Action = {
      kind: "communicate",
      powerW: mW(15),
      durationS: 1 as Seconds, // 15 mJ >> 1 mJ available
      expectedInfoGainBits: 5,
    };
    const d = selectAction(sCfg, energy, uW(8), [bigAction], sleep, 1 as Seconds);
    expect(d.action.kind).toBe("sleep");
    expect(d.rejected.some((r) => /reserve|available/.test(r.reason))).toBe(true);
  });

  it("only permits sleep when browned out", () => {
    const energy = createEnergyState(eCfg, 0.05 as Joules); // below reserve
    const anyAction: Action = {
      kind: "sense",
      powerW: uW(10),
      durationS: 0.01 as Seconds,
      expectedInfoGainBits: 1,
    };
    const d = selectAction(sCfg, energy, uW(8), [anyAction], sleep, 1 as Seconds);
    expect(d.action.kind).toBe("sleep");
    expect(d.rejected.some((r) => /browned out/.test(r.reason))).toBe(true);
  });

  it("enforces energy-neutral ceiling with zero headroom", () => {
    const energy = createEnergyState(eCfg, 0.9 as Joules);
    const cfgTight: SchedulerConfig = { energyNeutralHeadroomJ: 0 as Joules };
    // available above reserve = 0.8 J, but ceiling = available + 0 = 0.8 J.
    const action: Action = {
      kind: "compute",
      powerW: 1 as Watts,
      durationS: 0.85 as Seconds, // 0.85 J > 0.8 J ceiling
      expectedInfoGainBits: 2,
    };
    const d = selectAction(cfgTight, energy, uW(8), [action], sleep, 1 as Seconds);
    expect(d.action.kind).toBe("sleep");
  });
});
