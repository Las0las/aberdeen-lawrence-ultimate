import { getInterventions } from '@/lib/command360';
import type { Intervention360 } from '@/types/intervention360';

/**
 * Escalations page — filtered projection of the Intervention360 Registry.
 *
 * Constitutional rule: this surface does not generate, rank, or prioritize
 * work. It reads pre-ranked Intervention360 records from Command360 and
 * renders them in the order Command360 has assigned.
 */
export default async function EscalationsPage() {
  // Read only — Command360 is the sole ranking authority.
  const interventions = await getInterventions({ surface: 'escalations', limit: 50 });

  const stats = {
    total: interventions.length,
    highUrgency: interventions.filter((i) => i.urgencyScore >= 0.8).length,
    highEconomic: interventions.filter((i) => i.economicScore >= 0.8).length,
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Bias Event Escalations</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Pending Interventions</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">High Urgency</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.highUrgency}</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">High Economic Risk</h3>
          <p className="text-3xl font-bold text-red-600">{stats.highEconomic}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Economic Risk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {interventions.map((intervention: Intervention360) => {
              const p = intervention.payload as {
                sessionId: string;
                eventType: string;
                severity: number;
                adjudicated: boolean;
              };
              return (
                <tr key={intervention.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                    #{intervention.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {String(p.sessionId).substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {String(p.eventType).replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      p.severity >= 4 ? 'bg-red-100 text-red-800' :
                      p.severity === 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {(intervention.urgencyScore * 100).toFixed(0)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {(intervention.economicScore * 100).toFixed(0)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(intervention.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
