import type { EnergyState } from "../recursions/energy.js";
import type { KnowledgeState } from "../recursions/knowledge.js";
import type { LocalizationState } from "../recursions/localization.js";
import type { SchedulerDecision } from "../scheduler/scheduler.js";
import type { EnergyLedger } from "../recursions/energy.js";

/**
 * The coupled RSD state: L (localization), K (knowledge), E (energy).
 * This is the object threaded through the deterministic engine each step.
 */
export interface RsdState {
  readonly step: number;
  readonly timeS: number;
  readonly L: LocalizationState;
  readonly K: KnowledgeState;
  readonly E: EnergyState;
}

/** Compact per-step telemetry for UI / CLI / tests. */
export interface RsdTelemetry {
  readonly step: number;
  readonly timeS: number;
  // L
  readonly position: readonly [number, number];
  readonly positionUncertainty: number;
  readonly innovationNorm: number | null;
  readonly nis: number | null;
  // K
  readonly mapHypothesis: string;
  readonly mapConfidence: number;
  readonly knowledgeEntropy: number;
  // E
  readonly storedJ: number;
  readonly brownedOut: boolean;
  readonly ledger: EnergyLedger;
  // scheduler
  readonly action: SchedulerDecision["action"]["kind"];
  readonly actionRationale: string;
  readonly efficiencyBitsPerJ: number;
}
