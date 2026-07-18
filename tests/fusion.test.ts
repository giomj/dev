import { describe, expect, it } from "vitest";
import {
  createFusedState,
  fusedStep,
  validateFusedConfig,
  type FusedConfig,
} from "../src/recursions/fusion.js";
import { IDX } from "../src/recursions/fusion-state.js";
import type { Beacon, RssiObservation } from "../src/recursions/ble.js";
import type { ImuSample } from "../src/recursions/imu.js";
import type {
  Dbm,
  Hertz,
  Metres,
  MetresPerSecond2,
  RadiansPerSecond,
  Seconds,
} from "../src/domain/units.js";

const cfg: FusedConfig = {
  imu: {
    accelBias: [0 as MetresPerSecond2, 0 as MetresPerSecond2],
    gyroBias: 0 as RadiansPerSecond,
    accelNoiseStd: 0.05 as MetresPerSecond2,
    gyroNoiseStd: 0.01 as RadiansPerSecond,
    sampleRateHz: 10 as Hertz,
    zupt: {
      enabled: true,
      accelThreshold: 0.12 as MetresPerSecond2,
      gyroThreshold: 0.03 as RadiansPerSecond,
      speedThreshold: 0.15,
      measurementStd: 0.02,
    },
  },
  ble: {
    refRssiDbm: -59 as Dbm,
    pathLossExponent: 2.4,
    rangeVarianceM2: 20,
    minRssiDbm: -95 as Dbm,
    maxRssiDbm: -40 as Dbm,
    maxRangeM: 60 as Metres,
    nisGateThreshold: 6.63,
  },
  init: { initialPosStd: 3 as Metres, initialVelStd: 0.2, initialYawStd: 0.05 },
};

const DT = 0.1 as Seconds;
const beacons = new Map<string, Beacon>([
  ["b0", { id: "b0", position: [20 as Metres, 0 as Metres] }],
]);

const stationarySample: ImuSample = {
  timeS: 0 as Seconds,
  ax: 0 as MetresPerSecond2,
  ay: 0 as MetresPerSecond2,
  yawRate: 0 as RadiansPerSecond,
};

function rssiForRange(d: number): number {
  return cfg.ble.refRssiDbm - 10 * cfg.ble.pathLossExponent * Math.log10(d);
}

describe("fused config validation", () => {
  it("rejects non-positive init std", () => {
    expect(() =>
      validateFusedConfig({ ...cfg, init: { ...cfg.init, initialPosStd: 0 as Metres } }),
    ).toThrow();
  });
});

describe("fusedStep orchestration", () => {
  it("reports one IMU prediction per step", () => {
    const s = createFusedState(cfg, [0, 0, 0, 0, 0]);
    const res = fusedStep(cfg, s, {
      imuSample: stationarySample,
      bleObservations: [],
      beacons,
      dt: DT,
    });
    expect(res.diagnostics.imuPredictions).toBe(1);
  });

  it("accepts a consistent BLE observation and counts it", () => {
    const s = createFusedState(cfg, [8, 0, 0, 0, 0]);
    const obs: RssiObservation = {
      timeS: 0 as Seconds,
      beaconId: "b0",
      rssiDbm: rssiForRange(12) as Dbm,
    };
    const res = fusedStep(cfg, s, {
      imuSample: stationarySample,
      bleObservations: [obs],
      beacons,
      dt: DT,
    });
    expect(res.diagnostics.bleAccepted).toBe(1);
    expect(res.diagnostics.bleRejected).toBe(0);
  });

  it("rejects a duplicate beacon within one scan", () => {
    const s = createFusedState(cfg, [8, 0, 0, 0, 0]);
    const obs: RssiObservation = {
      timeS: 0 as Seconds,
      beaconId: "b0",
      rssiDbm: rssiForRange(12) as Dbm,
    };
    const res = fusedStep(cfg, s, {
      imuSample: stationarySample,
      bleObservations: [obs, obs],
      beacons,
      dt: DT,
    });
    expect(res.diagnostics.bleAccepted).toBe(1);
    expect(res.diagnostics.bleRejected).toBe(1);
    expect(res.diagnostics.ble.some((d) => d.reason === "duplicate-beacon")).toBe(true);
  });

  it("handles an empty scan (BLE dropout) as pure prediction", () => {
    const s = createFusedState(cfg, [0, 0, 1, 0, 0]);
    const res = fusedStep(cfg, s, {
      imuSample: stationarySample,
      bleObservations: [],
      beacons,
      dt: DT,
    });
    expect(res.diagnostics.bleAccepted).toBe(0);
    expect(res.diagnostics.bleRejected).toBe(0);
    // Position advanced by dead reckoning.
    expect(res.state.mean[IDX.px]!).toBeGreaterThan(0);
  });
});
