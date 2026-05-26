"use client";

import { useState } from 'react';
import { useATSCopilot } from '@/components/ats-copilot/ATSCopilotProvider';

export default function DemoPage() {
  const { toggleSidebar, isOpen } = useATSCopilot();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const mockCandidates = [
    {
      id: 'cand_1',
      name: 'Sarah Johnson',
      role: 'Senior Software Engineer',
      experience: '8 years',
      successProbability: 0.85,
      status: 'In Review',
    },
    {
      id: 'cand_2',
      name: 'Michael Chen',
      role: 'Product Manager',
      experience: '5 years',
      successProbability: 0.72,
      status: 'Interview Scheduled',
    },
    {
      id: 'cand_3',
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      experience: '6 years',
      successProbability: 0.91,
      status: 'Final Round',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                ATS AI-Copilot Demo
              </h1>
              <p className="text-lg text-gray-600">
                Experience the world's best AI-powered hiring assistant
              </p>
            </div>
            <button
              onClick={toggleSidebar}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
            >
              {isOpen ? 'Hide' : 'Show'} AI Copilot
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 text-sm">
              <strong>💡 Try the AI Copilot:</strong> Click on any candidate below or use the quick actions in the sidebar to get intelligent assistance with hiring tasks!
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Resume Analysis</h3>
            <p className="text-gray-600 text-sm">
              AI-powered resume parsing and skill matching with instant insights
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Predictive Analytics</h3>
            <p className="text-gray-600 text-sm">
              ML models predict interview success with fairness guarantees
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Bias Detection</h3>
            <p className="text-gray-600 text-sm">
              Real-time fairness monitoring and EEOC compliance checks
            </p>
          </div>
        </div>

        {/* Candidate Cards */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Active Candidates</h2>
          <div className="space-y-4">
            {mockCandidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate.id)}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedCandidate === candidate.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {candidate.name}
                    </h3>
                    <p className="text-sm text-gray-600">{candidate.role}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Experience: {candidate.experience}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Success Rate:
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {(candidate.successProbability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {candidate.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🚀 Ready for Production</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                v0.dev Compatible
              </h3>
              <p className="text-blue-100 text-sm">
                Built with Next.js 14, TypeScript, and Tailwind CSS - drop it into v0.dev instantly
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Vercel Deploy Ready
              </h3>
              <p className="text-blue-100 text-sm">
                One-click deployment with Supabase backend integration included
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Supabase Backend
              </h3>
              <p className="text-blue-100 text-sm">
                Full backend integration with real-time database and auth support
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI-Powered Responses
              </h3>
              <p className="text-blue-100 text-sm">
                Context-aware AI assistance with extensible LLM integration (OpenAI/Anthropic ready)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
