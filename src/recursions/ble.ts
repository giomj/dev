import {
  type Dbm,
  type Metres,
  type Seconds,
  isFiniteNumber,
} from "../domain/units.js";
import { symmetrize } from "../domain/linalg.js";
import { IDX, N_STATE, type FusedLocalizationState } from "./fusion-state.js";

/**
 * BLE ranging model + EKF range update (report §1, §6.3; §0 honesty: RSSI
 * ranging is coarse and multipath/NLoS-prone — this is illustrative, not a
 * calibrated device claim).
 *
 * Beacons have fixed known positions. Each timestamped RSSI observation is
 * converted to a range via a log-distance path-loss model, then fused as a
 * nonlinear scalar range measurement in the extended Kalman filter. Range
 * measurements from multiple beacons are applied sequentially, which is
 * algebraically equivalent to a batched update for independent measurements and
 * keeps every update a cheap scalar solve (no matrix inverse).
 */

export interface BeaconCalibration {
  /** Per-beacon reference RSSI at 1 m (dBm), overrides the model default. */
  readonly refRssiDbm?: Dbm;
  /** Per-beacon path-loss exponent, overrides the model default. */
  readonly pathLossExponent?: number;
}

export interface Beacon {
  readonly id: string;
  /** Fixed beacon position (m). */
  readonly position: readonly [Metres, Metres];
  readonly calibration?: BeaconCalibration;
}

export interface BleConfig {
  /** Reference RSSI at the 1 m reference distance (dBm), model default. */
  readonly refRssiDbm: Dbm;
  /** Path-loss exponent n (2 = free space, 3-4 = indoor/obstructed). */
  readonly pathLossExponent: number;
  /** Range measurement variance (m^2) used as R in the EKF update. */
  readonly rangeVarianceM2: number;
  /** Reject RSSI weaker than this (dBm); below the noise floor / out of range. */
  readonly minRssiDbm: Dbm;
  /** Reject RSSI stronger than this (dBm); implausibly close / saturated. */
  readonly maxRssiDbm: Dbm;
  /** Maximum plausible range (m); ranges beyond this are treated as impossible. */
  readonly maxRangeM: Metres;
  /** Chi-square NIS gate threshold (1 dof). Innovations above this are rejected. */
  readonly nisGateThreshold: number;
}

/** A timestamped RSSI observation from a named beacon. */
export interface RssiObservation {
  readonly timeS: Seconds;
  readonly beaconId: string;
  readonly rssiDbm: Dbm;
}

export type BleRejectReason =
  | "unknown-beacon"
  | "duplicate-beacon"
  | "invalid-rssi"
  | "rssi-out-of-bounds"
  | "impossible-range"
  | "degenerate-geometry"
  | "nis-gate";

/** Per-observation diagnostic, emitted whether the update was accepted or not. */
export interface BleUpdateDiagnostic {
  readonly beaconId: string;
  readonly accepted: boolean;
  readonly rssiDbm: Dbm;
  /** Converted range (m), if the RSSI was convertible; else null. */
  readonly rangeM: number | null;
  /** Predicted range from the prior estimate (m), if computed; else null. */
  readonly predictedRangeM: number | null;
  /** Innovation = measured - predicted range (m), if computed; else null. */
  readonly innovation: number | null;
  /** Innovation covariance S (m^2), if computed; else null. */
  readonly innovationCovariance: number | null;
  /** Normalized innovation squared (chi-square, 1 dof), if computed; else null. */
  readonly nis: number | null;
  /** Reason the observation was rejected, if it was. */
  readonly reason?: BleRejectReason;
}

export function validateBleConfig(cfg: BleConfig): void {
  const finite: Array<[string, number]> = [
    ["refRssiDbm", cfg.refRssiDbm],
    ["pathLossExponent", cfg.pathLossExponent],
    ["rangeVarianceM2", cfg.rangeVarianceM2],
    ["minRssiDbm", cfg.minRssiDbm],
    ["maxRssiDbm", cfg.maxRssiDbm],
    ["maxRangeM", cfg.maxRangeM],
    ["nisGateThreshold", cfg.nisGateThreshold],
  ];
  for (const [name, v] of finite) {
    if (!isFiniteNumber(v)) throw new RangeError(`BleConfig.${name} must be finite`);
  }
  if (cfg.pathLossExponent <= 0) throw new RangeError("BleConfig.pathLossExponent must be > 0");
  if (cfg.rangeVarianceM2 <= 0) throw new RangeError("BleConfig.rangeVarianceM2 must be > 0");
  if (cfg.maxRangeM <= 0) throw new RangeError("BleConfig.maxRangeM must be > 0");
  if (cfg.nisGateThreshold <= 0) throw new RangeError("BleConfig.nisGateThreshold must be > 0");
  if (cfg.minRssiDbm >= cfg.maxRssiDbm)
    throw new RangeError("BleConfig.minRssiDbm must be < maxRssiDbm");
}

/**
 * Log-distance path-loss model:  RSSI(d) = refRssi - 10 * n * log10(d / d0),
 * with reference distance d0 = 1 m. Inverting for range:
 *   d = d0 * 10^((refRssi - rssi) / (10 * n))
 * Per-beacon calibration overrides the model reference RSSI / exponent.
 * Returns null for non-finite input.
 */
export function rssiToRange(cfg: BleConfig, rssiDbm: number, beacon?: Beacon): number | null {
  if (!isFiniteNumber(rssiDbm)) return null;
  const refRssi = beacon?.calibration?.refRssiDbm ?? cfg.refRssiDbm;
  const n = beacon?.calibration?.pathLossExponent ?? cfg.pathLossExponent;
  if (n <= 0) return null;
  const exponent = (refRssi - rssiDbm) / (10 * n);
  const d = Math.pow(10, exponent);
  return isFiniteNumber(d) ? d : null;
}

export interface BleUpdateResult {
  readonly state: FusedLocalizationState;
  readonly diagnostic: BleUpdateDiagnostic;
}

/**
 * Apply one BLE RSSI observation as a nonlinear scalar range EKF update.
 *
 *   h(x) = sqrt((px - bx)^2 + (py - by)^2)
 *   H    = [ (px-bx)/d, (py-by)/d, 0, 0, 0 ]
 *   S    = H P H^T + R          (scalar)
 *   NIS  = nu^2 / S             (chi-square, 1 dof)
 *   K    = P H^T / S            (column vector)
 *   x'   = x + K nu ;  P' = (I - K H) P
 *
 * Rejected observations (unknown beacon, invalid/out-of-bounds RSSI, impossible
 * range, degenerate geometry, or NIS gate failure) leave the state UNCHANGED and
 * record a reason in the diagnostic.
 */
export function bleRangeUpdate(
  cfg: BleConfig,
  state: FusedLocalizationState,
  obs: RssiObservation,
  beacon: Beacon | undefined,
): BleUpdateResult {
  const base: BleUpdateDiagnostic = {
    beaconId: obs.beaconId,
    accepted: false,
    rssiDbm: obs.rssiDbm,
    rangeM: null,
    predictedRangeM: null,
    innovation: null,
    innovationCovariance: null,
    nis: null,
  };
  const reject = (reason: BleRejectReason, extra?: Partial<BleUpdateDiagnostic>): BleUpdateResult => ({
    state,
    diagnostic: { ...base, ...extra, accepted: false, reason },
  });

  if (!beacon) return reject("unknown-beacon");
  if (!isFiniteNumber(obs.rssiDbm)) return reject("invalid-rssi");
  if (obs.rssiDbm < cfg.minRssiDbm || obs.rssiDbm > cfg.maxRssiDbm)
    return reject("rssi-out-of-bounds");

  const rangeM = rssiToRange(cfg, obs.rssiDbm, beacon);
  if (rangeM === null || rangeM <= 0 || rangeM > cfg.maxRangeM)
    return reject("impossible-range", { rangeM });

  const m = state.mean;
  const dx = m[IDX.px]! - beacon.position[0];
  const dy = m[IDX.py]! - beacon.position[1];
  const predicted = Math.hypot(dx, dy);
  if (predicted < 1e-6) return reject("degenerate-geometry", { rangeM });

  // H = [dx/d, dy/d, 0, 0, 0].
  const h0 = dx / predicted;
  const h1 = dy / predicted;
  const P = state.cov;

  // S = H P H^T + R (scalar). Only px, py columns/rows of P contribute.
  const S =
    h0 * (h0 * P[IDX.px]![IDX.px]! + h1 * P[IDX.px]![IDX.py]!) +
    h1 * (h0 * P[IDX.py]![IDX.px]! + h1 * P[IDX.py]![IDX.py]!) +
    cfg.rangeVarianceM2;
  if (!isFiniteNumber(S) || S <= 0) return reject("degenerate-geometry", { rangeM });

  const innovation = rangeM - predicted;
  const nis = (innovation * innovation) / S;

  const diagWithStats: Partial<BleUpdateDiagnostic> = {
    rangeM,
    predictedRangeM: predicted,
    innovation,
    innovationCovariance: S,
    nis,
  };

  // Chi-square NIS gate: reject NLoS/outliers without touching the state.
  if (nis > cfg.nisGateThreshold) return reject("nis-gate", diagWithStats);

  // K = P H^T / S. P H^T is the (px, py)-weighted combination of P's columns.
  const K = new Array<number>(N_STATE);
  for (let i = 0; i < N_STATE; i++) {
    K[i] = (P[i]![IDX.px]! * h0 + P[i]![IDX.py]! * h1) / S;
  }

  const mean = m.slice();
  for (let i = 0; i < N_STATE; i++) mean[i] = m[i]! + K[i]! * innovation;

  // P' = (I - K H) P. K H is rank-1, non-zero only in the px, py columns.
  const cov = P.map((row) => row.slice());
  for (let i = 0; i < N_STATE; i++) {
    const kh0 = K[i]! * h0;
    const kh1 = K[i]! * h1;
    for (let j = 0; j < N_STATE; j++) {
      cov[i]![j] = P[i]![j]! - (kh0 * P[IDX.px]![j]! + kh1 * P[IDX.py]![j]!);
    }
  }
  const symCov = symmetrize(cov);

  return {
    state: {
      mean,
      cov: symCov,
      positionUncertainty: Math.sqrt(symCov[IDX.px]![IDX.px]! + symCov[IDX.py]![IDX.py]!) as Metres,
      yaw: state.yaw,
    },
    diagnostic: { ...base, ...diagWithStats, accepted: true },
  };
}
