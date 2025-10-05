import { prisma } from '@/lib/db';

export default async function AnalyticsPage() {
  const fairnessGates = await prisma.fairnessGateRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const latestGate = fairnessGates[0];
  const passRate = fairnessGates.filter(g => g.status === 'pass').length / fairnessGates.length;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Model Analytics & Fairness</h1>

      {latestGate && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Latest Fairness Gate: {latestGate.window}</h2>
            <span className={`px-3 py-1 rounded font-semibold ${
              latestGate.status === 'pass' ? 'bg-green-100 text-green-800' :
              latestGate.status === 'fail' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {latestGate.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Cohort Size</label>
              <p className="text-2xl font-bold">{latestGate.cohortSize}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">AIR (min 0.80)</label>
              <p className={`text-2xl font-bold ${
                latestGate.airMin >= 0.80 ? 'text-green-600' : 'text-red-600'
              }`}>
                {latestGate.airMin.toFixed(3)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">TPR Gap (max 0.05)</label>
              <p className={`text-2xl font-bold ${
                latestGate.tprGapMax <= 0.05 ? 'text-green-600' : 'text-red-600'
              }`}>
                {latestGate.tprGapMax.toFixed(3)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">FPR Gap (max 0.05)</label>
              <p className={`text-2xl font-bold ${
                latestGate.fprGapMax <= 0.05 ? 'text-green-600' : 'text-red-600'
              }`}>
                {latestGate.fprGapMax.toFixed(3)}
              </p>
            </div>
          </div>

          {latestGate.pValue && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">p-value (Bonferroni corrected)</label>
              <p className="text-lg">{latestGate.pValue.toFixed(4)}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Historical Fairness Gate Results</h2>
        <p className="text-sm text-gray-600 mb-4">
          Pass Rate: {(passRate * 100).toFixed(1)}% ({fairnessGates.filter(g => g.status === 'pass').length}/{fairnessGates.length})
        </p>

        <div className="space-y-2">
          {fairnessGates.map((gate) => (
            <div key={gate.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div className="flex-1">
                <span className="font-medium">{gate.window}</span>
                <span className="ml-4 text-sm text-gray-600">
                  Cohort: {gate.cohortSize} | AIR: {gate.airMin.toFixed(3)}
                </span>
              </div>
              <span className={`px-3 py-1 text-sm rounded font-medium ${
                gate.status === 'pass' ? 'bg-green-100 text-green-800' :
                gate.status === 'fail' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {gate.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
