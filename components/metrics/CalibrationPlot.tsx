"use client";

import { useEffect, useRef } from 'react';

interface CalibrationPlotProps {
  predictions: number[];
  outcomes: number[];
}

export function CalibrationPlot({ predictions, outcomes }: CalibrationPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, 350);
    ctx.lineTo(350, 350);
    ctx.stroke();

    // Draw diagonal perfect calibration line
    ctx.strokeStyle = '#ccc';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, 350);
    ctx.lineTo(350, 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bin predictions and calculate actual outcomes
    const bins = 10;
    const binData: { predicted: number; actual: number; count: number }[] = [];
    
    for (let i = 0; i < bins; i++) {
      const binMin = i / bins;
      const binMax = (i + 1) / bins;
      const inBin = predictions
        .map((p, idx) => ({ p, o: outcomes[idx] }))
        .filter(({ p }) => p >= binMin && p < binMax);
      
      if (inBin.length > 0) {
        const avgPredicted = inBin.reduce((sum, { p }) => sum + p, 0) / inBin.length;
        const avgActual = inBin.reduce((sum, { o }) => sum + o, 0) / inBin.length;
        binData.push({ predicted: avgPredicted, actual: avgActual, count: inBin.length });
      }
    }

    // Plot calibration points
    ctx.fillStyle = '#3b82f6';
    binData.forEach(({ predicted, actual }) => {
      const x = 50 + predicted * 300;
      const y = 350 - actual * 300;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Add labels
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.fillText('Predicted Probability', 150, 380);
    ctx.save();
    ctx.translate(15, 200);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Actual Frequency', 0, 0);
    ctx.restore();

  }, [predictions, outcomes]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Calibration Plot</h3>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400}
        className="border border-gray-200"
      />
    </div>
  );
}
