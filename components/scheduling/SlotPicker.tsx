"use client";

import { useState } from 'react';

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface SlotPickerProps {
  slots: Slot[];
  candidateId: string;
  onReserve: (slotId: string) => Promise<void>;
}

export function SlotPicker({ slots, candidateId, onReserve }: SlotPickerProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReserve = async () => {
    if (!selectedSlot) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onReserve(selectedSlot);
    } catch (err: any) {
      setError(err.message || 'Failed to reserve slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Select Interview Slot</h3>
      
      <div className="space-y-2 mb-4">
        {slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => setSelectedSlot(slot.id)}
            disabled={!slot.available || loading}
            className={`w-full p-3 rounded border text-left ${
              selectedSlot === slot.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${
              !slot.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="font-medium">
              {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-600">
              {slot.available ? 'Available' : 'Unavailable'}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleReserve}
        disabled={!selectedSlot || loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Reserving...' : 'Reserve Slot'}
      </button>
    </div>
  );
}
