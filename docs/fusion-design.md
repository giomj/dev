# Fused BLE + IMU localization — design note

This note documents the extended L recursion: a 5-state Extended Kalman Filter (EKF) that fuses
a planar IMU with BLE RSSI ranging. It is a *reference engineering slice*, not a validated
product. All numeric defaults are **illustrative** (see the README honesty statement); no
hardware accuracy is claimed and no field validation is implied.

## Why extend rather than replace

The original 4-state constant-velocity Kalman filter (`src/recursions/localization.ts`) and its
tests are left untouched. The fused estimator is a **separate** 5-state module so both remain
available and the existing regression suite is unaffected. A small dependency-free linear-algebra
module (`src/domain/linalg.ts`) supplies the NxN matrix ops the EKF needs, so we avoid pulling in
a numerical/SLAM dependency.

## State

```
x = [px, py, vx, vy, yaw]          (indices in src/recursions/fusion-state.ts)
```

World-frame position/velocity (m, m/s) and heading (rad). Covariance `P` is a symmetric 5x5.

## Predict — IMU strapdown dead reckoning

The IMU is used as a **control input** to the predict step, not as a measurement. Given a
body-frame specific force `[ax, ay]` and yaw rate `w` over `dt`:

```
yaw' = wrap(yaw + w*dt)
a_w  = R(yaw) * [ax, ay]           R = 2D rotation by yaw
v'   = v + a_w*dt
p'   = p + v*dt + 0.5*a_w*dt^2
```

Because `a_w` depends on `yaw`, the transition is genuinely nonlinear, so we propagate the
covariance with Jacobians:

```
P' = F P F^T + G Qu G^T
F  = df/dx        (includes d(a_w)/d(yaw): d(awx)=-awy, d(awy)=awx)
G  = df/du        u = [ax, ay, w]
Qu = diag(sa^2, sa^2, sw^2)        accel/gyro white-noise variances
```

The filter subtracts a *known* calibration bias from each sample; any residual (uncalibrated)
bias is what makes dead reckoning drift without bound — the point the report stresses in §6.4 and
the motivation for fusing BLE.

## Zero-velocity update (ZUPT)

When the node is stationary we apply a pseudo-measurement `v = [0, 0]` (2x2 innovation solve) to
bound velocity — and hence position — drift.

A planar accelerometer + yaw gyro **cannot** distinguish constant-velocity cruise (zero specific
force, zero yaw rate) from true rest. Firing ZUPT on low specific force alone would wrongly zero
a cruising velocity and freeze the estimate. We therefore require **all** of:

```
|specific force| < accelThreshold  AND  |yaw rate| < gyroThreshold  AND  estSpeed < speedThreshold
```

where `estSpeed = hypot(vx, vy)` from the current estimate. This estimate-aided stance detector is
an honest partial mitigation, not drift-free inertial navigation. (During development, omitting the
speed gate caused ZUPT to fire in cruise and froze the filter — RMSE ballooned and every BLE range
tripped the NIS gate.)

## Update — BLE RSSI range, sequentially fused

Beacons have fixed known positions. Each RSSI is converted to a range via log-distance path loss
(reference distance `d0 = 1 m`), with optional per-beacon calibration:

```
RSSI(d) = refRssi - 10*n*log10(d/d0)   =>   d = d0 * 10^((refRssi - rssi)/(10*n))
```

Each beacon is then a nonlinear scalar range measurement, fused sequentially (algebraically
equivalent to a batched update for independent measurements, and cheaper — no matrix inverse):

```
h(x) = sqrt((px-bx)^2 + (py-by)^2)
H    = [ (px-bx)/d, (py-by)/d, 0, 0, 0 ]
S    = H P H^T + R                 R = rangeVarianceM2 (scalar)
nu   = d_measured - h(x)
NIS  = nu^2 / S                    chi-square, 1 dof
K    = P H^T / S
x'   = x + K*nu ;  P' = (I - K H) P
```

### Robustness / rejection

Every observation yields a diagnostic whether accepted or not. A rejected observation leaves the
state **completely unchanged** and records a reason:

| Reason | Condition |
|---|---|
| `unknown-beacon` | beacon id not in the registry |
| `duplicate-beacon` | same beacon id seen twice in one scan (kept: first only) |
| `invalid-rssi` | non-finite RSSI |
| `rssi-out-of-bounds` | RSSI outside `[minRssiDbm, maxRssiDbm]` |
| `impossible-range` | converted range ≤ 0 or > `maxRangeM` |
| `degenerate-geometry` | predicted range ≈ 0 or non-positive innovation covariance |
| `nis-gate` | `NIS > nisGateThreshold` (chi-square gate; NLoS/multipath outliers) |

The NIS gate (default 6.63 ≈ 99% at 1 dof) is what lets the filter survive a beacon that reads
far too distant during an NLoS interval: its large innovation trips the gate and is dropped rather
than corrupting the state.

## Coupling to K (knowledge)

Per-step BLE outcomes feed the audited `updateKnowledge` provenance path as evidence over two
hypotheses: `los` (line-of-sight) vs `nlos` (multipath). Accepted, well-fitting ranges favor LoS;
NIS-gated outliers favor NLoS. Repeated scans observe the *same* beacons, so they are not
independent trials — we deliberately keep per-step likelihood ratios small and saturate the
per-step counts, so the posterior climbs toward but never pins at certainty. On the flagship
scenario K ends at `los` ≈ 0.987 (entropy ≈ 0.10 bits), not a forced 1.0.

## Coupling to E (energy)

Every step charges always-on IMU sampling power; a performed BLE scan additionally charges
`bleScanW * bleScanS`. Whether a due scan actually happens is decided by the energy-neutral
scheduler against the current stored energy and net harvest. Under the flagship scenario's tight
supercap, scans are skipped as the buffer nears its brownout reserve — BLE ranging is neither free
nor continuously feasible on ambient harvest.

## Determinism

The scenario uses one seeded PRNG split into independent sub-streams via `rng.fork(salt)`
(`imuRng = fork(1)`, `bleRng = fork(2)`). Disabling BLE fusion (`applyBle: false`) does not shift
the IMU noise stream, so the IMU-only vs fused comparison runs on the *identical* trajectory and
sensor realization — the improvement is attributable to fusion alone.

## Comparative result (illustrative, seed 7)

| Metric | IMU-only | Fused BLE+IMU |
|---|---|---|
| Position RMSE | 3.59 m | 2.18 m (~39% better) |

Plus (fused run): 25 scans skipped for energy, 57 brownout steps, 11 NIS-gated NLoS rejections, a
BLE dropout window, and ZUPTs during the stationary interval. The regression test asserts a ≥15%
RMSE improvement as the documented threshold.

## Limitations

- RSSI ranging is coarse and multipath/NLoS-prone; the large range variance and NIS gate reflect
  and manage this, but do not make it precise.
- No magnetometer/heading aid: yaw is observed only indirectly through BLE geometry, so heading
  error is bounded weakly.
- IMU-only navigation drifts without bound; ZUPT and BLE fusion bound drift, they do not remove it.
