/**
 * Command360 — Urgency Model
 *
 * The single urgency model for the entire system. No other module may compute
 * an urgency score. Urgency represents time-sensitivity: how quickly inaction
 * compounds risk.
 *
 * All scores are in [0, 1].
 */

const MAX_AGE_CONTRIBUTION = 0.3;
const AGE_RATE_PER_DAY = 0.02;

function ageContribution(createdAt: Date): number {
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.min(ageDays * AGE_RATE_PER_DAY, MAX_AGE_CONTRIBUTION);
}

/**
 * Score urgency for a `bias_escalation` intervention.
 *
 * Components:
 * - Base: severity / 5 (range 0.2 – 1.0 for severity 1–5)
 * - Age contribution: 0.02 per day elapsed, capped at 0.30
 * - Pending bonus: +0.10 if not yet adjudicated (still open)
 *
 * Final score is clamped to [0, 1].
 */
export function urgencyBiasEscalation(params: {
  severity: number;
  adjudicated: boolean;
  createdAt: Date;
}): number {
  const base = params.severity / 5;
  const pending = params.adjudicated ? 0 : 0.1;
  const age = ageContribution(params.createdAt);
  return Math.min(1, base + pending + age);
}

/**
 * Score urgency for a `fairness_gate_failure` intervention.
 *
 * Gate failures carry high fixed urgency because they signal systemic model
 * risk. Age is not factored in — a historical failure does not become less
 * urgent simply because time has passed.
 *
 * Base: 0.85
 */
export function urgencyFairnessGateFailure(): number {
  return 0.85;
}

/**
 * Score urgency for a `low_confidence_prediction` intervention.
 *
 * Components:
 * - Base: (1 - confidence) * 0.7  — lower confidence → higher urgency
 * - Stage multiplier: loop ×1.4, tech ×1.2, screen ×1.0
 *
 * Final score is clamped to [0, 1].
 */
export function urgencyLowConfidencePrediction(params: {
  confidence: number;
  stage: string;
}): number {
  const stageMultiplier =
    params.stage === 'loop' ? 1.4 :
    params.stage === 'tech' ? 1.2 :
    1.0;
  const base = (1 - params.confidence) * 0.7;
  return Math.min(1, base * stageMultiplier);
}
