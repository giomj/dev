import {
  type Metres,
  type Radians,
  type Seconds,
  isFiniteNumber,
  wrapAngle,
} from "../domain/units.js";
import { zeros } from "../domain/linalg.js";
import { IDX, N_STATE, type FusedLocalizationState } from "./fusion-state.js";
import {
  type ImuConfig,
  type ImuSample,
  predictImu,
  validateImuConfig,
  zeroVelocityUpdate,
} from "./imu.js";
import {
  type Beacon,
  type BleConfig,
  type BleUpdateDiagnostic,
  bleRangeUpdate,
  validateBleConfig,
  type RssiObservation,
} from "./ble.js";

export { IDX, N_STATE, type FusedLocalizationState } from "./fusion-state.js";

/**
 * Fused BLE + IMU localization (report §1 L recursion, extended).
 *
 * Orchestrates one full L step of the fused estimator:
 *   1. EKF predict using the IMU sample (dead reckoning + covariance growth).
 *   2. Optional zero-velocity update when near-stationary.
 *   3. Sequential EKF range updates for each BLE observation, with chi-square
 *      (NIS) gating so NLoS/outliers are rejected without corrupting the state.
 *
 * Per-step diagnostics (accepted/rejected beacon counts, IMU prediction count,
 * ZUPT flag, position uncertainty, per-source innovations) are returned so the
 * scheduler, K provenance, and CLI can reason about fusion quality.
 */

export interface FusedInitConfig {
  /** Initial position std per axis (m). */
  readonly initialPosStd: Metres;
  /** Initial velocity std per axis (m/s). */
  readonly initialVelStd: number;
  /** Initial yaw std (rad). */
  readonly initialYawStd: number;
}

export interface FusedConfig {
  readonly imu: ImuConfig;
  readonly ble: BleConfig;
  readonly init: FusedInitConfig;
}

export interface FusedStepDiagnostics {
  /** Number of IMU prediction integrations applied this step. */
  readonly imuPredictions: number;
  /** Whether a zero-velocity update fired this step. */
  readonly zuptApplied: boolean;
  /** Count of BLE observations accepted into the state. */
  readonly bleAccepted: number;
  /** Count of BLE observations rejected (any reason). */
  readonly bleRejected: number;
  /** Position uncertainty after the step (m). */
  readonly positionUncertainty: Metres;
  /** Per-observation BLE diagnostics (accepted and rejected). */
  readonly ble: readonly BleUpdateDiagnostic[];
}

export function validateFusedConfig(cfg: FusedConfig): void {
  validateImuConfig(cfg.imu);
  validateBleConfig(cfg.ble);
  const i = cfg.init;
  if (i.initialPosStd <= 0 || i.initialVelStd <= 0 || i.initialYawStd <= 0)
    throw new RangeError("FusedInitConfig std values must be > 0");
}

export function createFusedState(
  cfg: FusedConfig,
  initialMean: readonly [number, number, number, number, number],
): FusedLocalizationState {
  validateFusedConfig(cfg);
  if (!initialMean.every(isFiniteNumber))
    throw new RangeError("initialMean must contain finite values");
  const { initialPosStd: p, initialVelStd: v, initialYawStd: yw } = cfg.init;
  const cov = zeros(N_STATE, N_STATE);
  cov[IDX.px]![IDX.px] = p * p;
  cov[IDX.py]![IDX.py] = p * p;
  cov[IDX.vx]![IDX.vx] = v * v;
  cov[IDX.vy]![IDX.vy] = v * v;
  cov[IDX.yaw]![IDX.yaw] = yw * yw;
  const mean = [...initialMean];
  mean[IDX.yaw] = wrapAngle(mean[IDX.yaw]!);
  return {
    mean,
    cov,
    positionUncertainty: Math.sqrt(cov[IDX.px]![IDX.px]! + cov[IDX.py]![IDX.py]!) as Metres,
    yaw: mean[IDX.yaw]! as Radians,
  };
}

export interface FusedStepInput {
  readonly imuSample: ImuSample;
  /** BLE observations gathered this step (may be empty on dropout). */
  readonly bleObservations: readonly RssiObservation[];
  /** Beacon registry keyed by id. Missing ids yield an unknown-beacon reject. */
  readonly beacons: ReadonlyMap<string, Beacon>;
  readonly dt: Seconds;
}

export interface FusedStepResult {
  readonly state: FusedLocalizationState;
  readonly diagnostics: FusedStepDiagnostics;
}

/**
 * Run one fused L step: IMU predict -> optional ZUPT -> sequential BLE updates.
 * BLE updates are gated; duplicate beacon ids within a single scan are rejected
 * after the first (a scan should report each beacon at most once).
 */
export function fusedStep(
  cfg: FusedConfig,
  state: FusedLocalizationState,
  input: FusedStepInput,
): FusedStepResult {
  let s = predictImu(cfg.imu, state, input.imuSample, input.dt);

  const zupt = zeroVelocityUpdate(cfg.imu, s, input.imuSample);
  s = zupt.state;

  const diagnostics: BleUpdateDiagnostic[] = [];
  const seen = new Set<string>();
  let accepted = 0;
  let rejected = 0;

  for (const obs of input.bleObservations) {
    if (seen.has(obs.beaconId)) {
      diagnostics.push({
        beaconId: obs.beaconId,
        accepted: false,
        rssiDbm: obs.rssiDbm,
        rangeM: null,
        predictedRangeM: null,
        innovation: null,
        innovationCovariance: null,
        nis: null,
        reason: "duplicate-beacon",
      });
      rejected++;
      continue;
    }
    seen.add(obs.beaconId);
    const beacon = input.beacons.get(obs.beaconId);
    const res = bleRangeUpdate(cfg.ble, s, obs, beacon);
    s = res.state;
    diagnostics.push(res.diagnostic);
    if (res.diagnostic.accepted) accepted++;
    else rejected++;
  }

  return {
    state: s,
    diagnostics: {
      imuPredictions: 1,
      zuptApplied: zupt.applied,
      bleAccepted: accepted,
      bleRejected: rejected,
      positionUncertainty: s.positionUncertainty,
      ble: diagnostics,
    },
  };
}
