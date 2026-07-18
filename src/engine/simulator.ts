import type { RsdState, RsdTelemetry } from "../domain/state.js";
import { Rng } from "../rng.js";
import { type Watts } from "../domain/units.js";
import {
  createEnergyState,
  stepEnergy,
  type HarvestInput,
} from "../recursions/energy.js";
import {
  createKnowledgeState,
  expectedInfoGainBits,
  mapHypothesis,
  updateKnowledge,
  type Evidence,
} from "../recursions/knowledge.js";
import {
  createLocalizationState,
  predictLocalization,
  updateLocalization,
} from "../recursions/localization.js";
import {
  SLEEP_ACTION,
  selectAction,
  type Action,
  type SchedulerDecision,
} from "../scheduler/scheduler.js";
import type { Scenario } from "./scenario.js";

export interface SimulationResult {
  readonly scenario: string;
  readonly seed: number;
  readonly telemetry: readonly RsdTelemetry[];
  readonly final: RsdState;
  /** Summary aggregates useful for tests and CLI output. */
  readonly summary: {
    readonly steps: number;
    readonly actionCounts: Readonly<Record<string, number>>;
    readonly finalStoredJ: number;
    readonly brownoutSteps: number;
    readonly finalPositionError: number;
    readonly finalEntropy: number;
    readonly totalInfoGainBits: number;
  };
}

function norm2(v: readonly [number, number]): number {
  return Math.hypot(v[0], v[1]);
}

/**
 * Run a scenario deterministically. Given the same scenario (same seed), the
 * output is bit-for-bit reproducible: all stochastic inputs come from the
 * seeded Rng.
 */
export function runSimulation(scenario: Scenario): SimulationResult {
  const rng = new Rng(scenario.seed);
  const dt = scenario.dt;

  let L = createLocalizationState(scenario.localization, scenario.initialMean);
  let K = createKnowledgeState(scenario.priors);
  let E = createEnergyState(scenario.energy, scenario.initialStoredJ);

  const telemetry: RsdTelemetry[] = [];
  const actionCounts: Record<string, number> = {
    sleep: 0,
    sense: 0,
    compute: 0,
    communicate: 0,
  };
  let brownoutSteps = 0;
  let totalInfoGainBits = 0;

  // Ground-truth position tracked separately from the estimate.
  let trueX = scenario.initialMean[0];
  let trueY = scenario.initialMean[1];
  const [tvx, tvy] = scenario.environment.trueVelocity;

  for (let step = 0; step < scenario.steps; step++) {
    const timeS = step * dt;

    // --- L predict ---
    L = predictLocalization(scenario.localization, L, dt);

    // Advance ground truth.
    trueX += tvx * dt;
    trueY += tvy * dt;

    // --- Build candidate actions for the scheduler ---
    const a = scenario.actions;
    const fixAvailable = step % scenario.environment.fixInterval === 0;

    // Sensing yields an L fix; its EIG scales with current position uncertainty.
    const senseEig = fixAvailable ? Math.min(1, L.positionUncertainty / 5) * 2 : 0;
    // Compute (TinyML feature) yields a K info gain proportional to entropy.
    const computeEig = expectedInfoGainBits(K, 0.3);
    // Communicate: offloads/receives evidence; modest fixed EIG here.
    const commEig = expectedInfoGainBits(K, 0.15);

    const candidates: Action[] = [
      {
        kind: "sense",
        powerW: a.senseW,
        durationS: a.senseS,
        expectedInfoGainBits: senseEig,
      },
      {
        kind: "compute",
        powerW: a.computeW,
        durationS: a.computeS,
        expectedInfoGainBits: computeEig,
      },
      {
        kind: "communicate",
        powerW: a.communicateW,
        durationS: a.communicateS,
        expectedInfoGainBits: commEig,
      },
    ];

    const sleep = SLEEP_ACTION(a.sleepW, dt);
    const harvest: HarvestInput = scenario.environment.harvest(step);

    // Resolve harvest net power for the scheduler's energy-neutral guard.
    // (stepEnergy recomputes authoritatively; here we need netDcW only.)
    const netDcW = harvestNetW(harvest);

    const decision: SchedulerDecision = selectAction(
      scenario.scheduler,
      E,
      netDcW,
      candidates,
      sleep,
      dt,
    );

    // --- Apply the chosen action's effects on L and K ---
    let innovationNorm: number | null = null;
    if (decision.action.kind === "sense" && fixAvailable) {
      const noiseStd = scenario.environment.measurementNoiseStd;
      const zx = trueX + rng.gaussian(0, noiseStd);
      const zy = trueY + rng.gaussian(0, noiseStd);
      L = updateLocalization(scenario.localization, L, [zx, zy]);
      innovationNorm = L.innovation ? norm2(L.innovation) : null;

      // The innovation feeds K: a large normalized residual favors NLOS/multipath.
      const nis = L.nis ?? 0;
      const evidence: Evidence = nisToEvidence(nis, step);
      K = updateKnowledge(K, evidence);
      totalInfoGainBits += decision.action.expectedInfoGainBits;
    } else if (decision.action.kind === "compute") {
      // Compute refines K using a synthetic on-node feature; deterministic.
      const featureFavorsLos = rng.next() > 0.5;
      const evidence: Evidence = {
        likelihoods: featureFavorsLos ? { los: 1.4, nlos: 1.0 } : { los: 1.0, nlos: 1.4 },
        provenance: {
          source: "sim.compute.tinyml",
          step,
          reason: "on-node TinyML feature extraction refined model confidence",
        },
      };
      K = updateKnowledge(K, evidence);
      totalInfoGainBits += decision.action.expectedInfoGainBits;
    } else if (decision.action.kind === "communicate") {
      totalInfoGainBits += decision.action.expectedInfoGainBits;
    }

    // --- E step with the chosen action's active load ---
    // The action runs only for its own duration within the step; the remainder
    // of dt is idle (covered by quiescent/leakage). Convert to an average active
    // power over dt so the energy balance matches the scheduler's cost (P*dur).
    const activeW = (decision.costJ / dt) as Watts;
    const eStep = stepEnergy(scenario.energy, E, harvest, activeW, dt);
    E = eStep.state;
    if (E.brownedOut) brownoutSteps++;

    actionCounts[decision.action.kind] = (actionCounts[decision.action.kind] ?? 0) + 1;

    const map = mapHypothesis(K);
    telemetry.push({
      step,
      timeS,
      position: [L.mean[0], L.mean[1]],
      positionUncertainty: L.positionUncertainty,
      innovationNorm,
      nis: L.nis,
      mapHypothesis: map.id,
      mapConfidence: map.confidence,
      knowledgeEntropy: K.entropy,
      storedJ: E.storedJ,
      brownedOut: E.brownedOut,
      ledger: eStep.ledger,
      action: decision.action.kind,
      actionRationale: decision.rationale,
      efficiencyBitsPerJ: decision.efficiencyBitsPerJ,
    });
  }

  const finalPositionError = Math.hypot(
    L.mean[0] - trueX,
    L.mean[1] - trueY,
  );

  const final: RsdState = {
    step: scenario.steps,
    timeS: scenario.steps * dt,
    L,
    K,
    E,
  };

  return {
    scenario: scenario.name,
    seed: scenario.seed,
    telemetry,
    final,
    summary: {
      steps: scenario.steps,
      actionCounts,
      finalStoredJ: E.storedJ,
      brownoutSteps,
      finalPositionError,
      finalEntropy: K.entropy,
      totalInfoGainBits,
    },
  };
}

/** Net usable DC power from a harvest input, applying each efficiency once. */
function harvestNetW(input: HarvestInput): Watts {
  if ("harvestedDcW" in input) {
    return (input.harvestedDcW * input.etaConverter) as Watts;
  }
  return (input.rfIncidentW * input.etaRfToDc * input.etaConverter) as Watts;
}

/** Map a normalized innovation squared (NIS) to categorical evidence for K. */
function nisToEvidence(nis: number, step: number): Evidence {
  // Chi-square with 2 dof has mean 2; NIS >> 2 suggests model mismatch (NLOS).
  const nlosLike = nis > 2 ? Math.min(3, nis / 2) : 0.8;
  const losLike = nis <= 2 ? 1.2 : 0.8;
  return {
    likelihoods: { los: losLike, nlos: nlosLike },
    provenance: {
      source: "sim.localization.innovation",
      step,
      reason: `L innovation NIS=${nis.toFixed(2)} ${
        nis > 2 ? "exceeds" : "within"
      } expected (2 dof mean 2); updated propagation-model confidence`,
    },
  };
}
