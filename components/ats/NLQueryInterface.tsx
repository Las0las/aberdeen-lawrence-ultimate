"use client";

import { useState, useCallback } from 'react';

interface NLQueryResult {
  queryId: string;
  query: string;
  parsed: {
    intent: string;
    confidence: number;
    params: Record<string, unknown>;
    suggestedAction?: string;
  };
  generatedQuery?: string;
  results?: unknown[];
  resultCount?: number;
  error?: string;
}

interface NLQueryInterfaceProps {
  onResultSelect?: (result: unknown) => void;
  placeholder?: string;
}

const EXAMPLE_QUERIES = [
  "Find candidates with Python and React experience",
  "Show me all active candidates in New York",
  "Candidates with more than 5 years of experience",
  "Create a new job for Senior Software Engineer",
  "How many candidates do we have?",
  "Find remote full-time positions",
];

export function NLQueryInterface({
  onResultSelect,
  placeholder = "Ask anything about candidates, jobs, or applications...",
}: NLQueryInterfaceProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NLQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  const executeQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/ats/nlquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, execute: true }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Query failed');
      }
      
      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeQuery(query);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowExamples(false);
    executeQuery(example);
  };

  const getIntentBadgeColor = (intent: string): string => {
    const colors: Record<string, string> = {
      search_candidates: 'bg-blue-100 text-blue-800',
      match_candidates: 'bg-purple-100 text-purple-800',
      create_job: 'bg-green-100 text-green-800',
      create_candidate: 'bg-teal-100 text-teal-800',
      update_candidate: 'bg-yellow-100 text-yellow-800',
      filter: 'bg-orange-100 text-orange-800',
      report: 'bg-pink-100 text-pink-800',
      unknown: 'bg-gray-100 text-gray-800',
    };
    return colors[intent] || colors.unknown;
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="w-full">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center border-2 border-gray-200 rounded-lg focus-within:border-blue-500 bg-white">
          <div className="pl-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.243 3 3 0 00-4.243 4.243zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowExamples(true)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 outline-none text-gray-900 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Search'
            )}
          </button>
        </div>
        
        {/* Example Queries */}
        {showExamples && !result && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-500">Try asking:</p>
            </div>
            <ul className="py-2">
              {EXAMPLE_QUERIES.map((example, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {/* Results Display */}
      {result && (
        <div className="mt-6 space-y-6">
          {/* Query Understanding */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Query Understanding</h3>
              <span className={`px-2 py-1 text-xs rounded ${getIntentBadgeColor(result.parsed.intent)}`}>
                {result.parsed.intent.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Confidence:</span>
                <span className="ml-2 font-medium">{formatConfidence(result.parsed.confidence)}</span>
              </div>
              {result.resultCount !== undefined && (
                <div>
                  <span className="text-gray-500">Results:</span>
                  <span className="ml-2 font-medium">{result.resultCount}</span>
                </div>
              )}
              {Object.keys(result.parsed.params).length > 0 && (
                <div className="col-span-full">
                  <span className="text-gray-500">Parameters:</span>
                  <span className="ml-2 font-mono text-xs">
                    {JSON.stringify(result.parsed.params)}
                  </span>
                </div>
              )}
            </div>
            {result.parsed.suggestedAction && (
              <p className="mt-3 text-sm text-gray-600">
                <span className="font-medium">Action:</span> {result.parsed.suggestedAction}
              </p>
            )}
          </div>
          
          {/* Results List */}
          {result.results && result.results.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Results</h3>
              <div className="space-y-3">
                {result.results.map((item, index) => {
                  const candidate = item as Record<string, unknown> & {
                    id?: string;
                    firstName?: string;
                    lastName?: string;
                    email?: string;
                    status?: string;
                    location?: string;
                    skills?: { skill: { name: string } }[];
                    type?: string;
                    data?: Record<string, unknown>;
                  };
                  
                  // Handle statistics result
                  if (candidate.type === 'statistics') {
                    return (
                      <div key={index} className="p-4 bg-white border rounded-lg">
                        <h4 className="font-medium mb-3">Statistics</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          {candidate.data && Object.entries(candidate.data).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-2xl font-bold text-blue-600">
                                {typeof value === 'object' && value !== null 
                                  ? (value as Record<string, number>).total || Object.values(value as Record<string, number>)[0]
                                  : String(value)
                                }
                              </p>
                              <p className="text-sm text-gray-500 capitalize">{key}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle candidate result
                  return (
                    <div
                      key={candidate.id || index}
                      onClick={() => onResultSelect?.(item)}
                      className={`p-4 bg-white border rounded-lg hover:border-blue-300 ${
                        onResultSelect ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {candidate.firstName} {candidate.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">{candidate.email}</p>
                          {candidate.location && (
                            <p className="text-sm text-gray-500">{candidate.location}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {candidate.status && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              candidate.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {candidate.status}
                            </span>
                          )}
                        </div>
                      </div>
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 5).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                              {s.skill.name}
                            </span>
                          ))}
                          {candidate.skills.length > 5 && (
                            <span className="px-2 py-0.5 text-xs text-gray-500">
                              +{candidate.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* No Results */}
          {result.results && result.results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No results found matching your query</p>
            </div>
          )}
          
          {/* Generated Query (for debugging) */}
          {result.generatedQuery && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                View generated query
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded-lg overflow-x-auto">
                {result.generatedQuery}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
