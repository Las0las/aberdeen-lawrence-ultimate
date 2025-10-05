import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics/prom';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // This would typically trigger a background job
    // For now, return a placeholder response
    
    return NextResponse.json({ 
      success: true,
      message: 'Evaluation job queued',
      jobId: `eval-${Date.now()}`
    });
    
  } catch (error) {
    console.error('Evaluation run error:', error);
    
    return NextResponse.json(
      { error: 'Internal error', details: 'Failed to queue evaluation' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'eval_run' }, duration / 1000);
  }
}
