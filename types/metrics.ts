export interface InterviewPrediction {
  candidateId: string;
  reqId: string;
  stage: 'screen' | 'tech' | 'loop';
  pSuccess: number;
  confidence: number;
  topFactors: string[];
  groupKey?: string;
}

export interface HireOutcome {
  personId: string;
  roleFamily: 'eng' | 'consulting' | 'ops';
  startDate: Date;
  rampDays?: number;
  retained12m?: boolean;
  perfScore?: number;
  utilization?: number;
  marginPct?: number;
  clientNps?: number;
  renewed?: boolean;
}

export interface FairnessMetrics {
  adverseImpactRatio: number;
  tprGap: number;
  fprGap: number;
  calibrationParity: number;
  cohortSize: number;
  pValue?: number;
  effectSize?: number;
}

export interface ModelEvaluation {
  rocAuc: number;
  prAuc: number;
  brierScore: number;
  ece: number; // Expected Calibration Error
  liftAt10: number;
  liftAt20: number;
  fairnessMetrics: FairnessMetrics;
  sampleSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface QualityOfHire {
  score: number;
  components: Record<string, number>;
  version: string;
  roleFamily: string;
  sampleSize: number;
}
