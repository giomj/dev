import { type Joules, type Metres, type Seconds, type Watts, mW, uJ, uW } from "../domain/units.js";
import type { EnergyConfig, HarvestInput } from "../recursions/energy.js";
import type { Hypothesis } from "../recursions/knowledge.js";
import type { LocalizationConfig as LConfig, Vec4 } from "../recursions/localization.js";
import type { SchedulerConfig } from "../scheduler/scheduler.js";

/**
 * A scenario is a fully-specified, deterministic simulation configuration.
 *
 * IMPORTANT (report §0 honesty statement): the numeric defaults below are
 * *illustrative* values chosen to match the orders of magnitude in the source
 * report (e.g. ~8 µW indoor RF DC, ~15 mW BLE active load). They are NOT
 * measured performance of any built device.
 */

/** Per-step ground-truth motion + harvest model (deterministic, seeded noise). */
export interface EnvironmentModel {
  /** True velocity of the node (m/s), constant per scenario for simplicity. */
  readonly trueVelocity: readonly [number, number];
  /** Harvest power schedule as a function of step (returns a HarvestInput). */
  readonly harvest: (step: number) => HarvestInput;
  /** Std-dev of position measurement noise injected into fixes (m). */
  readonly measurementNoiseStd: Metres;
  /**
   * Sensing cadence: a position fix (L update) is only available when
   * step % fixInterval === 0. Between fixes L only predicts.
   */
  readonly fixInterval: number;
}

export interface ActionCosts {
  readonly sleepW: Watts;
  readonly senseW: Watts;
  readonly senseS: Seconds;
  readonly computeW: Watts;
  readonly computeS: Seconds;
  readonly communicateW: Watts;
  readonly communicateS: Seconds;
}

export interface Scenario {
  readonly name: string;
  readonly description: string;
  readonly seed: number;
  readonly steps: number;
  readonly dt: Seconds;
  readonly initialMean: Vec4;
  readonly initialStoredJ: Joules;
  readonly localization: LConfig;
  readonly energy: EnergyConfig;
  readonly priors: readonly Hypothesis[];
  readonly scheduler: SchedulerConfig;
  readonly actions: ActionCosts;
  readonly environment: EnvironmentModel;
}

const baseLocalization: LConfig = {
  processNoise: 0.05,
  measurementStd: 1.5 as Metres,
  initialPosStd: 3.0 as Metres,
  initialVelStd: 0.5,
};

// Two competing hypotheses about the environment/model that K discriminates.
const basePriors: readonly Hypothesis[] = [
  { id: "los", label: "line-of-sight RF propagation", confidence: 0.5 },
  { id: "nlos", label: "non-line-of-sight / multipath", confidence: 0.5 },
];

// Illustrative action costs anchored to report §5-6 datasheet magnitudes.
const baseActions: ActionCosts = {
  sleepW: uW(1), // ~PMIC quiescent
  senseW: mW(0.5), // IMU + short RF listen (illustrative)
  senseS: 0.05 as Seconds,
  computeW: mW(26), // TinyML-class active (ETH KWS 26 mW)
  computeS: 0.007 as Seconds, // ~178 µJ / 26 mW
  communicateW: mW(15), // BLE active ~15 mW
  communicateS: 1.0 as Seconds, // one ~1 s radio event
};

/** Scenario (a): harvest-only intermittent — µW harvest, no battery buffer. */
export function harvestOnlyIntermittent(): Scenario {
  return {
    name: "harvest-only-intermittent",
    description:
      "Ambient-RF-only node with a small supercapacitor. ~8 µW favorable indoor DC harvest, " +
      "intermittent and occasionally interrupted. Illustrative (report §6.3a/b).",
    seed: 1,
    steps: 400,
    dt: 1.0 as Seconds,
    initialMean: [0, 0, 0, 0],
    initialStoredJ: 2.0e-3 as Joules,
    localization: baseLocalization,
    energy: {
      capacityJ: 1.0e-2 as Joules, // small supercap
      brownoutJ: 1.0e-3 as Joules,
      leakageW: uW(2), // supercap leakage (higher)
      quiescentW: uW(1),
      coldStartFloorW: uW(10),
    },
    priors: basePriors,
    scheduler: { energyNeutralHeadroomJ: 0 as Joules },
    actions: baseActions,
    environment: {
      trueVelocity: [0.2, 0.0],
      // Intermittent: harvest drops out periodically (e.g. body shadowing).
      harvest: (step): HarvestInput =>
        step % 20 < 14
          ? { harvestedDcW: uW(8), etaConverter: 0.85 }
          : { harvestedDcW: uW(0.5), etaConverter: 0.85 },
      measurementNoiseStd: 1.5 as Metres,
      fixInterval: 10,
    },
  };
}

/** Scenario (b): burst sensing with storage — accumulate then spend on a radio burst. */
export function burstSensingWithStorage(): Scenario {
  return {
    name: "burst-sensing-with-storage",
    description:
      "Node accumulates µW harvest into a supercap and spends it on periodic BLE bursts. " +
      "Demonstrates ~0.05% break-even duty cycle regime. Illustrative (report §6.3b).",
    seed: 2,
    steps: 600,
    dt: 1.0 as Seconds,
    initialMean: [0, 0, 0, 0],
    initialStoredJ: 5.0e-3 as Joules,
    localization: baseLocalization,
    energy: {
      capacityJ: 5.0e-2 as Joules,
      brownoutJ: 2.0e-3 as Joules,
      leakageW: uW(1),
      quiescentW: uW(1),
      coldStartFloorW: uW(10),
    },
    priors: basePriors,
    scheduler: { energyNeutralHeadroomJ: 0 as Joules },
    actions: baseActions,
    environment: {
      trueVelocity: [0.15, 0.1],
      harvest: (): HarvestInput => ({ harvestedDcW: uW(8), etaConverter: 0.9 }),
      measurementNoiseStd: 1.2 as Metres,
      fixInterval: 5,
    },
  };
}

/** Scenario (c): hybrid harvested + battery — larger buffer for higher cadence. */
export function hybridHarvestedPlusBattery(): Scenario {
  return {
    name: "hybrid-harvested-plus-battery",
    description:
      "Thin-film/LTO battery buffer plus RF harvest supports higher-cadence sensing and " +
      "occasional compute/comm bursts. Illustrative (report §6.3c).",
    seed: 3,
    steps: 800,
    dt: 1.0 as Seconds,
    initialMean: [0, 0, 0, 0],
    initialStoredJ: 0.5 as Joules,
    localization: baseLocalization,
    energy: {
      capacityJ: 5.0 as Joules, // battery-class buffer
      brownoutJ: 0.05 as Joules,
      leakageW: uW(0.1), // very low self-discharge (TFB/LTO)
      quiescentW: uW(1),
      coldStartFloorW: uW(10),
    },
    priors: basePriors,
    scheduler: { energyNeutralHeadroomJ: 0.02 as Joules },
    actions: baseActions,
    environment: {
      trueVelocity: [0.25, -0.1],
      harvest: (step): HarvestInput =>
        // Favorable outdoor/urban magnitude (26 µW) with mild variation.
        ({ harvestedDcW: uW(step % 50 < 40 ? 26 : 12), etaConverter: 0.9 }),
      measurementNoiseStd: 1.0 as Metres,
      fixInterval: 4,
    },
  };
}

export const SCENARIOS: Readonly<Record<string, () => Scenario>> = {
  "harvest-only-intermittent": harvestOnlyIntermittent,
  "burst-sensing-with-storage": burstSensingWithStorage,
  "hybrid-harvested-plus-battery": hybridHarvestedPlusBattery,
};

export function getScenario(name: string): Scenario {
  const factory = SCENARIOS[name];
  if (!factory) {
    throw new RangeError(
      `unknown scenario "${name}". Available: ${Object.keys(SCENARIOS).join(", ")}`,
    );
  }
  return factory();
}

// Illustrative constants used by the regression test / docs (report §6.3).
export const ILLUSTRATIVE = {
  indoorHarvestDcW: uW(8),
  bleActiveW: mW(15),
  kwsInferenceJ: uJ(178),
} as const;
