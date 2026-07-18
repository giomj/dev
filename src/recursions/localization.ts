import { type Metres, type Seconds, isFiniteNumber } from "../domain/units.js";

/**
 * L state — localization / navigation (report §1).
 *
 * A minimal, self-contained 2D constant-velocity Kalman filter. State vector is
 * [x, y, vx, vy]; we observe position [x, y] (e.g. from BLE/WiFi/UWB fixes).
 * This is a reference implementation of the RSD "predict/update recursion" and
 * exposes innovation (residual) and uncertainty (trace of covariance) so the
 * scheduler and K can reason about reliability.
 *
 * Matrices are kept as plain nested arrays; the dimensions are fixed and small,
 * so we avoid a linear-algebra dependency and keep the maths auditable.
 */

export type Vec4 = readonly [number, number, number, number];
export type Mat4 = readonly [Vec4, Vec4, Vec4, Vec4];

export interface LocalizationConfig {
  /** Process noise spectral density (m^2/s^3) driving the velocity states. */
  readonly processNoise: number;
  /** Measurement noise std-dev per axis (m). */
  readonly measurementStd: Metres;
  /** Initial position uncertainty std-dev per axis (m). */
  readonly initialPosStd: Metres;
  /** Initial velocity uncertainty std-dev per axis (m/s). */
  readonly initialVelStd: number;
}

export interface LocalizationState {
  /** Mean state estimate [x, y, vx, vy]. */
  readonly mean: Vec4;
  /** Covariance matrix (4x4). */
  readonly cov: Mat4;
  /** Last measurement innovation [x, y] (measured - predicted), null before any update. */
  readonly innovation: readonly [number, number] | null;
  /** Normalized innovation squared (NIS) of the last update, null before any update. */
  readonly nis: number | null;
  /** Position uncertainty = sqrt(trace of the position block) (m). */
  readonly positionUncertainty: Metres;
}

const zeros4: Mat4 = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

function diag4(a: number, b: number, c: number, d: number): Mat4 {
  return [
    [a, 0, 0, 0],
    [0, b, 0, 0],
    [0, 0, c, 0],
    [0, 0, 0, d],
  ];
}

function matAdd(a: Mat4, b: Mat4): Mat4 {
  const out = zeros4.map((row, i) => row.map((_, j) => a[i]![j]! + b[i]![j]!)) as unknown;
  return out as Mat4;
}

function matMul(a: Mat4, b: Mat4): Mat4 {
  const out: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[i]![k]! * b[k]![j]!;
      out[i]![j] = s;
    }
  return out as unknown as Mat4;
}

function transpose(a: Mat4): Mat4 {
  return [
    [a[0]![0]!, a[1]![0]!, a[2]![0]!, a[3]![0]!],
    [a[0]![1]!, a[1]![1]!, a[2]![1]!, a[3]![1]!],
    [a[0]![2]!, a[1]![2]!, a[2]![2]!, a[3]![2]!],
    [a[0]![3]!, a[1]![3]!, a[2]![3]!, a[3]![3]!],
  ];
}

function matVec(a: Mat4, v: Vec4): Vec4 {
  return [
    a[0]![0]! * v[0] + a[0]![1]! * v[1] + a[0]![2]! * v[2] + a[0]![3]! * v[3],
    a[1]![0]! * v[0] + a[1]![1]! * v[1] + a[1]![2]! * v[2] + a[1]![3]! * v[3],
    a[2]![0]! * v[0] + a[2]![1]! * v[1] + a[2]![2]! * v[2] + a[2]![3]! * v[3],
    a[3]![0]! * v[0] + a[3]![1]! * v[1] + a[3]![2]! * v[2] + a[3]![3]! * v[3],
  ];
}

/** State transition for a constant-velocity model over dt. */
function transitionMatrix(dt: Seconds): Mat4 {
  return [
    [1, 0, dt, 0],
    [0, 1, 0, dt],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/** Continuous white-noise-acceleration process covariance (report §1 estimator forms). */
function processCovariance(dt: Seconds, q: number): Mat4 {
  const dt2 = dt * dt;
  const dt3 = dt2 * dt;
  const a = (dt3 / 3) * q;
  const b = (dt2 / 2) * q;
  const c = dt * q;
  return [
    [a, 0, b, 0],
    [0, a, 0, b],
    [b, 0, c, 0],
    [0, b, 0, c],
  ];
}

export function validateLocalizationConfig(cfg: LocalizationConfig): void {
  const positive: Array<[string, number]> = [
    ["processNoise", cfg.processNoise],
    ["measurementStd", cfg.measurementStd],
    ["initialPosStd", cfg.initialPosStd],
    ["initialVelStd", cfg.initialVelStd],
  ];
  for (const [name, v] of positive) {
    if (!isFiniteNumber(v)) throw new RangeError(`LocalizationConfig.${name} must be finite`);
    if (v <= 0) throw new RangeError(`LocalizationConfig.${name} must be > 0`);
  }
}

export function createLocalizationState(
  cfg: LocalizationConfig,
  initialMean: Vec4,
): LocalizationState {
  validateLocalizationConfig(cfg);
  if (initialMean.some((x) => !isFiniteNumber(x)))
    throw new RangeError("initialMean must contain finite values");
  const p = cfg.initialPosStd * cfg.initialPosStd;
  const v = cfg.initialVelStd * cfg.initialVelStd;
  const cov = diag4(p, p, v, v);
  return {
    mean: initialMean,
    cov,
    innovation: null,
    nis: null,
    positionUncertainty: Math.sqrt(cov[0]![0]! + cov[1]![1]!) as Metres,
  };
}

/** Predict step: propagate mean and covariance forward by dt. */
export function predictLocalization(
  cfg: LocalizationConfig,
  state: LocalizationState,
  dt: Seconds,
): LocalizationState {
  if (!isFiniteNumber(dt) || dt <= 0) throw new RangeError("dt must be finite and > 0");
  const F = transitionMatrix(dt);
  const Q = processCovariance(dt, cfg.processNoise);
  const mean = matVec(F, state.mean);
  const cov = matAdd(matMul(matMul(F, state.cov), transpose(F)), Q);
  return {
    mean,
    cov,
    innovation: state.innovation,
    nis: state.nis,
    positionUncertainty: Math.sqrt(cov[0]![0]! + cov[1]![1]!) as Metres,
  };
}

/**
 * Update step with a 2D position measurement [zx, zy].
 * Observation matrix H selects position; solves the 2x2 innovation system in
 * closed form. Returns innovation and NIS for reliability monitoring.
 */
export function updateLocalization(
  cfg: LocalizationConfig,
  state: LocalizationState,
  measurement: readonly [number, number],
): LocalizationState {
  if (measurement.some((x) => !isFiniteNumber(x)))
    throw new RangeError("measurement must contain finite values");

  const r = cfg.measurementStd * cfg.measurementStd;
  const P = state.cov;
  const m = state.mean;

  // Innovation y = z - H x
  const yx = measurement[0] - m[0];
  const yy = measurement[1] - m[1];

  // S = H P H^T + R  (position block of P plus measurement noise)
  const s00 = P[0]![0]! + r;
  const s01 = P[0]![1]!;
  const s10 = P[1]![0]!;
  const s11 = P[1]![1]! + r;
  const detS = s00 * s11 - s01 * s10;
  if (Math.abs(detS) < 1e-12) throw new RangeError("innovation covariance is singular");

  // S^-1
  const iS00 = s11 / detS;
  const iS01 = -s01 / detS;
  const iS10 = -s10 / detS;
  const iS11 = s00 / detS;

  // K = P H^T S^-1  -> only first two columns of P H^T are the position columns.
  // (P H^T) is 4x2 = first two columns of P.
  const PHt: number[][] = [
    [P[0]![0]!, P[0]![1]!],
    [P[1]![0]!, P[1]![1]!],
    [P[2]![0]!, P[2]![1]!],
    [P[3]![0]!, P[3]![1]!],
  ];
  const K: number[][] = PHt.map((row) => [
    row[0]! * iS00 + row[1]! * iS10,
    row[0]! * iS01 + row[1]! * iS11,
  ]);

  // x' = x + K y
  const mean: Vec4 = [
    m[0] + K[0]![0]! * yx + K[0]![1]! * yy,
    m[1] + K[1]![0]! * yx + K[1]![1]! * yy,
    m[2] + K[2]![0]! * yx + K[2]![1]! * yy,
    m[3] + K[3]![0]! * yx + K[3]![1]! * yy,
  ];

  // P' = (I - K H) P.  K H is 4x4 with only first two columns non-zero (= K).
  const KH: number[][] = [
    [K[0]![0]!, K[0]![1]!, 0, 0],
    [K[1]![0]!, K[1]![1]!, 0, 0],
    [K[2]![0]!, K[2]![1]!, 0, 0],
    [K[3]![0]!, K[3]![1]!, 0, 0],
  ];
  const cov: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const ImKH = (i === j ? 1 : 0) - KH[i]![j]!;
      // (I-KH) row i dotted with column j of P, but ImKH is only one term; do full:
      let s = 0;
      for (let k = 0; k < 4; k++) {
        const imkhIK = (i === k ? 1 : 0) - KH[i]![k]!;
        s += imkhIK * P[k]![j]!;
      }
      cov[i]![j] = s;
      void ImKH;
    }

  // NIS = y^T S^-1 y
  const nis = yx * (iS00 * yx + iS01 * yy) + yy * (iS10 * yx + iS11 * yy);

  const covM = cov as unknown as Mat4;
  return {
    mean,
    cov: covM,
    innovation: [yx, yy],
    nis,
    positionUncertainty: Math.sqrt(covM[0]![0]! + covM[1]![1]!) as Metres,
  };
}
