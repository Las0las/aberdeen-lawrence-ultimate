import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { redact } from '@/lib/security/redact';
import { metrics } from '@/lib/metrics/prom';

const InterviewPredictionSchema = z.object({
  candidateId: z.string().min(1),
  reqId: z.string().min(1),
  stage: z.enum(['screen', 'tech', 'loop']),
  pSuccess: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  topFactors: z.array(z.string()).max(8),
  groupKey: z.string().optional(),
  modelVersion: z.string().default('v1.0')
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = InterviewPredictionSchema.safeParse(body);
    
    if (!validation.success) {
      metrics.telemetry_errors.inc({ 
        type: 'interview_prediction', 
        reason: 'validation_failed' 
      });
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }

    await prisma.interviewPrediction.create({
      data: validation.data
    });

    metrics.telemetry_ingested.inc({ type: 'interview_prediction' });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    metrics.telemetry_errors.inc({ 
      type: 'interview_prediction', 
      reason: 'database_error' 
    });
    
    console.error('Telemetry ingestion error:', redact(error));
    
    return NextResponse.json(
      { error: 'Database error', details: 'Failed to store prediction' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'telemetry_interview' }, duration / 1000);
  }
}
