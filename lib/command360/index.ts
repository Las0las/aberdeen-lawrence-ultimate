/**
 * Command360 — Canonical Intervention360 Registry
 *
 * This is the SOLE ranking and prioritization authority in the system.
 *
 * Constitutional rules enforced here:
 * 1. All Intervention360 records are produced, scored, and ranked only here.
 * 2. No UI surface or API handler may generate, score, or rank work.
 * 3. All work surfaces read ranked interventions via `getInterventions()` and
 *    render them as filtered projections.
 * 4. Economic scoring originates from a single model (economicModel.ts).
 * 5. Urgency scoring originates from a single model (urgencyModel.ts).
 * 6. Ranking is performed by a single engine (rankingEngine.ts).
 *
 * Data sources:
 * - BiasEvent          → 'bias_escalation'        → 'escalations' surface
 * - FairnessGateRun    → 'fairness_gate_failure'   → 'analytics' surface
 * - InterviewPrediction → 'low_confidence_prediction' → 'pipeline_actions' surface
 */

import { prisma } from '@/lib/db';
import type { Intervention360, InterventionSurface } from '@/types/intervention360';
import {
  urgencyBiasEscalation,
  urgencyFairnessGateFailure,
  urgencyLowConfidencePrediction,
} from './urgencyModel';
import {
  economicBiasEscalation,
  economicFairnessGateFailure,
  economicLowConfidencePrediction,
} from './economicModel';
import { rank } from './rankingEngine';

// ---------------------------------------------------------------------------
// Internal record builders
// ---------------------------------------------------------------------------

function buildBiasEscalationIntervention(event: {
  id: string;
  severity: number;
  adjudicated: boolean;
  sessionId: string;
  eventType: string;
  details: unknown;
  createdAt: Date;
}): Omit<Intervention360, 'rank'> {
  return {
    id: `BiasEvent:${event.id}`,
    kind: 'bias_escalation',
    surface: 'escalations',
    urgencyScore: urgencyBiasEscalation({
      severity: event.severity,
      adjudicated: event.adjudicated,
      createdAt: event.createdAt,
    }),
    economicScore: economicBiasEscalation({ severity: event.severity }),
    sourceId: event.id,
    sourceKind: 'BiasEvent',
    payload: {
      sessionId: event.sessionId,
      eventType: event.eventType,
      severity: event.severity,
      adjudicated: event.adjudicated,
      details: event.details,
    },
    createdAt: event.createdAt,
  };
}

function buildFairnessGateIntervention(gate: {
  id: string;
  window: string;
  cohortSize: number;
  airMin: number;
  tprGapMax: number;
  fprGapMax: number;
  status: string;
  createdAt: Date;
}): Omit<Intervention360, 'rank'> {
  return {
    id: `FairnessGateRun:${gate.id}`,
    kind: 'fairness_gate_failure',
    surface: 'analytics',
    urgencyScore: urgencyFairnessGateFailure(),
    economicScore: economicFairnessGateFailure(),
    sourceId: gate.id,
    sourceKind: 'FairnessGateRun',
    payload: {
      window: gate.window,
      cohortSize: gate.cohortSize,
      airMin: gate.airMin,
      tprGapMax: gate.tprGapMax,
      fprGapMax: gate.fprGapMax,
      status: gate.status,
    },
    createdAt: gate.createdAt,
  };
}

/** Confidence threshold below which a prediction becomes an intervention. */
const LOW_CONFIDENCE_THRESHOLD = 0.7;

function buildLowConfidenceIntervention(prediction: {
  id: string;
  candidateId: string;
  reqId: string;
  stage: string;
  pSuccess: number;
  confidence: number;
  modelVersion: string;
  createdAt: Date;
}): Omit<Intervention360, 'rank'> {
  return {
    id: `InterviewPrediction:${prediction.id}`,
    kind: 'low_confidence_prediction',
    surface: 'pipeline_actions',
    urgencyScore: urgencyLowConfidencePrediction({
      confidence: prediction.confidence,
      stage: prediction.stage,
    }),
    economicScore: economicLowConfidencePrediction({ stage: prediction.stage }),
    sourceId: prediction.id,
    sourceKind: 'InterviewPrediction',
    payload: {
      candidateId: prediction.candidateId,
      reqId: prediction.reqId,
      stage: prediction.stage,
      pSuccess: prediction.pSuccess,
      confidence: prediction.confidence,
      modelVersion: prediction.modelVersion,
    },
    createdAt: prediction.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetInterventionsOptions {
  /**
   * Filter to a specific surface.
   * If omitted, all surfaces are returned (used for global ranking).
   */
  surface?: InterventionSurface;
  /** Maximum number of interventions to return. Defaults to 50. */
  limit?: number;
}

/**
 * Retrieve ranked Intervention360 records from the canonical registry.
 *
 * This is the ONLY function that produces ranked work for any surface.
 * Callers must not re-sort, re-score, or re-prioritize the returned list.
 */
export async function getInterventions(
  opts: GetInterventionsOptions = {}
): Promise<Intervention360[]> {
  const limit = opts.limit ?? 50;
  const surface = opts.surface;

  const unranked: Omit<Intervention360, 'rank'>[] = [];

  // --- Source 1: BiasEvent → bias_escalation → escalations surface ---
  if (!surface || surface === 'escalations') {
    const events = await prisma.biasEvent.findMany({
      where: { adjudicated: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    for (const event of events) {
      unranked.push(buildBiasEscalationIntervention(event));
    }
  }

  // --- Source 2: FairnessGateRun → fairness_gate_failure → analytics surface ---
  if (!surface || surface === 'analytics') {
    const gates = await prisma.fairnessGateRun.findMany({
      where: { status: 'fail' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    for (const gate of gates) {
      unranked.push(buildFairnessGateIntervention(gate));
    }
  }

  // --- Source 3: InterviewPrediction → low_confidence_prediction → pipeline_actions ---
  if (!surface || surface === 'pipeline_actions') {
    const predictions = await prisma.interviewPrediction.findMany({
      where: { confidence: { lt: LOW_CONFIDENCE_THRESHOLD } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    for (const prediction of predictions) {
      unranked.push(buildLowConfidenceIntervention(prediction));
    }
  }

  // Apply the single ranking engine. Ranks are surface-local when a surface
  // filter is provided, global when all surfaces are requested.
  const ranked = rank(unranked);

  // Respect the limit after ranking so callers get the top-N by priority.
  return ranked.slice(0, limit);
}
