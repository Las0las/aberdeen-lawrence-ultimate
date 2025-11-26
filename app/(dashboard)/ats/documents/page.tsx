"use client";

import { useState, useEffect, useCallback } from 'react';
import { DocumentManager } from '@/components/ats/DocumentManager';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  docType: string;
  parsed: boolean;
  createdAt: string;
  candidate?: { id: string; firstName: string; lastName: string } | null;
  job?: { id: string; title: string } | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ats/documents?page=${page}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleParse = async (id: string) => {
    const response = await fetch(`/api/ats/documents/${id}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createCandidate: true }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Parse failed');
    }
    
    fetchDocuments();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
        <span className="text-gray-500">{total} total documents</span>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <DocumentManager
            documents={documents}
            onRefresh={fetchDocuments}
            onParse={handleParse}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              <span className="px-4 py-2 text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
