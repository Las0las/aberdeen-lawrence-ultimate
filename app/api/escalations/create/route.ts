import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { metrics } from '@/lib/metrics/prom';

const EscalationSchema = z.object({
  sessionId: z.string().min(1),
  severity: z.number().min(1).max(5),
  eventType: z.enum(['language_bias', 'demographic_bias', 'cognitive_bias']),
  details: z.record(z.any())
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = EscalationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }

    const biasEvent = await prisma.biasEvent.create({
      data: validation.data
    });

    metrics.bias_events_detected.inc({ 
      severity: validation.data.severity.toString(), 
      type: validation.data.eventType 
    });
    
    return NextResponse.json({ 
      success: true, 
      eventId: biasEvent.id 
    });
    
  } catch (error) {
    console.error('Escalation creation error:', error);
    
    return NextResponse.json(
      { error: 'Database error', details: 'Failed to create escalation' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'escalations_create' }, duration / 1000);
  }
}
