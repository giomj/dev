import type { Matrix, Vector } from "../domain/linalg.js";
import type { Metres, Radians } from "../domain/units.js";

/**
 * Shared state definition for the BLE+IMU fused localization filter.
 *
 * The fused estimator extends the base 4-state constant-velocity Kalman filter
 * (`localization.ts`, kept intact) with a yaw state so that body-frame IMU
 * accelerations can be rotated into the world frame. State vector is:
 *
 *   x = [ px, py, vx, vy, yaw ]   (metres, metres, m/s, m/s, radians)
 *
 * This module holds only the state shape + index constants so that `imu.ts`,
 * `ble.ts`, and `fusion.ts` can share them without a runtime import cycle
 * (all cross-imports of this type are erased under verbatimModuleSyntax).
 */

export const N_STATE = 5 as const;

export const IDX = {
  px: 0,
  py: 1,
  vx: 2,
  vy: 3,
  yaw: 4,
} as const;

export interface FusedLocalizationState {
  /** Mean estimate [px, py, vx, vy, yaw]. Length N_STATE. */
  readonly mean: Vector;
  /** Covariance (N_STATE x N_STATE). */
  readonly cov: Matrix;
  /** sqrt(trace of the position block) (m). */
  readonly positionUncertainty: Metres;
  /** Estimated heading (rad), wrapped to (-pi, pi]. */
  readonly yaw: Radians;
}
