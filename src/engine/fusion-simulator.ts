import { Rng } from "../rng.js";
import {
  type Dbm,
  type Seconds,
  type Watts,
  wrapAngle,
} from "../domain/units.js";
import {
  createEnergyState,
  stepEnergy,
  type EnergyLedger,
  type HarvestInput,
} from "../recursions/energy.js";
import {
  createKnowledgeState,
  mapHypothesis,
  updateKnowledge,
  type Evidence,
  type KnowledgeState,
} from "../recursions/knowledge.js";
import {
  createFusedState,
  fusedStep,
  IDX,
  type FusedLocalizationState,
  type FusedStepDiagnostics,
} from "../recursions/fusion.js";
import { synthesizeImuSample, type ImuSample } from "../recursions/imu.js";
import type { Beacon, RssiObservation } from "../recursions/ble.js";
import {
  SLEEP_ACTION,
  selectAction,
  type Action,
  type SchedulerDecision,
} from "../scheduler/scheduler.js";
import type { FusionScenario } from "./fusion-scenario.js";

export interface FusionRunOptions {
  /**
   * When false, BLE range measurements are still synthesized and still cost
   * energy, but are NOT fused into the state (pure IMU dead reckoning). Used by
   * the comparative regression to isolate the localization benefit of BLE.
   * Defaults to true.
   */
  readonly applyBle?: boolean;
}

export interface FusionTelemetryRow {
  readonly step: number;
  readonly timeS: number;
  readonly estPosition: readonly [number, number];
  readonly truePosition: readonly [number, number];
  readonly positionError: number;
  readonly positionUncertainty: number;
  readonly estYaw: number;
  readonly trueYaw: number;
  readonly imuPredictions: number;
  readonly zuptApplied: boolean;
  readonly bleAccepted: number;
  readonly bleRejected: number;
  readonly bleScanAttempted: boolean;
  readonly bleScanPerformed: boolean;
  /** Mean NIS of accepted BLE updates this step, null if none. */
  readonly meanAcceptedNis: number | null;
  readonly mapHypothesis: string;
  readonly mapConfidence: number;
  readonly storedJ: number;
  readonly brownedOut: boolean;
  readonly action: SchedulerDecision["action"]["kind"];
  readonly ledger: EnergyLedger;
}

export interface FusionSummary {
  readonly steps: number;
  /** Root-mean-square position error over the whole run (m). */
  readonly positionRmse: number;
  readonly finalPositionError: number;
  readonly maxPositionError: number;
  readonly bleScansAttempted: number;
  readonly bleScansPerformed: number;
  readonly bleScansSkippedForEnergy: number;
  readonly bleAcceptedTotal: number;
  readonly bleRejectedTotal: number;
  /** Rejected-BLE breakdown by reason. */
  readonly bleRejectReasons: Readonly<Record<string, number>>;
  readonly zuptCount: number;
  readonly imuPredictionCount: number;
  readonly brownoutSteps: number;
  readonly finalStoredJ: number;
  readonly finalEntropy: number;
  readonly finalMapHypothesis: string;
  readonly finalMapConfidence: number;
}

export interface FusionResult {
  readonly scenario: string;
  readonly seed: number;
  readonly applyBle: boolean;
  readonly telemetry: readonly FusionTelemetryRow[];
  readonly finalState: FusedLocalizationState;
  readonly knowledge: KnowledgeState;
  readonly summary: FusionSummary;
}

interface TruthState {
  px: number;
  py: number;
  vx: number;
  vy: number;
  yaw: number;
}

/** Integrate ground truth with the same discrete model the filter predicts with. */
function integrateTruth(t: TruthState, ax: number, ay: number, w: number, dt: number): void {
  const c = Math.cos(t.yaw);
  const s = Math.sin(t.yaw);
  const awx = c * ax - s * ay;
  const awy = s * ax + c * ay;
  t.px += t.vx * dt + 0.5 * awx * dt * dt;
  t.py += t.vy * dt + 0.5 * awy * dt * dt;
  t.vx += awx * dt;
  t.vy += awy * dt;
  t.yaw = wrapAngle(t.yaw + w * dt);
}

function netHarvestW(input: HarvestInput): Watts {
  if ("harvestedDcW" in input) return (input.harvestedDcW * input.etaConverter) as Watts;
  return (input.rfIncidentW * input.etaRfToDc * input.etaConverter) as Watts;
}

/**
 * Synthesize BLE observations for a scan at the true position. Beacons beyond
 * the visibility range are silent; each heard beacon yields an RSSI from the
 * log-distance model plus optional NLoS excess loss and white noise.
 */
function synthesizeScan(
  scenario: FusionScenario,
  step: number,
  truth: TruthState,
  rng: Rng,
): RssiObservation[] {
  const obs: RssiObservation[] = [];
  const { refRssiDbm, pathLossExponent } = scenario.fused.ble;
  const timeS = (step * scenario.dt) as Seconds;
  for (const b of scenario.beacons) {
    const d = Math.hypot(truth.px - b.position[0], truth.py - b.position[1]);
    if (d > scenario.ble.visibilityRangeM) continue;
    const excess = scenario.ble.nlosExcessDb(step, b.id);
    const dEff = Math.max(d, 0.1);
    const meanRssi = refRssiDbm - 10 * pathLossExponent * Math.log10(dEff) - excess;
    const rssi = meanRssi + rng.gaussian(0, scenario.ble.rssiNoiseStd);
    obs.push({ timeS, beaconId: b.id, rssiDbm: rssi as Dbm });
  }
  return obs;
}

/** Categorical evidence for K from this step's BLE fusion outcome. */
function bleEvidence(diag: FusedStepDiagnostics, step: number): Evidence | null {
  if (diag.bleAccepted === 0 && diag.bleRejected === 0) return null;
  const gated = diag.ble.filter((d) => d.reason === "nis-gate").length;
  // Accepted, well-fitting ranges favor LoS; NIS-gated outliers favor NLoS.
  // Repeated scans observe the same beacons, so they are NOT independent trials:
  // we deliberately keep per-step likelihood ratios small (and saturate the
  // per-step accepted/gated counts) so the posterior climbs toward — but never
  // pins at — certainty. K confidence should reflect strong-but-fallible belief,
  // not an artificial 1.0 (report §4: K must stay honestly uncertain).
  const losLike = 1 + 0.02 * Math.min(diag.bleAccepted, 4);
  const nlosLike = 1 + 0.25 * Math.min(gated, 4);
  return {
    likelihoods: { los: losLike, nlos: nlosLike },
    provenance: {
      source: "sim.fusion.ble",
      step,
      reason: `BLE fusion: ${diag.bleAccepted} accepted, ${gated} NIS-gated (NLoS/outlier), ${diag.bleRejected} rejected total`,
    },
  };
}

/** Run the fused BLE+IMU scenario deterministically. */
export function runFusionSimulation(
  scenario: FusionScenario,
  options: FusionRunOptions = {},
): FusionResult {
  const applyBle = options.applyBle ?? true;
  const rng = new Rng(scenario.seed);
  const imuRng = rng.fork(1);
  const bleRng = rng.fork(2);
  const dt = scenario.dt;

  let fused = createFusedState(scenario.fused, scenario.initialTrue);
  let K = createKnowledgeState(scenario.priors);
  let E = createEnergyState(scenario.energy, scenario.initialStoredJ);

  const truth: TruthState = {
    px: scenario.initialTrue[0],
    py: scenario.initialTrue[1],
    vx: scenario.initialTrue[2],
    vy: scenario.initialTrue[3],
    yaw: scenario.initialTrue[4],
  };

  const beaconMap = new Map<string, Beacon>(scenario.beacons.map((b) => [b.id, b]));

  const telemetry: FusionTelemetryRow[] = [];
  const rejectReasons: Record<string, number> = {};
  let sumSqErr = 0;
  let maxErr = 0;
  let scansAttempted = 0;
  let scansPerformed = 0;
  let scansSkipped = 0;
  let acceptedTotal = 0;
  let rejectedTotal = 0;
  let zuptCount = 0;
  let imuPredictionCount = 0;
  let brownoutSteps = 0;

  const imuActiveJ = scenario.actions.imuActiveW * dt;
  const scanCostJ = scenario.actions.bleScanW * scenario.actions.bleScanS;

  for (let step = 0; step < scenario.steps; step++) {
    // --- Ground truth advances with the clean motion command. ---
    const cmd = scenario.motion(step);
    integrateTruth(truth, cmd.bodyAccel[0], cmd.bodyAccel[1], cmd.yawRate, dt);

    // --- IMU sample (biased + noisy) from the clean command. ---
    const imuSample: ImuSample = synthesizeImuSample(
      scenario.fused.imu,
      (step * dt) as Seconds,
      cmd.bodyAccel,
      cmd.yawRate,
      imuRng,
    );

    // --- Decide whether a BLE scan happens (cadence + energy feasibility). ---
    const scanDue =
      step % scenario.ble.scanInterval === 0 && !scenario.ble.isScanDropout(step);
    let scanPerformed = false;
    if (scanDue) scansAttempted++;

    const harvest = scenario.harvest(step);
    const netDcW = netHarvestW(harvest);

    if (scanDue) {
      const scanAction: Action = {
        kind: "sense",
        powerW: scenario.actions.bleScanW,
        durationS: scenario.actions.bleScanS,
        expectedInfoGainBits: 1, // a scan is information-positive
      };
      const sleep = SLEEP_ACTION(scenario.actions.sleepW, dt);
      const decision = selectAction(
        scenario.scheduler,
        E,
        netDcW,
        [scanAction],
        sleep,
        dt,
      );
      if (decision.action.kind === "sense") scanPerformed = true;
      else scansSkipped++;
    }

    // --- Synthesize the scan (only if performed) and run the fused L step. ---
    const bleObservations: RssiObservation[] =
      scanPerformed ? synthesizeScan(scenario, step, truth, bleRng) : [];

    const stepResult = fusedStep(scenario.fused, fused, {
      imuSample,
      bleObservations: applyBle ? bleObservations : [],
      beacons: beaconMap,
      dt,
    });
    fused = stepResult.state;
    const diag = stepResult.diagnostics;
    imuPredictionCount += diag.imuPredictions;
    if (diag.zuptApplied) zuptCount++;
    acceptedTotal += diag.bleAccepted;
    rejectedTotal += diag.bleRejected;
    for (const d of diag.ble) {
      if (!d.accepted && d.reason) rejectReasons[d.reason] = (rejectReasons[d.reason] ?? 0) + 1;
    }
    const acceptedNis = diag.ble.filter((d) => d.accepted && d.nis !== null).map((d) => d.nis!);
    const meanAcceptedNis =
      acceptedNis.length > 0 ? acceptedNis.reduce((a, x) => a + x, 0) / acceptedNis.length : null;

    // --- Feed BLE/IMU fusion evidence into K provenance (audited path). ---
    const evidence = bleEvidence(diag, step);
    if (evidence) K = updateKnowledge(K, evidence);

    // --- Energy: IMU always-on + BLE scan cost if performed. ---
    const activeW = ((imuActiveJ + (scanPerformed ? scanCostJ : 0)) / dt) as Watts;
    const eStep = stepEnergy(scenario.energy, E, harvest, activeW, dt);
    E = eStep.state;
    if (E.brownedOut) brownoutSteps++;
    if (scanPerformed) scansPerformed++;

    // --- Metrics + telemetry. ---
    const ex = fused.mean[IDX.px]! - truth.px;
    const ey = fused.mean[IDX.py]! - truth.py;
    const err = Math.hypot(ex, ey);
    sumSqErr += err * err;
    if (err > maxErr) maxErr = err;

    const map = mapHypothesis(K);
    telemetry.push({
      step,
      timeS: step * dt,
      estPosition: [fused.mean[IDX.px]!, fused.mean[IDX.py]!],
      truePosition: [truth.px, truth.py],
      positionError: err,
      positionUncertainty: fused.positionUncertainty,
      estYaw: fused.yaw,
      trueYaw: truth.yaw,
      imuPredictions: diag.imuPredictions,
      zuptApplied: diag.zuptApplied,
      bleAccepted: diag.bleAccepted,
      bleRejected: diag.bleRejected,
      bleScanAttempted: scanDue,
      bleScanPerformed: scanPerformed,
      meanAcceptedNis,
      mapHypothesis: map.id,
      mapConfidence: map.confidence,
      storedJ: E.storedJ,
      brownedOut: E.brownedOut,
      action: scanPerformed ? "sense" : "sleep",
      ledger: eStep.ledger,
    });
  }

  const finalErr = telemetry.length > 0 ? telemetry[telemetry.length - 1]!.positionError : 0;
  const map = mapHypothesis(K);

  return {
    scenario: scenario.name,
    seed: scenario.seed,
    applyBle,
    telemetry,
    finalState: fused,
    knowledge: K,
    summary: {
      steps: scenario.steps,
      positionRmse: Math.sqrt(sumSqErr / Math.max(1, scenario.steps)),
      finalPositionError: finalErr,
      maxPositionError: maxErr,
      bleScansAttempted: scansAttempted,
      bleScansPerformed: scansPerformed,
      bleScansSkippedForEnergy: scansSkipped,
      bleAcceptedTotal: acceptedTotal,
      bleRejectedTotal: rejectedTotal,
      bleRejectReasons: rejectReasons,
      zuptCount,
      imuPredictionCount,
      brownoutSteps,
      finalStoredJ: E.storedJ,
      finalEntropy: K.entropy,
      finalMapHypothesis: map.id,
      finalMapConfidence: map.confidence,
    },
  };
}
