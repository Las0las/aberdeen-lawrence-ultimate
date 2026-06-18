/**
 * Canonical Intervention360 contract.
 *
 * Constitutional rule: only Command360 may produce, rank, score, or set urgency
 * on Intervention360 records. No UI surface or API handler is permitted to
 * generate, rank, or prioritize work independently.
 *
 * All work-producing surfaces (Escalations, Analytics, Pipeline Actions, etc.)
 * must read from the Intervention360 Registry via Command360 and render the
 * result as a filtered projection. They must not derive their own priority or
 * urgency values.
 */

/** The kind of work represented by an Intervention360. */
export type InterventionKind =
  | 'bias_escalation'        // Unresolved bias event requiring human review
  | 'fairness_gate_failure'  // Failed fairness gate requiring action
  | 'low_confidence_prediction'; // Model prediction below confidence threshold

/** The UI surface to which this intervention is routed. */
export type InterventionSurface =
  | 'escalations'      // Bias event review queue
  | 'analytics'        // Fairness analytics / model-health queue
  | 'pipeline_actions'; // Interview pipeline action queue

/** The originating Prisma model that gave rise to this intervention. */
export type InterventionSourceKind =
  | 'BiasEvent'
  | 'FairnessGateRun'
  | 'InterviewPrediction';

/**
 * A single unit of work in the Intervention360 Registry.
 *
 * All numeric scores are in the range [0, 1].
 * `rank` is an ordinal integer (1 = highest priority) assigned exclusively by
 * the Command360 ranking engine.
 */
export interface Intervention360 {
  /** Stable identifier derived from sourceKind + sourceId. */
  id: string;

  /** Category of work this intervention represents. */
  kind: InterventionKind;

  /** The surface this intervention is routed to. */
  surface: InterventionSurface;

  /**
   * Urgency score in [0, 1].
   * Produced solely by the Command360 urgency model.
   * Higher = more time-sensitive.
   */
  urgencyScore: number;

  /**
   * Economic impact score in [0, 1].
   * Produced solely by the Command360 economic model.
   * Higher = greater business or regulatory cost of inaction.
   */
  economicScore: number;

  /**
   * Ordinal rank across all interventions on the same surface (1 = top priority).
   * Assigned exclusively by the Command360 ranking engine.
   */
  rank: number;

  /** Primary key of the originating source record. */
  sourceId: string;

  /** Prisma model name of the originating source. */
  sourceKind: InterventionSourceKind;

  /** Domain-specific payload from the source record (read-only projection). */
  payload: Record<string, unknown>;

  /** When the source record was created. */
  createdAt: Date;
}
