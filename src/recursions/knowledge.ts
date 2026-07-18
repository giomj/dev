import { isFiniteNumber } from "../domain/units.js";

/**
 * K state — knowledge / model state (report §4).
 *
 * Maintains a set of competing hypotheses with normalized confidence
 * (a categorical posterior). Evidence updates the posterior via a
 * Bayesian-style likelihood multiply + renormalize. Every revision records
 * provenance (why it happened, what evidence, from where) so K is auditable and
 * reproducible — a requirement the report stresses repeatedly for agentic K.
 */

export interface Hypothesis {
  readonly id: string;
  readonly label: string;
  /** Posterior confidence in [0,1]; confidences across hypotheses sum to 1. */
  readonly confidence: number;
}

/** Where a piece of evidence came from — feeds provenance. */
export interface EvidenceProvenance {
  /** Adapter/source identifier, e.g. "academic", "web", "sim.localization". */
  readonly source: string;
  /** Optional external URL / citation. */
  readonly citation?: string;
  /** Simulation step at which the evidence was applied. */
  readonly step: number;
  /** Free-form note on why the revision occurred. */
  readonly reason: string;
}

/** One evidence application: per-hypothesis likelihoods (unnormalized, >= 0). */
export interface Evidence {
  /** Map of hypothesis id -> likelihood of the evidence under that hypothesis. */
  readonly likelihoods: Readonly<Record<string, number>>;
  readonly provenance: EvidenceProvenance;
}

export interface KnowledgeRevision {
  readonly step: number;
  readonly source: string;
  readonly reason: string;
  readonly citation?: string;
  /** Confidence vector before and after, keyed by hypothesis id. */
  readonly before: Readonly<Record<string, number>>;
  readonly after: Readonly<Record<string, number>>;
  /** Shannon entropy (bits) before and after — a scalar uncertainty measure. */
  readonly entropyBefore: number;
  readonly entropyAfter: number;
}

export interface KnowledgeState {
  readonly hypotheses: readonly Hypothesis[];
  /** Ordered log of every revision, for provenance/audit. */
  readonly provenance: readonly KnowledgeRevision[];
  /** Current Shannon entropy of the posterior (bits) — the K uncertainty scalar. */
  readonly entropy: number;
}

function entropyBits(confidences: readonly number[]): number {
  let h = 0;
  for (const p of confidences) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

function toRecord(hyps: readonly Hypothesis[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of hyps) out[h.id] = h.confidence;
  return out;
}

export function validateKnowledgePriors(hyps: readonly Hypothesis[]): void {
  if (hyps.length === 0) throw new RangeError("at least one hypothesis is required");
  const ids = new Set<string>();
  let sum = 0;
  for (const h of hyps) {
    if (!h.id) throw new RangeError("hypothesis id must be non-empty");
    if (ids.has(h.id)) throw new RangeError(`duplicate hypothesis id: ${h.id}`);
    ids.add(h.id);
    if (!isFiniteNumber(h.confidence) || h.confidence < 0)
      throw new RangeError(`hypothesis ${h.id} confidence must be finite and >= 0`);
    sum += h.confidence;
  }
  if (sum <= 0) throw new RangeError("prior confidences must sum to a positive value");
}

export function createKnowledgeState(priors: readonly Hypothesis[]): KnowledgeState {
  validateKnowledgePriors(priors);
  const sum = priors.reduce((a, h) => a + h.confidence, 0);
  const hypotheses = priors.map((h) => ({ ...h, confidence: h.confidence / sum }));
  return {
    hypotheses,
    provenance: [],
    entropy: entropyBits(hypotheses.map((h) => h.confidence)),
  };
}

/**
 * Apply evidence via Bayes: posterior ∝ prior * likelihood, then renormalize.
 * Records a provenance entry describing the revision. Hypotheses with no listed
 * likelihood keep a neutral likelihood of 1 (evidence is uninformative for them).
 */
export function updateKnowledge(state: KnowledgeState, evidence: Evidence): KnowledgeState {
  const before = toRecord(state.hypotheses);
  const entropyBefore = state.entropy;

  const unnormalized = state.hypotheses.map((h) => {
    const like = evidence.likelihoods[h.id];
    const l = like === undefined ? 1 : like;
    if (!isFiniteNumber(l) || l < 0)
      throw new RangeError(`likelihood for ${h.id} must be finite and >= 0`);
    return h.confidence * l;
  });

  const sum = unnormalized.reduce((a, x) => a + x, 0);
  if (sum <= 0)
    throw new RangeError("evidence drove all posterior mass to zero; check likelihoods");

  const hypotheses = state.hypotheses.map((h, i) => ({
    ...h,
    confidence: unnormalized[i]! / sum,
  }));
  const after = toRecord(hypotheses);
  const entropyAfter = entropyBits(hypotheses.map((h) => h.confidence));

  const revision: KnowledgeRevision = {
    step: evidence.provenance.step,
    source: evidence.provenance.source,
    reason: evidence.provenance.reason,
    ...(evidence.provenance.citation !== undefined
      ? { citation: evidence.provenance.citation }
      : {}),
    before,
    after,
    entropyBefore,
    entropyAfter,
  };

  return {
    hypotheses,
    provenance: [...state.provenance, revision],
    entropy: entropyAfter,
  };
}

/** The most likely current hypothesis (MAP estimate). */
export function mapHypothesis(state: KnowledgeState): Hypothesis {
  return state.hypotheses.reduce((best, h) => (h.confidence > best.confidence ? h : best));
}

/**
 * Expected information gain (bits) that a measurement of given diagnosticity
 * would yield, approximated as the reduction toward zero entropy scaled by the
 * measurement's informativeness in [0,1]. Used by the scheduler for EIG/joule.
 * This is an illustrative acquisition proxy, not a calibrated Fisher-information
 * computation.
 */
export function expectedInfoGainBits(state: KnowledgeState, informativeness: number): number {
  if (!isFiniteNumber(informativeness) || informativeness < 0 || informativeness > 1)
    throw new RangeError("informativeness must be in [0,1]");
  return state.entropy * informativeness;
}
