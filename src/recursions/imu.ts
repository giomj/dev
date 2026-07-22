import {
  type Hertz,
  type Metres,
  type MetresPerSecond2,
  type Radians,
  type RadiansPerSecond,
  type Seconds,
  isFiniteNumber,
  wrapAngle,
} from "../domain/units.js";
import {
  type Matrix,
  add,
  identity,
  matMul,
  symmetrize,
  transpose,
  zeros,
} from "../domain/linalg.js";
import type { Rng } from "../rng.js";
import { IDX, N_STATE, type FusedLocalizationState } from "./fusion-state.js";

/**
 * IMU model + strapdown-style dead-reckoning prediction (report §1 estimator
 * forms; §6.4 explicitly warns that inertial-only navigation drifts).
 *
 * A planar (2D) IMU gives body-frame accelerometer x/y (specific force, m/s^2)
 * and a yaw-rate gyro (rad/s). We integrate yaw, then rotate body acceleration
 * into the world frame and integrate velocity and position deterministically at
 * the prediction rate. Bias and white noise are configurable; uncertainty is
 * propagated as part of the prediction (this is the EKF *predict* step for the
 * fused state, using the IMU as a control input rather than a measurement).
 *
 * This is dead reckoning: with any residual bias, position error grows without
 * bound. That is the whole point of fusing BLE ranges on top (see `ble.ts`).
 */

export interface ImuCalibration {
  /** Known accelerometer bias correction the filter subtracts (m/s^2, body). */
  readonly accelBias: readonly [MetresPerSecond2, MetresPerSecond2];
  /** Known gyro bias correction the filter subtracts (rad/s). */
  readonly gyroBias: RadiansPerSecond;
}

export interface ZuptConfig {
  /** Enable the zero-velocity update (pseudo-measurement v = 0). */
  readonly enabled: boolean;
  /** |specific force| below this is considered stationary (m/s^2). */
  readonly accelThreshold: MetresPerSecond2;
  /** |yaw rate| below this is considered stationary (rad/s). */
  readonly gyroThreshold: RadiansPerSecond;
  /**
   * Estimated speed below which the node is deemed stationary (m/s).
   *
   * A planar accelerometer + yaw gyro alone CANNOT distinguish constant-velocity
   * cruise (zero specific force, zero yaw rate) from true rest. Firing ZUPT on
   * low specific force alone would wrongly zero cruising velocity. We therefore
   * additionally require the current velocity estimate to be near zero — a
   * standard estimate-aided stance detector. This is a pragmatic mitigation, not
   * a claim of drift-free inertial navigation.
   */
  readonly speedThreshold: number;
  /** Pseudo-measurement noise std on each velocity axis (m/s). */
  readonly measurementStd: number;
}

export interface ImuConfig {
  /** Sensor accelerometer bias (m/s^2, body frame) used to corrupt truth. */
  readonly accelBias: readonly [MetresPerSecond2, MetresPerSecond2];
  /** Sensor gyro bias (rad/s). */
  readonly gyroBias: RadiansPerSecond;
  /** Accelerometer white-noise std (m/s^2). Drives synthesis and process Q. */
  readonly accelNoiseStd: MetresPerSecond2;
  /** Gyro white-noise std (rad/s). Drives synthesis and process Q. */
  readonly gyroNoiseStd: RadiansPerSecond;
  /** IMU sample rate (Hz). */
  readonly sampleRateHz: Hertz;
  /** Optional filter-side calibration correction. */
  readonly calibration?: ImuCalibration;
  /** Zero-velocity update configuration. */
  readonly zupt: ZuptConfig;
}

/** A timestamped planar IMU observation, in explicit SI units. */
export interface ImuSample {
  readonly timeS: Seconds;
  /** Body-frame specific force, forward axis (m/s^2). */
  readonly ax: MetresPerSecond2;
  /** Body-frame specific force, left axis (m/s^2). */
  readonly ay: MetresPerSecond2;
  /** Yaw rate about the vertical axis (rad/s). */
  readonly yawRate: RadiansPerSecond;
}

export function validateImuConfig(cfg: ImuConfig): void {
  const finite: Array<[string, number]> = [
    ["accelBias[0]", cfg.accelBias[0]],
    ["accelBias[1]", cfg.accelBias[1]],
    ["gyroBias", cfg.gyroBias],
    ["accelNoiseStd", cfg.accelNoiseStd],
    ["gyroNoiseStd", cfg.gyroNoiseStd],
    ["sampleRateHz", cfg.sampleRateHz],
  ];
  for (const [name, v] of finite) {
    if (!isFiniteNumber(v)) throw new RangeError(`ImuConfig.${name} must be finite`);
  }
  if (cfg.accelNoiseStd < 0 || cfg.gyroNoiseStd < 0)
    throw new RangeError("ImuConfig noise std must be >= 0");
  if (cfg.sampleRateHz <= 0) throw new RangeError("ImuConfig.sampleRateHz must be > 0");
  const z = cfg.zupt;
  if (z.accelThreshold < 0 || z.gyroThreshold < 0 || z.speedThreshold < 0 || z.measurementStd <= 0)
    throw new RangeError("ImuConfig.zupt thresholds must be >= 0 and measurementStd > 0");
}

/**
 * Synthesize a noisy, biased IMU sample from clean body-frame truth.
 * Deterministic given the Rng stream. Used by the scenario/simulator to feed
 * the filter; the filter itself never sees the clean truth.
 */
export function synthesizeImuSample(
  cfg: ImuConfig,
  timeS: Seconds,
  trueBodyAccel: readonly [MetresPerSecond2, MetresPerSecond2],
  trueYawRate: RadiansPerSecond,
  rng: Rng,
): ImuSample {
  return {
    timeS,
    ax: (trueBodyAccel[0] + cfg.accelBias[0] + rng.gaussian(0, cfg.accelNoiseStd)) as MetresPerSecond2,
    ay: (trueBodyAccel[1] + cfg.accelBias[1] + rng.gaussian(0, cfg.accelNoiseStd)) as MetresPerSecond2,
    yawRate: (trueYawRate + cfg.gyroBias + rng.gaussian(0, cfg.gyroNoiseStd)) as RadiansPerSecond,
  };
}

/** Apply the filter-side calibration correction (subtract known bias). */
function correctSample(
  cfg: ImuConfig,
  s: ImuSample,
): { ax: number; ay: number; yawRate: number } {
  const cal = cfg.calibration;
  if (!cal) return { ax: s.ax, ay: s.ay, yawRate: s.yawRate };
  return {
    ax: s.ax - cal.accelBias[0],
    ay: s.ay - cal.accelBias[1],
    yawRate: s.yawRate - cal.gyroBias,
  };
}

/**
 * EKF prediction using an IMU sample as control input over `dt`.
 *
 * Integration (body forward=x, left=y; world x/y):
 *   yaw'  = yaw + w*dt
 *   a_w   = R(yaw) * a_body
 *   v'    = v + a_w*dt
 *   p'    = p + v*dt + 0.5*a_w*dt^2
 *
 * Covariance: P' = F P F^T + G Qu G^T, with F = df/dx and G = df/du, and
 * Qu = diag(sa^2, sa^2, sw^2) the accel/gyro white-noise variances. Because a_w
 * depends on yaw, this is a genuine nonlinear (extended) prediction.
 */
export function predictImu(
  cfg: ImuConfig,
  state: FusedLocalizationState,
  sample: ImuSample,
  dt: Seconds,
): FusedLocalizationState {
  if (!isFiniteNumber(dt) || dt <= 0) throw new RangeError("dt must be finite and > 0");
  const { ax, ay, yawRate } = correctSample(cfg, sample);
  if (![ax, ay, yawRate].every(isFiniteNumber))
    throw new RangeError("IMU sample must contain finite values");

  const m = state.mean;
  const yaw = m[IDX.yaw]!;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  // World-frame acceleration a_w = R(yaw) * [ax, ay].
  const awx = c * ax - s * ay;
  const awy = s * ax + c * ay;

  const mean = m.slice();
  mean[IDX.px] = m[IDX.px]! + m[IDX.vx]! * dt + 0.5 * awx * dt * dt;
  mean[IDX.py] = m[IDX.py]! + m[IDX.vy]! * dt + 0.5 * awy * dt * dt;
  mean[IDX.vx] = m[IDX.vx]! + awx * dt;
  mean[IDX.vy] = m[IDX.vy]! + awy * dt;
  mean[IDX.yaw] = wrapAngle(m[IDX.yaw]! + yawRate * dt);

  // State Jacobian F = df/dx. d(a_w)/d(yaw): d(awx)=-awy, d(awy)=awx.
  const F = identity(N_STATE);
  F[IDX.px]![IDX.vx] = dt;
  F[IDX.py]![IDX.vy] = dt;
  F[IDX.px]![IDX.yaw] = 0.5 * dt * dt * -awy;
  F[IDX.py]![IDX.yaw] = 0.5 * dt * dt * awx;
  F[IDX.vx]![IDX.yaw] = dt * -awy;
  F[IDX.vy]![IDX.yaw] = dt * awx;

  // Control Jacobian G = df/du, u = [ax, ay, w].
  const G = zeros(N_STATE, 3);
  const half = 0.5 * dt * dt;
  G[IDX.px]![0] = half * c;
  G[IDX.px]![1] = half * -s;
  G[IDX.py]![0] = half * s;
  G[IDX.py]![1] = half * c;
  G[IDX.vx]![0] = dt * c;
  G[IDX.vx]![1] = dt * -s;
  G[IDX.vy]![0] = dt * s;
  G[IDX.vy]![1] = dt * c;
  G[IDX.yaw]![2] = dt;

  const sa2 = cfg.accelNoiseStd * cfg.accelNoiseStd;
  const sw2 = cfg.gyroNoiseStd * cfg.gyroNoiseStd;
  const Qu: Matrix = [
    [sa2, 0, 0],
    [0, sa2, 0],
    [0, 0, sw2],
  ];
  const Q = matMul(matMul(G, Qu), transpose(G));

  const FP = matMul(F, state.cov);
  const cov = symmetrize(add(matMul(FP, transpose(F)), Q));

  return {
    mean,
    cov,
    positionUncertainty: Math.sqrt(cov[IDX.px]![IDX.px]! + cov[IDX.py]![IDX.py]!) as Metres,
    yaw: mean[IDX.yaw]! as Radians,
  };
}

export interface ZuptResult {
  readonly state: FusedLocalizationState;
  readonly applied: boolean;
}

/**
 * Zero-velocity update (ZUPT). When the IMU indicates near-stationarity, apply a
 * pseudo-measurement v = [0, 0] to bound velocity (and hence position) drift.
 * This is an honest partial mitigation, NOT drift-free inertial navigation.
 */
export function zeroVelocityUpdate(
  cfg: ImuConfig,
  state: FusedLocalizationState,
  sample: ImuSample,
): ZuptResult {
  const z = cfg.zupt;
  if (!z.enabled) return { state, applied: false };
  const { ax, ay, yawRate } = correctSample(cfg, sample);
  const accelMag = Math.hypot(ax, ay);
  const estSpeed = Math.hypot(state.mean[IDX.vx]!, state.mean[IDX.vy]!);
  if (
    accelMag > z.accelThreshold ||
    Math.abs(yawRate) > z.gyroThreshold ||
    estSpeed > z.speedThreshold
  )
    return { state, applied: false };

  // Measure vx, vy directly (H selects velocity block). Scalar-per-axis update
  // via a 2x2 innovation solve.
  const P = state.cov;
  const r = z.measurementStd * z.measurementStd;
  const m = state.mean;

  const s00 = P[IDX.vx]![IDX.vx]! + r;
  const s01 = P[IDX.vx]![IDX.vy]!;
  const s10 = P[IDX.vy]![IDX.vx]!;
  const s11 = P[IDX.vy]![IDX.vy]! + r;
  const det = s00 * s11 - s01 * s10;
  if (Math.abs(det) < 1e-15) return { state, applied: false };
  const iS00 = s11 / det;
  const iS01 = -s01 / det;
  const iS10 = -s10 / det;
  const iS11 = s00 / det;

  // Innovation = z - Hx = [0 - vx, 0 - vy].
  const yx = -m[IDX.vx]!;
  const yy = -m[IDX.vy]!;

  // K = P H^T S^-1, where P H^T is columns (vx, vy) of P (N x 2).
  const K: number[][] = [];
  for (let i = 0; i < N_STATE; i++) {
    const a = P[i]![IDX.vx]!;
    const b = P[i]![IDX.vy]!;
    K.push([a * iS00 + b * iS10, a * iS01 + b * iS11]);
  }

  const mean = m.slice();
  for (let i = 0; i < N_STATE; i++) mean[i] = m[i]! + K[i]![0]! * yx + K[i]![1]! * yy;
  mean[IDX.yaw] = wrapAngle(mean[IDX.yaw]!);

  // P' = (I - K H) P. K H is N x N, non-zero only in the vx, vy columns.
  const KH = zeros(N_STATE, N_STATE);
  for (let i = 0; i < N_STATE; i++) {
    KH[i]![IDX.vx] = K[i]![0]!;
    KH[i]![IDX.vy] = K[i]![1]!;
  }
  const ImKH = add(identity(N_STATE), KH.map((row) => row.map((x) => -x)));
  const cov = symmetrize(matMul(ImKH, P));

  return {
    state: {
      mean,
      cov,
      positionUncertainty: Math.sqrt(cov[IDX.px]![IDX.px]! + cov[IDX.py]![IDX.py]!) as Metres,
      yaw: mean[IDX.yaw]! as Radians,
    },
    applied: true,
  };
}
