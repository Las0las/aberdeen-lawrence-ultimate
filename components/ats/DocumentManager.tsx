"use client";

import { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';

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

interface DocumentManagerProps {
  documents: Document[];
  candidateId?: string;
  jobId?: string;
  onUpload?: (doc: Document) => void;
  onDelete?: (id: string) => void;
  onParse?: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export function DocumentManager({
  documents,
  candidateId,
  jobId,
  onUpload,
  onDelete,
  onParse,
  onRefresh,
}: DocumentManagerProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', 'resume');
    if (candidateId) formData.append('candidateId', candidateId);
    if (jobId) formData.append('jobId', jobId);
    
    const response = await fetch('/api/ats/documents', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }
    
    const result = await response.json();
    onUpload?.(result.data);
    onRefresh?.();
  }, [candidateId, jobId, onUpload, onRefresh]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    setIsLoading(id);
    setError(null);
    
    try {
      const response = await fetch(`/api/ats/documents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }
      
      onDelete?.(id);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsLoading(null);
    }
  }, [onDelete, onRefresh]);

  const handleParse = useCallback(async (id: string) => {
    setIsLoading(id);
    setError(null);
    
    try {
      await onParse?.(id);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setIsLoading(null);
    }
  }, [onParse, onRefresh]);

  const handleDownload = useCallback(async (id: string, originalName: string) => {
    try {
      const response = await fetch(`/api/ats/documents/${id}?download=true`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getDocTypeLabel = (docType: string): string => {
    const labels: Record<string, string> = {
      resume: 'Resume',
      cover_letter: 'Cover Letter',
      portfolio: 'Portfolio',
      certificate: 'Certificate',
      job_description: 'Job Description',
      other: 'Other',
    };
    return labels[docType] || docType;
  };

  const getDocTypeColor = (docType: string): string => {
    const colors: Record<string, string> = {
      resume: 'bg-blue-100 text-blue-800',
      cover_letter: 'bg-green-100 text-green-800',
      portfolio: 'bg-purple-100 text-purple-800',
      certificate: 'bg-yellow-100 text-yellow-800',
      job_description: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[docType] || colors.other;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
        <FileUpload onUpload={handleUpload} />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          )}
        </div>
        
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No documents uploaded yet
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.originalName}</p>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span>{formatFileSize(doc.size)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getDocTypeColor(doc.docType)}`}>
                        {getDocTypeLabel(doc.docType)}
                      </span>
                      {doc.parsed && (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                          Parsed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(doc.id, doc.originalName)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  
                  {!doc.parsed && onParse && (
                    <button
                      onClick={() => handleParse(doc.id)}
                      disabled={isLoading === doc.id}
                      className="p-2 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                      title="Parse document"
                    >
                      {isLoading === doc.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={isLoading === doc.id}
                    className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
