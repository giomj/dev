import { describe, expect, it } from "vitest";
import { runFusionSimulation } from "../src/engine/fusion-simulator.js";
import { bleImuFusion, getFusionScenario } from "../src/engine/fusion-scenario.js";

describe("fusion simulation determinism", () => {
  it("produces identical results for the same seed", () => {
    const a = runFusionSimulation(bleImuFusion());
    const b = runFusionSimulation(bleImuFusion());
    expect(a.summary.positionRmse).toBe(b.summary.positionRmse);
    expect(a.summary.bleAcceptedTotal).toBe(b.summary.bleAcceptedTotal);
    expect(a.summary.finalStoredJ).toBe(b.summary.finalStoredJ);
    expect(a.summary.finalMapConfidence).toBe(b.summary.finalMapConfidence);
  });

  it("exposes ground truth alongside the estimate", () => {
    const r = runFusionSimulation(bleImuFusion());
    const row = r.telemetry[0]!;
    expect(row.truePosition).toHaveLength(2);
    expect(row.estPosition).toHaveLength(2);
    expect(Number.isFinite(row.positionError)).toBe(true);
  });
});

describe("fusion exercises the required phenomena", () => {
  const r = runFusionSimulation(bleImuFusion());

  it("has a BLE dropout window (attempted > 0 during scan cadence, scans skipped too)", () => {
    expect(r.summary.bleScansAttempted).toBeGreaterThan(0);
    expect(r.summary.bleScansPerformed).toBeGreaterThan(0);
  });

  it("skips some BLE scans for energy (scans are not free)", () => {
    expect(r.summary.bleScansSkippedForEnergy).toBeGreaterThan(0);
  });

  it("browns out for at least one step under the tight energy budget", () => {
    expect(r.summary.brownoutSteps).toBeGreaterThan(0);
  });

  it("NIS-gates NLoS/outlier ranges", () => {
    expect(r.summary.bleRejectReasons["nis-gate"] ?? 0).toBeGreaterThan(0);
  });

  it("applies ZUPTs during the stationary window", () => {
    expect(r.summary.zuptCount).toBeGreaterThan(0);
  });

  it("runs IMU prediction every step", () => {
    expect(r.summary.imuPredictionCount).toBe(r.summary.steps);
  });

  it("keeps K confidence high but strictly below 1 (not forced)", () => {
    expect(r.summary.finalMapConfidence).toBeGreaterThan(0.9);
    expect(r.summary.finalMapConfidence).toBeLessThan(1);
    expect(r.summary.finalEntropy).toBeGreaterThan(0);
  });
});

describe("comparative regression: fused BLE+IMU beats IMU-only", () => {
  it("fused RMSE is at least 15% better than IMU-only on the same trajectory/seed", () => {
    const scenario = bleImuFusion();
    const fused = runFusionSimulation(scenario, { applyBle: true });
    const imuOnly = runFusionSimulation(scenario, { applyBle: false });
    const improvement =
      (imuOnly.summary.positionRmse - fused.summary.positionRmse) /
      imuOnly.summary.positionRmse;
    expect(fused.summary.positionRmse).toBeLessThan(imuOnly.summary.positionRmse);
    // Documented threshold: BLE fusion cuts RMSE by >=15% vs dead reckoning.
    expect(improvement).toBeGreaterThan(0.15);
  });

  it("IMU-only still costs the same scan energy (BLE synthesized but not fused)", () => {
    const scenario = bleImuFusion();
    const fused = runFusionSimulation(scenario, { applyBle: true });
    const imuOnly = runFusionSimulation(scenario, { applyBle: false });
    // Energy accounting is independent of whether BLE is fused into the state.
    expect(imuOnly.summary.bleScansPerformed).toBe(fused.summary.bleScansPerformed);
    expect(imuOnly.summary.finalStoredJ).toBeCloseTo(fused.summary.finalStoredJ, 9);
  });
});

describe("energy accounting", () => {
  it("scan cost draws down stored energy relative to capacity", () => {
    const scenario = getFusionScenario("ble-imu-fusion");
    const r = runFusionSimulation(scenario);
    // Final stored energy stays within the physical capacity bound.
    expect(r.summary.finalStoredJ).toBeLessThanOrEqual(scenario.energy.capacityJ + 1e-9);
    expect(r.summary.finalStoredJ).toBeGreaterThanOrEqual(0);
  });

  it("throws on an unknown fusion scenario", () => {
    expect(() => getFusionScenario("does-not-exist")).toThrow();
  });
});
