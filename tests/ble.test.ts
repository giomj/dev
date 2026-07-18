import { describe, expect, it } from "vitest";
import {
  bleRangeUpdate,
  rssiToRange,
  validateBleConfig,
  type Beacon,
  type BleConfig,
  type RssiObservation,
} from "../src/recursions/ble.js";
import { createFusedState, type FusedConfig } from "../src/recursions/fusion.js";
import { IDX } from "../src/recursions/fusion-state.js";
import type { Dbm, Metres, MetresPerSecond2, RadiansPerSecond, Seconds, Hertz } from "../src/domain/units.js";

const ble: BleConfig = {
  refRssiDbm: -59 as Dbm,
  pathLossExponent: 2.4,
  rangeVarianceM2: 20,
  minRssiDbm: -95 as Dbm,
  maxRssiDbm: -40 as Dbm,
  maxRangeM: 60 as Metres,
  nisGateThreshold: 6.63,
};

const fusedCfg: FusedConfig = {
  imu: {
    accelBias: [0 as MetresPerSecond2, 0 as MetresPerSecond2],
    gyroBias: 0 as RadiansPerSecond,
    accelNoiseStd: 0.05 as MetresPerSecond2,
    gyroNoiseStd: 0.01 as RadiansPerSecond,
    sampleRateHz: 10 as Hertz,
    zupt: {
      enabled: false,
      accelThreshold: 0.12 as MetresPerSecond2,
      gyroThreshold: 0.03 as RadiansPerSecond,
      speedThreshold: 0.15,
      measurementStd: 0.02,
    },
  },
  ble,
  init: { initialPosStd: 3 as Metres, initialVelStd: 0.2, initialYawStd: 0.05 },
};

const beacon: Beacon = { id: "b0", position: [20 as Metres, 0 as Metres] };

function obsAt(rssi: number, id = "b0"): RssiObservation {
  return { timeS: 0 as Seconds, beaconId: id, rssiDbm: rssi as Dbm };
}

describe("BLE config validation", () => {
  it("rejects non-positive rangeVariance", () => {
    expect(() => validateBleConfig({ ...ble, rangeVarianceM2: 0 })).toThrow();
  });
  it("rejects min >= max RSSI", () => {
    expect(() => validateBleConfig({ ...ble, minRssiDbm: -40 as Dbm })).toThrow();
  });
});

describe("rssiToRange", () => {
  it("returns 1 m at the reference RSSI", () => {
    expect(rssiToRange(ble, ble.refRssiDbm)!).toBeCloseTo(1, 6);
  });
  it("is monotonically decreasing in RSSI", () => {
    const near = rssiToRange(ble, -65)!;
    const far = rssiToRange(ble, -85)!;
    expect(far).toBeGreaterThan(near);
  });
  it("returns null for non-finite input", () => {
    expect(rssiToRange(ble, Number.NaN)).toBeNull();
  });
  it("honors per-beacon calibration override", () => {
    const cal: Beacon = { ...beacon, calibration: { refRssiDbm: -50 as Dbm } };
    // At rssi = -50 with a -50 ref, range should be 1 m regardless of model default.
    expect(rssiToRange(ble, -50, cal)!).toBeCloseTo(1, 6);
  });
});

describe("BLE EKF range update", () => {
  it("accepts a consistent range and pulls the estimate toward the beacon geometry", () => {
    // True position (10,0); beacon at (20,0) => true range 10. Feed the RSSI for 10 m.
    const s = createFusedState(fusedCfg, [8, 0, 0, 0, 0]); // biased estimate
    const rssiFor10 = ble.refRssiDbm - 10 * ble.pathLossExponent * Math.log10(10);
    const res = bleRangeUpdate(ble, s, obsAt(rssiFor10), beacon);
    expect(res.diagnostic.accepted).toBe(true);
    expect(res.diagnostic.nis).not.toBeNull();
    expect(res.diagnostic.innovation).not.toBeNull();
    // Estimated px should move from 8 toward 10 (measured range larger than predicted).
    expect(res.state.mean[IDX.px]!).toBeGreaterThan(8);
    expect(res.state.positionUncertainty).toBeLessThan(s.positionUncertainty);
  });

  it("rejects an unknown beacon and leaves state unchanged", () => {
    const s = createFusedState(fusedCfg, [8, 0, 0, 0, 0]);
    const res = bleRangeUpdate(ble, s, obsAt(-70, "ghost"), undefined);
    expect(res.diagnostic.accepted).toBe(false);
    expect(res.diagnostic.reason).toBe("unknown-beacon");
    expect(res.state).toBe(s);
  });

  it("rejects out-of-bounds RSSI", () => {
    const s = createFusedState(fusedCfg, [8, 0, 0, 0, 0]);
    const res = bleRangeUpdate(ble, s, obsAt(-120), beacon);
    expect(res.diagnostic.reason).toBe("rssi-out-of-bounds");
    expect(res.state).toBe(s);
  });

  it("rejects invalid (non-finite) RSSI", () => {
    const s = createFusedState(fusedCfg, [8, 0, 0, 0, 0]);
    const res = bleRangeUpdate(ble, s, obsAt(Number.NaN), beacon);
    expect(res.diagnostic.reason).toBe("invalid-rssi");
    expect(res.state).toBe(s);
  });

  it("NIS-gates a gross outlier (NLoS) without altering the state", () => {
    // Estimate at (10,0), beacon at (20,0): predicted range 10. Feed a much larger
    // range (weak but in-bounds RSSI) so the innovation trips the chi-square gate.
    const s = createFusedState(fusedCfg, [10, 0, 0, 0, 0]);
    const rssiFor28 = ble.refRssiDbm - 10 * ble.pathLossExponent * Math.log10(28);
    const res = bleRangeUpdate(ble, s, obsAt(rssiFor28), beacon);
    expect(res.diagnostic.reason).toBe("nis-gate");
    expect(res.diagnostic.nis!).toBeGreaterThan(ble.nisGateThreshold);
    // Rejected: state object is returned unchanged.
    expect(res.state).toBe(s);
  });

  it("rejects an impossible range beyond maxRangeM", () => {
    // Tight maxRangeM so an in-bounds RSSI still yields an impossible range.
    const tight = { ...ble, maxRangeM: 5 as Metres };
    const s = createFusedState({ ...fusedCfg, ble: tight }, [0, 0, 0, 0, 0]);
    const rssiFor12 = tight.refRssiDbm - 10 * tight.pathLossExponent * Math.log10(12);
    const res = bleRangeUpdate(tight, s, obsAt(rssiFor12), beacon);
    expect(res.diagnostic.reason).toBe("impossible-range");
    expect(res.state).toBe(s);
  });
});
