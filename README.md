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
| Estimator forms (Kalman predict/update, Bayesian evidence update, clipped energy balance) | Standard tools; sourced in report §1, §4, §6 |
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

# Or after `npm run build`:
node dist/cli.js run harvest-only-intermittent
```

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
