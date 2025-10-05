"use client";

import { useState } from 'react';

interface AssistControlsProps {
  sessionId: string;
  onEscalate: (severity: number, eventType: string, details: any) => Promise<void>;
}

export function AssistControls({ sessionId, onEscalate }: AssistControlsProps) {
  const [showEscalation, setShowEscalation] = useState(false);
  const [severity, setSeverity] = useState(3);
  const [eventType, setEventType] = useState<'language_bias' | 'demographic_bias' | 'cognitive_bias'>('language_bias');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEscalate = async () => {
    setLoading(true);
    try {
      await onEscalate(severity, eventType, { notes, timestamp: new Date().toISOString() });
      setShowEscalation(false);
      setNotes('');
    } catch (err) {
      console.error('Escalation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Interview Assist Controls</h3>
      
      {!showEscalation ? (
        <button
          onClick={() => setShowEscalation(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Report Bias Event
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="language_bias">Language Bias</option>
              <option value="demographic_bias">Demographic Bias</option>
              <option value="cognitive_bias">Cognitive Bias</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Severity (1-5): {severity}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              rows={3}
              placeholder="Describe the bias event..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEscalate}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Escalating...' : 'Escalate'}
            </button>
            <button
              onClick={() => setShowEscalation(false)}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
