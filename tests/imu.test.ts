import { describe, expect, it } from "vitest";
import {
  predictImu,
  synthesizeImuSample,
  validateImuConfig,
  zeroVelocityUpdate,
  type ImuConfig,
  type ImuSample,
} from "../src/recursions/imu.js";
import { createFusedState, type FusedConfig } from "../src/recursions/fusion.js";
import { IDX } from "../src/recursions/fusion-state.js";
import { Rng } from "../src/rng.js";
import type {
  Hertz,
  MetresPerSecond2,
  RadiansPerSecond,
  Seconds,
} from "../src/domain/units.js";

const imu: ImuConfig = {
  accelBias: [0.03 as MetresPerSecond2, -0.02 as MetresPerSecond2],
  gyroBias: 0.004 as RadiansPerSecond,
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
};

const fusedCfg: FusedConfig = {
  imu,
  ble: {
    refRssiDbm: -59 as never,
    pathLossExponent: 2.4,
    rangeVarianceM2: 20,
    minRssiDbm: -95 as never,
    maxRssiDbm: -40 as never,
    maxRangeM: 60 as never,
    nisGateThreshold: 6.63,
  },
  init: { initialPosStd: 1 as never, initialVelStd: 0.2, initialYawStd: 0.05 },
};

const DT = 0.1 as Seconds;

describe("IMU config validation", () => {
  it("rejects non-positive sample rate", () => {
    expect(() => validateImuConfig({ ...imu, sampleRateHz: 0 as Hertz })).toThrow();
  });
  it("rejects non-positive ZUPT measurementStd", () => {
    expect(() =>
      validateImuConfig({ ...imu, zupt: { ...imu.zupt, measurementStd: 0 } }),
    ).toThrow();
  });
});

describe("IMU sample synthesis", () => {
  it("adds bias and is deterministic for a given seed", () => {
    const a = synthesizeImuSample(
      imu,
      0 as Seconds,
      [0 as MetresPerSecond2, 0 as MetresPerSecond2],
      0 as RadiansPerSecond,
      new Rng(42),
    );
    const b = synthesizeImuSample(
      imu,
      0 as Seconds,
      [0 as MetresPerSecond2, 0 as MetresPerSecond2],
      0 as RadiansPerSecond,
      new Rng(42),
    );
    expect(a.ax).toBe(b.ax);
    expect(a.ay).toBe(b.ay);
    expect(a.yawRate).toBe(b.yawRate);
  });

  it("recovers bias in the noise-free mean over many samples", () => {
    const rng = new Rng(7);
    let sax = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) {
      sax += synthesizeImuSample(
        imu,
        0 as Seconds,
        [0 as MetresPerSecond2, 0 as MetresPerSecond2],
        0 as RadiansPerSecond,
        rng,
      ).ax;
    }
    // Mean should approach the accel bias (0.03).
    expect(sax / N).toBeCloseTo(0.03, 2);
  });
});

describe("IMU prediction (dead reckoning)", () => {
  it("integrates forward motion into world x and grows position uncertainty", () => {
    const s0 = createFusedState(fusedCfg, [0, 0, 0, 0, 0]);
    const sample: ImuSample = {
      timeS: 0 as Seconds,
      ax: 1 as MetresPerSecond2,
      ay: 0 as MetresPerSecond2,
      yawRate: 0 as RadiansPerSecond,
    };
    const s1 = predictImu(imu, s0, sample, DT);
    // p = 0.5 a dt^2 = 0.5 * 1 * 0.01 = 0.005; v = a dt = 0.1.
    expect(s1.mean[IDX.px]!).toBeCloseTo(0.005, 6);
    expect(s1.mean[IDX.vx]!).toBeCloseTo(0.1, 6);
    expect(s1.positionUncertainty).toBeGreaterThan(s0.positionUncertainty);
  });

  it("rotates body acceleration by yaw into the world frame", () => {
    const s0 = createFusedState(fusedCfg, [0, 0, 0, 0, Math.PI / 2]);
    const sample: ImuSample = {
      timeS: 0 as Seconds,
      ax: 1 as MetresPerSecond2,
      ay: 0 as MetresPerSecond2,
      yawRate: 0 as RadiansPerSecond,
    };
    const s1 = predictImu(imu, s0, sample, DT);
    // Facing +y: forward accel maps to world +y, not +x.
    expect(s1.mean[IDX.px]!).toBeCloseTo(0, 6);
    expect(s1.mean[IDX.vy]!).toBeCloseTo(0.1, 6);
  });

  it("position uncertainty grows monotonically with repeated prediction (drift)", () => {
    let s = createFusedState(fusedCfg, [0, 0, 0, 0, 0]);
    const sample: ImuSample = {
      timeS: 0 as Seconds,
      ax: 0 as MetresPerSecond2,
      ay: 0 as MetresPerSecond2,
      yawRate: 0 as RadiansPerSecond,
    };
    let prev = s.positionUncertainty;
    for (let i = 0; i < 20; i++) {
      s = predictImu(imu, s, sample, DT);
      expect(s.positionUncertainty).toBeGreaterThanOrEqual(prev);
      prev = s.positionUncertainty;
    }
  });

  it("rejects non-positive dt", () => {
    const s0 = createFusedState(fusedCfg, [0, 0, 0, 0, 0]);
    const sample: ImuSample = {
      timeS: 0 as Seconds,
      ax: 0 as MetresPerSecond2,
      ay: 0 as MetresPerSecond2,
      yawRate: 0 as RadiansPerSecond,
    };
    expect(() => predictImu(imu, s0, sample, 0 as Seconds)).toThrow();
  });
});

describe("zero-velocity update (ZUPT)", () => {
  it("fires when stationary and drives velocity toward zero", () => {
    // Start with a small spurious velocity but a near-zero specific force.
    let s = createFusedState(fusedCfg, [0, 0, 0.05, 0.05, 0]);
    const sample: ImuSample = {
      timeS: 0 as Seconds,
      ax: 0 as MetresPerSecond2,
      ay: 0 as MetresPerSecond2,
      yawRate: 0 as RadiansPerSecond,
    };
    const res = zeroVelocityUpdate(imu, s, sample);
    expect(res.applied).toBe(true);
    expect(Math.hypot(res.state.mean[IDX.vx]!, res.state.mean[IDX.vy]!)).toBeLessThan(
      Math.hypot(s.mean[IDX.vx]!, s.mean[IDX.vy]!),
    );
  });

  it("does NOT fire during constant-velocity cruise (speed gate)", () => {
    // Zero specific force but a real cruise velocity above speedThreshold.
    const s = createFusedState(fusedCfg, [0, 0, 1.2, 0, 0]);
    const sample: ImuSample = {
      timeS: 0 as Seconds,
      ax: 0 as MetresPerSecond2,
      ay: 0 as MetresPerSecond2,
      yawRate: 0 as RadiansPerSecond,
    };
    const res = zeroVelocityUpdate(imu, s, sample);
    expect(res.applied).toBe(false);
    expect(res.state.mean[IDX.vx]!).toBe(s.mean[IDX.vx]!);
  });

  it("does not fire when disabled", () => {
    const s = createFusedState(
      { ...fusedCfg, imu: { ...imu, zupt: { ...imu.zupt, enabled: false } } },
      [0, 0, 0.05, 0, 0],
    );
    const sample: ImuSample = {
      timeS: 0 as Seconds,
      ax: 0 as MetresPerSecond2,
      ay: 0 as MetresPerSecond2,
      yawRate: 0 as RadiansPerSecond,
    };
    const res = zeroVelocityUpdate({ ...imu, zupt: { ...imu.zupt, enabled: false } }, s, sample);
    expect(res.applied).toBe(false);
  });
});
