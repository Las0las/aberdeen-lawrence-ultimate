import { prisma } from '@/lib/db';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface InterviewPageProps {
  params: {
    id: string;
  };
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const prediction = await prisma.interviewPrediction.findUnique({
    where: { id: params.id }
  });

  if (!prediction) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Interview Not Found</h1>
        <p className="text-gray-600">The requested interview prediction could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Interview Prediction Details</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Candidate ID</label>
            <p className="text-lg">{prediction.candidateId}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Requisition ID</label>
            <p className="text-lg">{prediction.reqId}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Stage</label>
            <p className="text-lg capitalize">{prediction.stage}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Success Probability</label>
            <p className="text-2xl font-bold text-blue-600">
              {(prediction.pSuccess * 100).toFixed(1)}%
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Confidence</label>
            <p className="text-lg">{(prediction.confidence * 100).toFixed(1)}%</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Model Version</label>
            <p className="text-lg">{prediction.modelVersion}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Top Factors</label>
          <ul className="mt-2 space-y-1">
            {prediction.topFactors.map((factor: string, idx: number) => (
              <li key={idx} className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2">
                  {idx + 1}
                </span>
                {factor}
              </li>
            ))}
          </ul>
        </div>

        {prediction.groupKey && (
          <div>
            <label className="text-sm font-medium text-gray-600">Fairness Cohort</label>
            <p className="text-lg">{prediction.groupKey}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600">Created At</label>
          <p className="text-lg">{new Date(prediction.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
