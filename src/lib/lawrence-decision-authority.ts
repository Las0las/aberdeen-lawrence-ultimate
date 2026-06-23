export type DecisionAuthority = "lawrence" | "surface" | "external";

export type SurfaceEvidenceKind =
  | "workflow"
  | "pipeline"
  | "coverage"
  | "revenue"
  | "governance"
  | "lifecycle"
  | "record";

export interface LawrenceDecisionAuthority {
  authority: "lawrence";
  label: "Lawrence Decision";
  rule: "Only Lawrence synthesizes decisions";
}

export interface SurfaceAssessmentAuthority {
  authority: "surface";
  label: "Evidence Assessment";
  rule: "Surface provides evidence, not final decision authority";
}

export interface EvidenceBackedDecisionInput {
  id: string;
  title: string;
  sourceSurface: string;
  evidenceKind: SurfaceEvidenceKind;
  reason: string;
  expectedOutcome?: string;
  actionLabel?: string;
}

export interface LawrenceDecisionProjection {
  id: string;
  title: string;
  authority: LawrenceDecisionAuthority;
  situation: string;
  decision: string;
  evidence: {
    kind: SurfaceEvidenceKind;
    sourceSurface: string;
    reason: string;
  }[];
  expectedOutcome: string | null;
  actions: string[];
}

export interface SurfaceAssessmentProjection {
  id: string;
  title: string;
  authority: SurfaceAssessmentAuthority;
  evidenceKind: SurfaceEvidenceKind;
  sourceSurface: string;
  reason: string;
  expectedOutcome: string | null;
  actionLabel: string | null;
}

export function getLawrenceDecisionAuthority(): LawrenceDecisionAuthority {
  return {
    authority: "lawrence",
    label: "Lawrence Decision",
    rule: "Only Lawrence synthesizes decisions",
  };
}

export function getSurfaceAssessmentAuthority(): SurfaceAssessmentAuthority {
  return {
    authority: "surface",
    label: "Evidence Assessment",
    rule: "Surface provides evidence, not final decision authority",
  };
}

export function toSurfaceAssessment(
  input: EvidenceBackedDecisionInput,
): SurfaceAssessmentProjection {
  return {
    id: input.id,
    title: input.title,
    authority: getSurfaceAssessmentAuthority(),
    evidenceKind: input.evidenceKind,
    sourceSurface: input.sourceSurface,
    reason: input.reason,
    expectedOutcome: input.expectedOutcome ?? null,
    actionLabel: input.actionLabel ?? null,
  };
}

export function synthesizeLawrenceDecision(
  inputs: EvidenceBackedDecisionInput[],
): LawrenceDecisionProjection | null {
  if (inputs.length === 0) return null;

  const first = inputs[0];

  return {
    id: `lawrence-${first.id}`,
    title: first.title,
    authority: getLawrenceDecisionAuthority(),
    situation: first.reason,
    decision: first.title,
    evidence: inputs.map((input) => ({
      kind: input.evidenceKind,
      sourceSurface: input.sourceSurface,
      reason: input.reason,
    })),
    expectedOutcome: first.expectedOutcome ?? null,
    actions: inputs
      .map((input) => input.actionLabel)
      .filter((action): action is string => Boolean(action)),
  };
}
