import {
  type Joules,
  type Ratio,
  type Seconds,
  type Watts,
  clamp,
  isFiniteNumber,
} from "../domain/units.js";

/**
 * E state — energy / autonomy (report §3, §6).
 *
 * Models a harvested-power node with a storage buffer. The single most
 * important invariant (report §6.1) is the separation of RF chain stages and
 * the rule that conversion efficiency is applied EXACTLY ONCE:
 *
 *   P_rf_incident  --(eta_rf_to_dc)-->  P_harvested_dc  --(eta_converter)-->  P_net_dc
 *
 * If a measurement already reports harvested DC (post-rectifier) power, callers
 * pass it via `harvestedDcW` and MUST leave `rfIncidentW`/`etaRfToDc` at their
 * defaults so no efficiency is applied again.
 */
export interface EnergyConfig {
  /** Total usable storage capacity (J). */
  readonly capacityJ: Joules;
  /** Brownout reserve: node must not draw storage below this (J). */
  readonly brownoutJ: Joules;
  /** Standing leakage of the storage element (W), e.g. supercap self-discharge. */
  readonly leakageW: Watts;
  /** Quiescent draw of the PMIC / always-on domain (W). */
  readonly quiescentW: Watts;
  /**
   * PMIC cold-start input floor (W). Below this incident+converter input the
   * harvester cannot bootstrap; harvested DC is treated as unusable until
   * storage clears the reserve. (report §3.2, BQ25504 ~10 µW.)
   */
  readonly coldStartFloorW: Watts;
}

/** How the harvest source is specified for a timestep. */
export type HarvestInput =
  | {
      /** RF power delivered to the rectifier input (W), pre-rectification. */
      readonly rfIncidentW: Watts;
      /** RF->DC rectifier efficiency in [0,1]. Applied once. */
      readonly etaRfToDc: Ratio;
      /** DC->DC / PMIC converter efficiency in [0,1]. Applied once. */
      readonly etaConverter: Ratio;
    }
  | {
      /** Already-rectified harvested DC power (W). No RF->DC applied. */
      readonly harvestedDcW: Watts;
      /** DC->DC / PMIC converter efficiency in [0,1]. Applied once. */
      readonly etaConverter: Ratio;
    };

export interface EnergyState {
  readonly storedJ: Joules;
  readonly capacityJ: Joules;
  readonly brownoutJ: Joules;
  /** True once stored energy is at/below the brownout reserve. */
  readonly brownedOut: boolean;
}

/** Fully-resolved power ledger for one step (all watts, SI). */
export interface EnergyLedger {
  readonly rfIncidentW: Watts;
  readonly harvestedDcW: Watts;
  readonly netDcW: Watts;
  readonly leakageW: Watts;
  readonly quiescentW: Watts;
  readonly activeW: Watts;
  readonly coldStartBlocked: boolean;
}

export interface EnergyStepResult {
  readonly state: EnergyState;
  readonly ledger: EnergyLedger;
  /** Net rate applied to storage this step, after clipping considerations (W). */
  readonly netStorageW: Watts;
}

export function validateEnergyConfig(cfg: EnergyConfig): void {
  const fields: Array<[string, number]> = [
    ["capacityJ", cfg.capacityJ],
    ["brownoutJ", cfg.brownoutJ],
    ["leakageW", cfg.leakageW],
    ["quiescentW", cfg.quiescentW],
    ["coldStartFloorW", cfg.coldStartFloorW],
  ];
  for (const [name, v] of fields) {
    if (!isFiniteNumber(v)) throw new RangeError(`EnergyConfig.${name} must be finite`);
    if (v < 0) throw new RangeError(`EnergyConfig.${name} must be >= 0`);
  }
  if (cfg.capacityJ <= 0) throw new RangeError("EnergyConfig.capacityJ must be > 0");
  if (cfg.brownoutJ >= cfg.capacityJ)
    throw new RangeError("EnergyConfig.brownoutJ must be < capacityJ");
}

export function createEnergyState(cfg: EnergyConfig, initialStoredJ: Joules): EnergyState {
  validateEnergyConfig(cfg);
  if (!isFiniteNumber(initialStoredJ) || initialStoredJ < 0)
    throw new RangeError("initialStoredJ must be a finite value >= 0");
  const stored = clamp(initialStoredJ, 0, cfg.capacityJ);
  return {
    storedJ: stored,
    capacityJ: cfg.capacityJ,
    brownoutJ: cfg.brownoutJ,
    brownedOut: stored <= cfg.brownoutJ,
  };
}

const ratio = (x: Ratio, name: string): number => {
  if (!isFiniteNumber(x) || x < 0 || x > 1)
    throw new RangeError(`${name} must be a ratio in [0,1]`);
  return x;
};

/**
 * Resolve the harvest chain into net usable DC power, applying each efficiency
 * exactly once. This is the one function permitted to convert RF->DC.
 */
export function resolveHarvest(input: HarvestInput): {
  rfIncidentW: Watts;
  harvestedDcW: Watts;
  netDcW: Watts;
} {
  const etaConverter = ratio(input.etaConverter, "etaConverter");
  if ("harvestedDcW" in input) {
    const harvestedDcW = input.harvestedDcW;
    if (!isFiniteNumber(harvestedDcW) || harvestedDcW < 0)
      throw new RangeError("harvestedDcW must be finite and >= 0");
    // Already post-rectifier: DO NOT apply eta_rf_to_dc again.
    return {
      rfIncidentW: Number.NaN as Watts, // unknown / not provided upstream
      harvestedDcW,
      netDcW: harvestedDcW * etaConverter,
    };
  }
  const etaRfToDc = ratio(input.etaRfToDc, "etaRfToDc");
  if (!isFiniteNumber(input.rfIncidentW) || input.rfIncidentW < 0)
    throw new RangeError("rfIncidentW must be finite and >= 0");
  const harvestedDcW = input.rfIncidentW * etaRfToDc;
  return {
    rfIncidentW: input.rfIncidentW,
    harvestedDcW,
    netDcW: harvestedDcW * etaConverter,
  };
}

/**
 * Advance the energy state by one timestep with a clipped energy balance
 * (report §6.1). `activeW` is the load selected by the scheduler for this step.
 */
export function stepEnergy(
  cfg: EnergyConfig,
  state: EnergyState,
  harvest: HarvestInput,
  activeW: Watts,
  dt: Seconds,
): EnergyStepResult {
  if (!isFiniteNumber(activeW) || activeW < 0)
    throw new RangeError("activeW must be finite and >= 0");
  if (!isFiniteNumber(dt) || dt <= 0) throw new RangeError("dt must be finite and > 0");

  const { rfIncidentW, harvestedDcW, netDcW } = resolveHarvest(harvest);

  // Cold-start gate: below the PMIC floor the harvester cannot bootstrap while
  // storage is at/below reserve, so no net DC is credited.
  const coldStartBlocked = netDcW < cfg.coldStartFloorW && state.storedJ <= cfg.brownoutJ;
  const usableHarvestW = coldStartBlocked ? 0 : netDcW;

  const netStorageW = usableHarvestW - cfg.leakageW - cfg.quiescentW - activeW;
  const nextRaw = state.storedJ + netStorageW * dt;
  const nextStored = clamp(nextRaw, 0, cfg.capacityJ) as Joules;

  const nextState: EnergyState = {
    storedJ: nextStored,
    capacityJ: cfg.capacityJ,
    brownoutJ: cfg.brownoutJ,
    brownedOut: nextStored <= cfg.brownoutJ,
  };

  return {
    state: nextState,
    ledger: {
      rfIncidentW,
      harvestedDcW: harvestedDcW as Watts,
      netDcW: netDcW as Watts,
      leakageW: cfg.leakageW,
      quiescentW: cfg.quiescentW,
      activeW,
      coldStartBlocked,
    },
    netStorageW: netStorageW as Watts,
  };
}

/**
 * Energy available above the brownout reserve for an action of duration `dt`.
 * The scheduler uses this to refuse actions that would breach the reserve.
 */
export function availableEnergyJ(state: EnergyState): Joules {
  return Math.max(0, state.storedJ - state.brownoutJ) as Joules;
}

/**
 * Break-even duty cycle bound (report §6.3b), ignoring nothing that we know:
 *   D_max = (P_net_dc - P_leak - P_quiescent) / P_active
 * Returns 0 when the passive budget alone is not covered (no duty possible),
 * and is clamped to [0,1]. This is the illustrative upper bound used by docs
 * and the regression test.
 */
export function breakEvenDutyCycle(
  netDcW: Watts,
  leakageW: Watts,
  quiescentW: Watts,
  activeW: Watts,
): Ratio {
  if (activeW <= 0) throw new RangeError("activeW must be > 0 for duty-cycle bound");
  const surplus = netDcW - leakageW - quiescentW;
  if (surplus <= 0) return 0 as Ratio;
  return clamp(surplus / activeW, 0, 1) as Ratio;
}
