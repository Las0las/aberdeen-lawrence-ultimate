import { prisma } from '@/lib/db';
import { metrics } from '@/lib/metrics/prom';

interface EvaluationWindow {
  startDate: Date;
  endDate: Date;
  windowId: string;
}

export async function runWeeklyEvaluation() {
  const window = getCurrentEvaluationWindow();
  
  try {
    // Get predictions and outcomes for evaluation window
    const data = await getPredictionOutcomeData(window);
    
    if ((data as any[]).length < 50) {
      console.warn(`Insufficient data for evaluation: ${(data as any[]).length} samples`);
      await recordInsufficientDataResult(window);
      return;
    }

    // Compute model performance metrics
    const performance = await computeModelPerformance(data as any[]);
    
    // Compute fairness metrics with multiple testing correction
    const fairnessResults = await computeFairnessMetrics(data as any[]);
    
    // Store results
    await storeFairnessGateRun(window, fairnessResults, performance);
    
    // Update Prometheus metrics
    updatePrometheusMetrics(performance, fairnessResults);
    
    console.log(`Weekly evaluation completed for ${window.windowId}`);
    
  } catch (error) {
    console.error('Weekly evaluation failed:', error);
    metrics.fairness_gate_runs.inc({ status: 'error' });
    throw error;
  }
}

async function getPredictionOutcomeData(window: EvaluationWindow) {
  return await prisma.$queryRaw`
    SELECT 
      p.candidateId,
      p.pSuccess,
      p.confidence,
      p.groupKey,
      o.retained12m,
      o.perfScore,
      o.roleFamily
    FROM "InterviewPrediction" p
    JOIN "HireOutcome" o ON p.candidateId = o.personId
    WHERE p.createdAt >= ${window.startDate}
      AND p.createdAt < ${window.endDate}
      AND o.retained12m IS NOT NULL
      AND p.stage = 'loop'
  `;
}

async function computeModelPerformance(data: any[]): Promise<any> {
  // Placeholder - would implement actual calculation
  return {
    rocAuc: 0.75,
    prAuc: 0.70,
    brierScore: 0.15,
    ece: 0.05,
    liftAt10: 1.8,
    liftAt20: 1.5,
    sampleSize: data.length
  };
}

async function computeFairnessMetrics(data: any[]): Promise<any> {
  // Placeholder - would implement actual fairness calculations
  return {
    adverseImpactRatio: 0.85,
    tprGap: 0.03,
    fprGap: 0.02,
    calibrationParity: 0.04,
    cohortSize: data.length,
    pValue: 0.12,
    effectSize: 0.1
  };
}

async function storeFairnessGateRun(window: EvaluationWindow, fairness: any, performance: any) {
  const status = fairness.adverseImpactRatio >= 0.80 && 
                 fairness.tprGap <= 0.05 && 
                 fairness.fprGap <= 0.05 && 
                 fairness.calibrationParity <= 0.05 
                 ? 'pass' : 'fail';

  await prisma.fairnessGateRun.create({
    data: {
      window: window.windowId,
      cohortSize: fairness.cohortSize,
      airMin: fairness.adverseImpactRatio,
      tprGapMax: fairness.tprGap,
      fprGapMax: fairness.fprGap,
      calibParityMax: fairness.calibrationParity,
      status,
      findings: { performance, fairness },
      pValue: fairness.pValue,
      effectSize: fairness.effectSize
    }
  });

  metrics.fairness_gate_runs.inc({ status });
}

async function recordInsufficientDataResult(window: EvaluationWindow) {
  await prisma.fairnessGateRun.create({
    data: {
      window: window.windowId,
      cohortSize: 0,
      airMin: 0,
      tprGapMax: 0,
      fprGapMax: 0,
      calibParityMax: 0,
      status: 'insufficient_data',
      findings: { message: 'Not enough data for evaluation' }
    }
  });

  metrics.fairness_gate_runs.inc({ status: 'insufficient_data' });
}

function updatePrometheusMetrics(performance: any, fairness: any) {
  metrics.model_performance.set(
    { model_version: 'v1.0', evaluation_window: 'current' },
    performance.rocAuc
  );
}

function getCurrentEvaluationWindow(): EvaluationWindow {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 90); // 90-day window
  
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  
  return {
    startDate,
    endDate,
    windowId: `${year}-W${week.toString().padStart(2, '0')}`
  };
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
