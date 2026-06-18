/**
 * Command360 — Economic Model
 *
 * The single economic scoring model for the entire system. No other module may
 * compute an economic score. Economic score represents the cost of inaction:
 * regulatory exposure, revenue risk, or reputational impact.
 *
 * All scores are in [0, 1].
 */

/**
 * Score economic impact for a `bias_escalation` intervention.
 *
 * Regulatory and reputational exposure scales with severity:
 * - severity 4–5: 0.90 (critical — potential legal action)
 * - severity 3:   0.70 (significant — escalation required)
 * - severity 1–2: 0.40 (moderate — review needed)
 */
export function economicBiasEscalation(params: { severity: number }): number {
  if (params.severity >= 4) return 0.9;
  if (params.severity === 3) return 0.7;
  return 0.4;
}

/**
 * Score economic impact for a `fairness_gate_failure` intervention.
 *
 * A failed fairness gate signals systematic model bias. The regulatory,
 * reputational, and operational costs are uniformly high.
 *
 * Fixed: 0.95
 */
export function economicFairnessGateFailure(): number {
  return 0.95;
}

/**
 * Score economic impact for a `low_confidence_prediction` intervention.
 *
 * Low-confidence predictions at later stages carry higher economic risk because
 * more process investment has already been made and an offer may be imminent.
 *
 * - loop:   0.80 (highest — offer risk)
 * - tech:   0.60 (moderate — interview cycle cost)
 * - screen: 0.40 (lower — early-stage cost)
 */
export function economicLowConfidencePrediction(params: {
  stage: string;
}): number {
  if (params.stage === 'loop') return 0.8;
  if (params.stage === 'tech') return 0.6;
  return 0.4;
}
