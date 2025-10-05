"use client";

import { useEffect, useRef } from 'react';

interface LiftChartProps {
  predictions: number[];
  outcomes: number[];
}

export function LiftChart({ predictions, outcomes }: LiftChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sort by prediction descending
    const sorted = predictions
      .map((p, idx) => ({ p, o: outcomes[idx] }))
      .sort((a, b) => b.p - a.p);

    // Calculate cumulative lift at each percentile
    const percentiles = 10;
    const liftData: { percentile: number; lift: number }[] = [];
    const baseRate = outcomes.reduce((sum, o) => sum + o, 0) / outcomes.length;

    for (let i = 1; i <= percentiles; i++) {
      const topN = Math.floor((i / percentiles) * sorted.length);
      const topOutcomes = sorted.slice(0, topN);
      const topRate = topOutcomes.reduce((sum, { o }) => sum + o, 0) / topN;
      const lift = topRate / baseRate;
      liftData.push({ percentile: i / percentiles, lift });
    }

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, 350);
    ctx.lineTo(350, 350);
    ctx.stroke();

    // Draw baseline (lift = 1)
    ctx.strokeStyle = '#ccc';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const baselineY = 350 - (1 / 3) * 300; // Assuming max lift of 3
    ctx.moveTo(50, baselineY);
    ctx.lineTo(350, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw lift curve
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    liftData.forEach(({ percentile, lift }, idx) => {
      const x = 50 + percentile * 300;
      const y = 350 - (lift / 3) * 300; // Scale to max lift of 3
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.lineWidth = 1;

    // Add labels
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.fillText('Population Percentile', 140, 380);
    ctx.save();
    ctx.translate(15, 200);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Lift', 0, 0);
    ctx.restore();

  }, [predictions, outcomes]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Lift Chart</h3>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400}
        className="border border-gray-200"
      />
    </div>
  );
}
