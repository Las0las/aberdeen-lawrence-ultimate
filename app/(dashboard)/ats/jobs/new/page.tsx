"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobForm } from '@/components/ats/JobForm';

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ats/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create job');
      }
      
      const result = await response.json();
      router.push(`/ats/jobs/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Job</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <JobForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
