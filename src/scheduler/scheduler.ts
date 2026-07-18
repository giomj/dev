import { type Joules, type Seconds, type Watts, isFiniteNumber } from "../domain/units.js";
import { type EnergyState, availableEnergyJ } from "../recursions/energy.js";

/**
 * RSD scheduler (report §6.1, §7.3).
 *
 * Chooses one action per step to maximize useful information per joule
 * (EIG / E) subject to an energy-neutral, brownout-protected constraint.
 * "sleep" is always feasible and is the safe fallback.
 */

export type ActionKind = "sleep" | "sense" | "compute" | "communicate";

export interface Action {
  readonly kind: ActionKind;
  /** Active power draw while performing the action (W). */
  readonly powerW: Watts;
  /** Duration of the action within the step (s). */
  readonly durationS: Seconds;
  /** Expected information gain from the action (bits). sleep = 0. */
  readonly expectedInfoGainBits: number;
}

export interface SchedulerConfig {
  /**
   * Energy-neutral guard: an action is only allowed if the node can, in the
   * long run, replace what it spends. We approximate this per-step by requiring
   * the action's average draw not exceed harvest by more than this factor of the
   * available (above-reserve) headroom. Set >= 1 to require strict neutrality on
   * passive+active load vs harvest; the burst modes relax this via headroom.
   */
  readonly energyNeutralHeadroomJ: Joules;
}

export interface SchedulerDecision {
  readonly action: Action;
  /** Energy the chosen action will consume this step (J). */
  readonly costJ: Joules;
  /** EIG per joule for the chosen action (bits/J); 0 for sleep. */
  readonly efficiencyBitsPerJ: number;
  /** Human-readable rationale. */
  readonly rationale: string;
  /** Actions considered but rejected, with reasons. */
  readonly rejected: ReadonlyArray<{ kind: ActionKind; reason: string }>;
}

export const SLEEP_ACTION = (powerW: Watts, durationS: Seconds): Action => ({
  kind: "sleep",
  powerW,
  durationS,
  expectedInfoGainBits: 0,
});

function actionEnergyJ(a: Action): Joules {
  return (a.powerW * a.durationS) as Joules;
}

/**
 * Select the best feasible action.
 *
 * Feasibility: cost must not push storage below brownout, AND the action's
 * energy cost must fit within the available above-reserve energy plus the
 * configured neutral headroom (so we don't chronically outspend harvest).
 * Among feasible non-sleep actions, pick the highest EIG/joule. If none are
 * feasible or none beat sleep, sleep.
 */
export function selectAction(
  cfg: SchedulerConfig,
  energy: EnergyState,
  harvestNetW: Watts,
  candidates: readonly Action[],
  sleep: Action,
  dt: Seconds,
): SchedulerDecision {
  if (sleep.kind !== "sleep") throw new RangeError("sleep action must have kind 'sleep'");
  if (!isFiniteNumber(dt) || dt <= 0) throw new RangeError("dt must be finite and > 0");

  const available = availableEnergyJ(energy);
  const harvestBudgetJ = (harvestNetW * dt) as Joules;
  const spendCeilingJ = (available + cfg.energyNeutralHeadroomJ) as Joules;

  const rejected: Array<{ kind: ActionKind; reason: string }> = [];
  let best: { action: Action; costJ: Joules; eff: number } | null = null;

  for (const a of candidates) {
    if (a.kind === "sleep") continue;
    if (a.powerW < 0 || a.durationS <= 0) {
      rejected.push({ kind: a.kind, reason: "invalid power/duration" });
      continue;
    }
    const costJ = actionEnergyJ(a);

    if (energy.brownedOut) {
      rejected.push({ kind: a.kind, reason: "browned out: only sleep permitted" });
      continue;
    }
    // Brownout reserve protection: never draw below reserve.
    if (costJ > available) {
      rejected.push({
        kind: a.kind,
        reason: `cost ${costJ.toExponential(2)} J exceeds available above reserve ${available.toExponential(
          2,
        )} J`,
      });
      continue;
    }
    // Energy-neutral guard: don't chronically outspend harvest beyond headroom.
    if (costJ > spendCeilingJ) {
      rejected.push({
        kind: a.kind,
        reason: `cost exceeds energy-neutral ceiling (harvest ${harvestBudgetJ.toExponential(
          2,
        )} J/step)`,
      });
      continue;
    }
    const eff = costJ > 0 ? a.expectedInfoGainBits / costJ : 0;
    if (a.expectedInfoGainBits <= 0) {
      rejected.push({ kind: a.kind, reason: "no expected information gain" });
      continue;
    }
    if (best === null || eff > best.eff) best = { action: a, costJ, eff };
  }

  if (best === null) {
    const costJ = actionEnergyJ(sleep);
    return {
      action: sleep,
      costJ,
      efficiencyBitsPerJ: 0,
      rationale: energy.brownedOut
        ? "Browned out — sleeping to protect brownout reserve and recharge."
        : "No feasible information-positive action within energy-neutral budget — sleeping.",
      rejected,
    };
  }

  return {
    action: best.action,
    costJ: best.costJ,
    efficiencyBitsPerJ: best.eff,
    rationale: `Selected ${best.action.kind}: highest expected information per joule (${best.eff.toExponential(
      2,
    )} bits/J) within brownout reserve and energy-neutral budget.`,
    rejected,
  };
}
