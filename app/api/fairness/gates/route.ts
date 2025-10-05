import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { metrics } from '@/lib/metrics/prom';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = req.nextUrl.searchParams;
    const window = searchParams.get('window');
    
    if (window) {
      // Get specific window results
      const result = await prisma.fairnessGateRun.findUnique({
        where: { window }
      });
      
      return NextResponse.json(result || { error: 'Not found' });
    } else {
      // Get recent results
      const results = await prisma.fairnessGateRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      return NextResponse.json(results);
    }
  } catch (error) {
    console.error('Fairness gate query error:', error);
    
    return NextResponse.json(
      { error: 'Database error', details: 'Failed to query fairness gates' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'fairness_gates' }, duration / 1000);
  }
}
