/**
 * Minimal dense linear algebra for small, fixed-size EKF matrices.
 *
 * The RSD codebase deliberately avoids a numerical/SLAM dependency (see README
 * engineering constraints). The existing 4-state Kalman filter in
 * `recursions/localization.ts` hand-rolls its 4x4 maths inline. The BLE+IMU
 * fused estimator uses a 5-state vector [x, y, vx, vy, yaw], so rather than
 * unrolling 5x5 arithmetic by hand we provide the handful of general
 * `number[][]` / `number[]` operations it needs — all auditable, no dependency.
 *
 * Matrices are row-major `number[][]`; vectors are `number[]`. Functions are
 * pure and return fresh arrays. Determinism: pure arithmetic only.
 */

export type Matrix = number[][];
export type Vector = number[];

export function zeros(rows: number, cols: number): Matrix {
  const m: Matrix = [];
  for (let i = 0; i < rows; i++) m.push(new Array<number>(cols).fill(0));
  return m;
}

export function identity(n: number): Matrix {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m[i]![i] = 1;
  return m;
}

export function clone(a: Matrix): Matrix {
  return a.map((row) => row.slice());
}

export function add(a: Matrix, b: Matrix): Matrix {
  const out = zeros(a.length, a[0]!.length);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a[0]!.length; j++) out[i]![j] = a[i]![j]! + b[i]![j]!;
  return out;
}

export function sub(a: Matrix, b: Matrix): Matrix {
  const out = zeros(a.length, a[0]!.length);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a[0]!.length; j++) out[i]![j] = a[i]![j]! - b[i]![j]!;
  return out;
}

export function scale(a: Matrix, s: number): Matrix {
  return a.map((row) => row.map((x) => x * s));
}

export function matMul(a: Matrix, b: Matrix): Matrix {
  const n = a.length;
  const inner = b.length;
  const cols = b[0]!.length;
  const out = zeros(n, cols);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < inner; k++) {
      const aik = a[i]![k]!;
      if (aik === 0) continue;
      for (let j = 0; j < cols; j++) out[i]![j]! += aik * b[k]![j]!;
    }
  return out;
}

export function transpose(a: Matrix): Matrix {
  const rows = a.length;
  const cols = a[0]!.length;
  const out = zeros(cols, rows);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) out[j]![i] = a[i]![j]!;
  return out;
}

export function matVec(a: Matrix, v: Vector): Vector {
  const out = new Array<number>(a.length).fill(0);
  for (let i = 0; i < a.length; i++) {
    let s = 0;
    for (let j = 0; j < v.length; j++) s += a[i]![j]! * v[j]!;
    out[i] = s;
  }
  return out;
}

export function addVec(a: Vector, b: Vector): Vector {
  return a.map((x, i) => x + b[i]!);
}

/** Force symmetry (P := (P + P^T)/2). EKF covariances drift asymmetric otherwise. */
export function symmetrize(a: Matrix): Matrix {
  const n = a.length;
  const out = zeros(n, n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) out[i]![j] = 0.5 * (a[i]![j]! + a[j]![i]!);
  return out;
}

export function trace(a: Matrix): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]![i]!;
  return s;
}

/**
 * Invert a small square matrix via Gauss-Jordan with partial pivoting.
 * Throws if singular. Used for the (small) innovation covariance of vector
 * measurements (e.g. the 2D zero-velocity update). Scalar BLE range updates
 * divide by the scalar innovation covariance directly and never call this.
 */
export function invert(a: Matrix): Matrix {
  const n = a.length;
  const m = a.map((row, i) => [...row, ...identity(n)[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    let best = Math.abs(m[col]![col]!);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(m[r]![col]!);
      if (v > best) {
        best = v;
        pivot = r;
      }
    }
    if (best < 1e-15) throw new RangeError("matrix is singular; cannot invert");
    if (pivot !== col) {
      const tmp = m[col]!;
      m[col] = m[pivot]!;
      m[pivot] = tmp;
    }
    const pv = m[col]![col]!;
    for (let j = 0; j < 2 * n; j++) m[col]![j]! /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r]![col]!;
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j++) m[r]![j]! -= factor * m[col]![j]!;
    }
  }
  return m.map((row) => row.slice(n));
}
