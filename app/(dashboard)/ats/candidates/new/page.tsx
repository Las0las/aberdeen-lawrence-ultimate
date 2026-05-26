"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateForm } from '@/components/ats/CandidateForm';
import { FileUpload } from '@/components/ats/FileUpload';

export default function NewCandidatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [parseResult, setParseResult] = useState<{
    documentId: string;
    profile: Record<string, unknown>;
  } | null>(null);

  const handleManualSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ats/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create candidate');
      }
      
      const result = await response.json();
      router.push(`/ats/candidates/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create candidate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    
    // First, upload the document
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', 'resume');
    
    const uploadResponse = await fetch('/api/ats/documents', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      const data = await uploadResponse.json();
      throw new Error(data.error || 'Upload failed');
    }
    
    const uploadResult = await uploadResponse.json();
    
    // Then, parse the document with createCandidate flag
    const parseResponse = await fetch(`/api/ats/documents/${uploadResult.data.id}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createCandidate: true }),
    });
    
    if (!parseResponse.ok) {
      const data = await parseResponse.json();
      throw new Error(data.error || 'Parse failed');
    }
    
    const parseResultData = await parseResponse.json();
    
    // If candidate was created, redirect to their profile
    if (parseResultData.data.candidateId) {
      router.push(`/ats/candidates/${parseResultData.data.candidateId}`);
    } else {
      // Show parsed data for manual review
      setParseResult({
        documentId: uploadResult.data.id,
        profile: parseResultData.data.structuredData,
      });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Add New Candidate</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-4 px-2 font-medium ${
            activeTab === 'manual'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-4 px-2 font-medium ${
            activeTab === 'upload'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload Resume
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {activeTab === 'manual' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <CandidateForm
            onSubmit={handleManualSubmit}
            onCancel={() => router.back()}
            isLoading={isLoading}
          />
        </div>
      )}
      
      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Upload Resume to Parse</h2>
          <p className="text-gray-600 mb-6">
            Upload a resume file and our AI will automatically extract candidate information.
            Supported formats: PDF, DOC, DOCX, TXT, RTF
          </p>
          
          <FileUpload onUpload={handleFileUpload} />
          
          {parseResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Resume Parsed Successfully!</h3>
              <p className="text-green-700 text-sm mb-4">
                The resume was parsed but we couldn&apos;t extract all required information.
                Please review and complete the profile manually.
              </p>
              <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-60">
                {JSON.stringify(parseResult.profile, null, 2)}
              </pre>
              <button
                onClick={() => setActiveTab('manual')}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Complete Profile Manually
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
