import {
  type Dbm,
  type Hertz,
  type Joules,
  type Metres,
  type MetresPerSecond2,
  type RadiansPerSecond,
  type Seconds,
  type Watts,
  mW,
  uW,
} from "../domain/units.js";
import type { EnergyConfig, HarvestInput } from "../recursions/energy.js";
import type { Hypothesis } from "../recursions/knowledge.js";
import type { SchedulerConfig } from "../scheduler/scheduler.js";
import type { Beacon } from "../recursions/ble.js";
import type { FusedConfig } from "../recursions/fusion.js";

/**
 * A fully-specified, deterministic BLE + IMU sensor-fusion scenario.
 *
 * As with the base scenarios (report §0 honesty statement), every numeric
 * default here is *illustrative* — chosen to match order-of-magnitude values in
 * the source report (µW harvest, ~15 mW BLE active, low-power IMU) and to make a
 * clear demo. They are NOT measured performance of any built device, and BLE
 * RSSI ranging is deliberately modeled as coarse and multipath-prone.
 */

/** Clean (noise/bias-free) body-frame motion command for one step. */
export interface MotionCommand {
  /** Body-frame specific force [forward, left] (m/s^2). */
  readonly bodyAccel: readonly [MetresPerSecond2, MetresPerSecond2];
  readonly yawRate: RadiansPerSecond;
}

/** Sensor-side (ground-truth synthesis) BLE environment model. */
export interface BleEnvironment {
  /** RSSI white-noise std added during synthesis (dB). */
  readonly rssiNoiseStd: number;
  /** Beacons beyond this true range are not heard (m). */
  readonly visibilityRangeM: Metres;
  /** A BLE scan is attempted every `scanInterval` steps (energy permitting). */
  readonly scanInterval: number;
  /** True if the whole scan drops out at this step (e.g. RF congestion). */
  readonly isScanDropout: (step: number) => boolean;
  /** Extra one-way excess path loss (dB) for a beacon at this step (NLoS). 0 = LoS. */
  readonly nlosExcessDb: (step: number, beaconId: string) => number;
}

export interface FusionActionCosts {
  readonly sleepW: Watts;
  /** Always-on IMU sampling power (applied every step). */
  readonly imuActiveW: Watts;
  /** BLE active power during a scan window. */
  readonly bleScanW: Watts;
  /** BLE scan window duration within a step. */
  readonly bleScanS: Seconds;
}

export interface FusionScenario {
  readonly name: string;
  readonly description: string;
  readonly seed: number;
  readonly steps: number;
  readonly dt: Seconds;
  /** Initial true state [px, py, vx, vy, yaw]. The estimate starts here too. */
  readonly initialTrue: readonly [number, number, number, number, number];
  readonly fused: FusedConfig;
  readonly beacons: readonly Beacon[];
  readonly energy: EnergyConfig;
  readonly initialStoredJ: Joules;
  readonly scheduler: SchedulerConfig;
  readonly priors: readonly Hypothesis[];
  readonly actions: FusionActionCosts;
  readonly harvest: (step: number) => HarvestInput;
  readonly motion: (step: number) => MotionCommand;
  readonly ble: BleEnvironment;
}

const basePriors: readonly Hypothesis[] = [
  { id: "los", label: "line-of-sight RF propagation", confidence: 0.5 },
  { id: "nlos", label: "non-line-of-sight / multipath", confidence: 0.5 },
];

const SAMPLE_HZ = 10 as Hertz;
const DT = 0.1 as Seconds;
const STEPS = 600; // 60 s at 10 Hz

/**
 * Piecewise-constant walking motion (~1.2 m/s) exercising straight travel, a
 * sustained left turn, a full stop (for the zero-velocity update), and a
 * restart. During the turn, lateral specific force = v * yawRate keeps speed
 * constant while heading rotates (a coordinated turn).
 */
function walkingMotion(step: number): MotionCommand {
  const t = step * DT;
  const zero: MotionCommand = { bodyAccel: [0 as MetresPerSecond2, 0 as MetresPerSecond2], yawRate: 0 as RadiansPerSecond };
  if (t < 10) return { bodyAccel: [0.12 as MetresPerSecond2, 0 as MetresPerSecond2], yawRate: 0 as RadiansPerSecond };
  if (t < 20) return zero; // cruise 1.2 m/s
  if (t < 30)
    // coordinated left turn: lateral accel = 1.2 * 0.15
    return { bodyAccel: [0 as MetresPerSecond2, 0.18 as MetresPerSecond2], yawRate: 0.15 as RadiansPerSecond };
  if (t < 35) return zero; // cruise
  if (t < 45) return { bodyAccel: [-0.12 as MetresPerSecond2, 0 as MetresPerSecond2], yawRate: 0 as RadiansPerSecond }; // decel to 0
  if (t < 52) return zero; // stationary -> ZUPT window
  if (t < 60) return { bodyAccel: [0.1 as MetresPerSecond2, 0 as MetresPerSecond2], yawRate: 0 as RadiansPerSecond }; // restart
  return zero;
}

const REF_RSSI = -59 as Dbm; // illustrative BLE RSSI at 1 m
const PATH_LOSS_N = 2.4; // mild indoor obstruction

const beacons: readonly Beacon[] = [
  { id: "b0", position: [0 as Metres, 12 as Metres] },
  { id: "b1", position: [22 as Metres, -8 as Metres] },
  { id: "b2", position: [34 as Metres, 16 as Metres] },
  { id: "b3", position: [12 as Metres, 22 as Metres] },
  { id: "b4", position: [-6 as Metres, -6 as Metres] },
  { id: "b5", position: [30 as Metres, 30 as Metres] },
];

/**
 * The named fused scenario: a moving 2D agent with multiple BLE beacons, IMU
 * drift/noise, an energy-driven BLE dropout window, and an NLoS/outlier interval
 * on one beacon during the turn.
 */
export function bleImuFusion(): FusionScenario {
  return {
    name: "ble-imu-fusion",
    description:
      "Moving 2D agent fusing a biased/noisy planar IMU with BLE RSSI ranges from 6 beacons. " +
      "Includes IMU drift, a coordinated turn, a stationary (ZUPT) window, an energy-driven BLE " +
      "dropout, and an NLoS outlier interval. Deterministic; exposes ground truth. Illustrative.",
    seed: 7,
    steps: STEPS,
    dt: DT,
    initialTrue: [0, 0, 0, 0, 0],
    fused: {
      imu: {
        // Small constant biases so dead reckoning visibly drifts (report §6.4).
        accelBias: [0.03 as MetresPerSecond2, -0.02 as MetresPerSecond2],
        gyroBias: 0.004 as RadiansPerSecond,
        accelNoiseStd: 0.05 as MetresPerSecond2,
        gyroNoiseStd: 0.01 as RadiansPerSecond,
        sampleRateHz: SAMPLE_HZ,
        // Imperfect calibration: corrects most, not all, of the accel bias.
        calibration: {
          accelBias: [0.025 as MetresPerSecond2, -0.015 as MetresPerSecond2],
          gyroBias: 0.003 as RadiansPerSecond,
        },
        zupt: {
          enabled: true,
          accelThreshold: 0.12 as MetresPerSecond2,
          gyroThreshold: 0.03 as RadiansPerSecond,
          speedThreshold: 0.15,
          measurementStd: 0.02,
        },
      },
      ble: {
        refRssiDbm: REF_RSSI,
        pathLossExponent: PATH_LOSS_N,
        // RSSI ranging is coarse: ~2.5 dB noise maps to several metres of range
        // error at ~20 m, so a ~4-5 m range std (variance ~20) is realistic.
        rangeVarianceM2: 20.0,
        minRssiDbm: -95 as Dbm,
        maxRssiDbm: -40 as Dbm,
        maxRangeM: 60 as Metres,
        nisGateThreshold: 6.63, // chi-square 1 dof, 99%
      },
      init: {
        initialPosStd: 1.0 as Metres,
        initialVelStd: 0.2,
        initialYawStd: 0.05,
      },
    },
    beacons,
    // Small supercap buffer (report §6.3): frequent 15 mW BLE scans cannot be
    // sustained on µW ambient harvest, so the buffer drains and the scheduler is
    // forced to skip scans (and briefly brown out) as it nears the reserve.
    energy: {
      capacityJ: 0.15 as Joules,
      brownoutJ: 0.03 as Joules,
      leakageW: uW(0.5),
      quiescentW: uW(2),
      coldStartFloorW: uW(10),
    },
    initialStoredJ: 0.1 as Joules,
    scheduler: { energyNeutralHeadroomJ: 0 as Joules },
    priors: basePriors,
    actions: {
      sleepW: uW(2),
      imuActiveW: mW(0.1), // low-power planar IMU, always sampling
      bleScanW: mW(15), // BLE active during scan
      bleScanS: 0.05 as Seconds,
    },
    // Favorable harvest with a low window (steps 200-320) that forces the
    // scheduler to skip some BLE scans -> BLE dropout is not free.
    harvest: (step): HarvestInput =>
      step >= 200 && step < 320
        ? { harvestedDcW: uW(3), etaConverter: 0.9 }
        : { harvestedDcW: uW(60), etaConverter: 0.9 },
    motion: walkingMotion,
    ble: {
      rssiNoiseStd: 2.5,
      visibilityRangeM: 45 as Metres,
      scanInterval: 5, // attempt a scan every 0.5 s
      // A congestion dropout window where scans return nothing.
      isScanDropout: (step: number): boolean => step >= 150 && step < 180,
      // Beacon b1 is in NLoS during the turn (steps 200-260) while it is close:
      // ~10 dB excess path loss makes it read far too distant, so its large
      // range innovation trips the chi-square (NIS) gate and is rejected.
      nlosExcessDb: (step: number, beaconId: string): number =>
        beaconId === "b1" && step >= 200 && step < 260 ? 10 : 0,
    },
  };
}

export const FUSION_SCENARIOS: Readonly<Record<string, () => FusionScenario>> = {
  "ble-imu-fusion": bleImuFusion,
};

export function getFusionScenario(name: string): FusionScenario {
  const factory = FUSION_SCENARIOS[name];
  if (!factory)
    throw new RangeError(
      `unknown fusion scenario "${name}". Available: ${Object.keys(FUSION_SCENARIOS).join(", ")}`,
    );
  return factory();
}
