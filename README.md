# RSD Simulator

A deterministic, testable simulator for **Recursive State Dynamics (RSD, Revision v0.1)** — a
user-defined engineering and epistemic meta-framework that couples three recursive states:

- **L — localization / navigation:** position/velocity estimate and uncertainty.
- **K — knowledge / model state:** hypotheses, evidence/confidence, provenance, uncertainty.
- **E — energy / autonomy:** stored energy, harvested power, leakage, quiescent draw, and
  operating constraints (brownout, capacity).

The core loop is: predict/update recursion, reliability/innovation metrics, a clipped energy
balance, event/innovation-triggered sensing, and an information-per-joule scheduler operating
under energy-neutral constraints.

## Scope and honesty statement

**RSD is user-defined.** It is **not new physics, not free energy, and not a demonstrated GPS
replacement.** There is no external peer-reviewed "RSD" literature; the L/K/E coupling and the
"useful information per joule under energy-neutral operation" objective are the user's framework.
This repository is a *reference engineering slice*, not a validated product or a claim of measured
device performance.

- All numeric scenario defaults are **illustrative**, chosen to match the order-of-magnitude
  values in the source report (e.g. ~8 µW favorable indoor RF DC harvest, ~15 mW BLE active load).
  They are **not** measured results.
- The source report `recursive-state-dynamics-integration.pplx.md` is the requirements/technical
  context. Values there are individually sourced; their assembly into "RSD" is analytical synthesis.

### Sourced vs. illustrative

| Aspect | Status |
|---|---|
| Estimator forms (Kalman predict/update, EKF IMU/BLE fusion, ZUPT, chi-square NIS gating, Bayesian evidence update, clipped energy balance) | Standard tools; sourced in report §1, §4, §6 |
| Order-of-magnitude power/energy figures (µW harvest, mW radios) | Sourced in report §2, §5, §6 |
| Specific scenario parameter values (capacities, cadences, seeds) | **Illustrative defaults**, tuned for a clear demo |
| Any claim of continuous SLAM / onboard LLM on ambient RF | **Explicitly out of scope / infeasible** (report §6.4) |

## Units

All internal computation uses **SI base units** to keep the energy balance unambiguous
(the report repeatedly warns against mixing µW/mW/mA·V):

- time: seconds (s), power: watts (W), energy: joules (J)
- length: metres (m), velocity: m/s, voltage: volts (V), current: amperes (A)

Helpers in `src/domain/units.ts` (`uW`, `mW`, `mA`, `uJ`, `mJ`) convert to SI. A compile-time
`Quantity<Unit>` brand discourages passing, e.g., microwatts where watts are expected.

### Energy chain — no double conversion

The RF/energy chain is modeled in explicit, separated stages (report §6.1):

```
P_rf_incident --(eta_rf_to_dc)--> P_harvested_dc --(eta_converter)--> P_net_dc
```

Each efficiency is applied **exactly once**. If a measurement already reports harvested DC
(post-rectifier) power, pass it as `harvestedDcW` and the RF→DC efficiency is **not** applied
again. See `resolveHarvest` in `src/recursions/energy.ts` and the `no double conversion` tests.

The clipped energy balance is:

```
E_store(t+dt) = clip( E_store(t) + (P_in - P_out) * dt , 0 , E_cap )
```

with a brownout reserve the scheduler must never draw below, and a PMIC cold-start floor below
which harvest cannot bootstrap from an empty store.

## Scenarios

Three named scenarios (see `src/engine/scenario.ts`), aligned with report §6.3:

1. **`harvest-only-intermittent`** — ambient-RF-only node, small supercap, ~8 µW intermittent
   harvest. Illustrates the harsh reality of §6.3a: it repeatedly browns out and can lock out at
   cold start (net DC < 10 µW floor), i.e. harvest-only continuous operation is barely feasible.
2. **`burst-sensing-with-storage`** — accumulate µW harvest, spend on periodic sensing bursts;
   the ~0.05% break-even duty-cycle regime of §6.3b.
3. **`hybrid-harvested-plus-battery`** — thin-film/LTO battery buffer plus harvest supports
   higher-cadence sensing and compute bursts (§6.3c); L converges and K reaches confidence.

All scenarios are fully deterministic: every stochastic input comes from a seeded PRNG
(`src/rng.ts`), so a given seed reproduces a run exactly.

## Fused BLE + IMU localization

The L recursion is **extended** (the original 4-state Kalman filter in
`src/recursions/localization.ts` is untouched) with a 5-state Extended Kalman Filter
`[px, py, vx, vy, yaw]` that **fuses** a planar inertial measurement unit with BLE RSSI
ranging. The pieces:

- **IMU** (`src/recursions/imu.ts`) — a timestamped planar accelerometer (body-frame specific
  force) + yaw-rate gyro with configurable bias, white noise, sample rate, and optional
  calibration. The EKF *predict* step is strapdown dead reckoning:

  ```
  yaw' = yaw + w*dt
  a_w  = R(yaw) * a_body           (body -> world rotation)
  v'   = v + a_w*dt
  p'   = p + v*dt + 0.5*a_w*dt^2
  P'   = F P F^T + G Qu G^T         (F = df/dx, G = df/du, Qu = accel/gyro variances)
  ```

  This is dead reckoning: any residual bias makes position error grow without bound (report
  §6.4). A **zero-velocity update (ZUPT)** bounds that drift when stationary — but a planar
  accel+gyro cannot tell constant-velocity cruise from true rest, so ZUPT additionally gates
  on the *estimated* speed (`speedThreshold`). It is an honest partial mitigation, **not**
  drift-free inertial navigation.

- **BLE** (`src/recursions/ble.ts`) — fixed beacons with known positions and timestamped RSSI.
  A log-distance path-loss model converts RSSI to range, then each beacon is fused as a
  nonlinear scalar range EKF update:

  ```
  RSSI(d) = refRssi - 10*n*log10(d/d0),  d0 = 1 m   (invert for range)
  h(x)    = sqrt((px-bx)^2 + (py-by)^2)
  S       = H P H^T + R            (scalar)
  NIS     = nu^2 / S               (chi-square, 1 dof)
  K       = P H^T / S ;  x' = x + K*nu ;  P' = (I - K H) P
  ```

  A **chi-square NIS gate** rejects NLoS/multipath outliers: a rejected measurement leaves the
  state completely unchanged and records a reason (`unknown-beacon`, `duplicate-beacon`,
  `invalid-rssi`, `rssi-out-of-bounds`, `impossible-range`, `degenerate-geometry`, `nis-gate`).

- **Orchestration** (`src/recursions/fusion.ts`) — one L step is predict → optional ZUPT →
  sequential gated BLE updates, emitting per-step diagnostics (accepted/rejected counts, IMU
  prediction count, ZUPT flag, per-source innovation/NIS, position uncertainty). BLE/IMU
  outcomes feed **K** through the audited `updateKnowledge` provenance path (LoS vs NLoS
  hypotheses); likelihood ratios are kept deliberately small so confidence climbs toward but
  never pins at 1.0.

Scenario **`ble-imu-fusion`** (`src/engine/fusion-scenario.ts`) is a deterministic 60 s walk
(10 Hz) of a 2D agent past 6 beacons, exercising IMU drift, a coordinated turn, a stationary
ZUPT window, an **energy-driven BLE-scan dropout**, an **RF-congestion scan dropout**, and an
**NLoS outlier interval** on one beacon. The energy model accounts for always-on IMU sampling
*and* per-scan BLE cost, so scans are neither free nor continuously feasible under ambient
harvest — the scheduler skips scans as the supercap nears its brownout reserve.

### Tuning parameters

| Group | Parameter | Meaning |
|---|---|---|
| IMU | `accelBias`, `gyroBias`, `*NoiseStd`, `calibration` | sensor error model + filter-side correction |
| ZUPT | `accelThreshold`, `gyroThreshold`, `speedThreshold`, `measurementStd` | stance detector + pseudo-measurement noise |
| BLE | `refRssiDbm`, `pathLossExponent`, `rangeVarianceM2` | path-loss model + range measurement variance R |
| BLE | `minRssiDbm`, `maxRssiDbm`, `maxRangeM` | validity bounds for RSSI / range |
| BLE | `nisGateThreshold` | chi-square gate (6.63 ≈ 99% at 1 dof) |
| Env | `rssiNoiseStd`, `visibilityRangeM`, `scanInterval`, `isScanDropout`, `nlosExcessDb` | sensor-side ground-truth synthesis |

### Limitations

- **RSSI ranging is coarse and multipath/NLoS-prone.** ~2.5 dB RSSI noise maps to several
  metres of range error at ~20 m; the model uses a large range variance to reflect this and the
  NIS gate to survive gross NLoS outliers. This is illustrative, not a calibrated device claim.
- **IMU-only navigation drifts without bound.** ZUPT and BLE fusion bound the drift; they do
  not eliminate it. There is no magnetometer/heading aid, so yaw is observed only indirectly.
- Everything here is **illustrative** (see the honesty statement); no hardware accuracy is
  claimed and no field validation is implied.

## Running

```bash
npm install
npm run build          # compile TypeScript to dist/
npm run typecheck      # tsc --noEmit (also used as `npm run lint`)
npm test               # vitest run

# CLI (no build needed via tsx):
npm run cli -- list
npm run cli -- run burst-sensing-with-storage --tail 8
npm run cli -- run hybrid-harvested-plus-battery --json
npm run cli -- duty    # illustrative break-even duty cycle

# Fused BLE + IMU scenario, with the IMU-only vs fused comparison:
npm run cli -- run ble-imu-fusion --compare --tail 8
npm run cli -- run ble-imu-fusion --json

# Or after `npm run build`:
node dist/cli.js run harvest-only-intermittent
```

Illustrative `run ble-imu-fusion --compare` output (seed 7): fused RMSE **2.18 m** vs IMU-only
**3.59 m** (~**39%** improvement) over the same trajectory, with 25 energy-skipped scans, 57
brownout steps, 11 NIS-gated NLoS rejections, and a final K MAP of `los` at confidence 0.987.

## Library API

`import { runSimulation, getScenario, ... } from "rsd-simulator";` exposes the domain model,
the L/K/E recursions, the scheduler, the engine, and the research adapters. See `src/index.ts`.

## Research-plus-adapter layer

Optional, **read-only, disabled-by-default** adapters normalize external sources (GitHub, Web,
Academic, Gmail, Calendar, Statista, CB Insights, Wiley) into a common citation-bearing result
type that feeds **K evidence with provenance**. In this milestone all adapters are **mock-backed**
(`src/adapters/`) so the simulator runs fully offline and deterministically.

External-tool invocation must be **host/server-side only**: no tokens in client code, no
credentials from the client, no personal-data fixtures. Connector contracts (source ids, tool
names, read-only invariants, known collection ids) are documented in
`src/adapters/connectors.ts` and the backend boundary in
[`docs/backend-boundary.md`](docs/backend-boundary.md).

## Testing

`npm test` covers: state validation, deterministic seeded runs, energy clipping and brownout
protection, the no-double-conversion invariant, scheduler action choice, K provenance, the mock
adapter layer, and a **regression test** for the report's illustrative upper bound: ~8 µW net DC
vs a ~15 mW radio active load yields a break-even duty cycle of ~0.05% (not continuous
feasibility). See `tests/`.

For the fused estimator (`tests/imu.test.ts`, `tests/ble.test.ts`, `tests/fusion.test.ts`,
`tests/fusion-simulator.test.ts`): IMU integration/rotation and monotonic drift, bias/noise
determinism, ZUPT firing and the cruise speed-gate, RSSI→range conversion and calibration
override, the BLE EKF update, NIS gating, unknown/invalid/out-of-bounds/impossible-range
rejection with **rejected-measurement immutability**, duplicate-beacon rejection, seeded
determinism with dropout/outliers, energy accounting under the brownout budget, and a
**comparative regression** asserting fused BLE+IMU cuts RMSE by ≥15% vs IMU-only dead reckoning
on the same trajectory/seed. Design note: [`docs/fusion-design.md`](docs/fusion-design.md).
