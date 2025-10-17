import { prisma } from '@/lib/db';
import { CalibrationPlot } from '@/components/metrics/CalibrationPlot';
import { LiftChart } from '@/components/metrics/LiftChart';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Get recent predictions and outcomes for visualization
  const recentData = await prisma.$queryRaw<any[]>`
    SELECT 
      p.pSuccess,
      o.retained12m
    FROM "InterviewPrediction" p
    JOIN "HireOutcome" o ON p.candidateId = o.personId
    WHERE o.retained12m IS NOT NULL
    LIMIT 100
  `;

  const predictions = recentData.map((d: any) => d.pSuccess);
  const outcomes = recentData.map((d: any) => d.retained12m ? 1 : 0);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Interview Prediction Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CalibrationPlot predictions={predictions} outcomes={outcomes} />
        <LiftChart predictions={predictions} outcomes={outcomes} />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Predictions</h3>
          <p className="text-3xl font-bold text-blue-600">{recentData.length}</p>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Avg Prediction</h3>
          <p className="text-3xl font-bold text-green-600">
            {(predictions.reduce((a: number, b: number) => a + b, 0) / predictions.length).toFixed(2)}
          </p>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Actual Success Rate</h3>
          <p className="text-3xl font-bold text-purple-600">
            {(outcomes.reduce((a: number, b: number) => a + b, 0) / outcomes.length).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
