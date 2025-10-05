import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { redact } from '@/lib/security/redact';
import { metrics } from '@/lib/metrics/prom';

const HireOutcomeSchema = z.object({
  personId: z.string().min(1),
  roleFamily: z.enum(['eng', 'consulting', 'ops']),
  startDate: z.string().transform(str => new Date(str)),
  rampDays: z.number().optional(),
  retained12m: z.boolean().optional(),
  perfScore: z.number().min(0).max(1).optional(),
  utilization: z.number().min(0).max(1).optional(),
  marginPct: z.number().optional(),
  clientNps: z.number().optional(),
  renewed: z.boolean().optional(),
  qohVersion: z.string().default('2025.10')
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = HireOutcomeSchema.safeParse(body);
    
    if (!validation.success) {
      metrics.telemetry_errors.inc({ 
        type: 'hire_outcome', 
        reason: 'validation_failed' 
      });
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }

    await prisma.hireOutcome.upsert({
      where: { personId: validation.data.personId },
      update: validation.data,
      create: validation.data
    });

    metrics.telemetry_ingested.inc({ type: 'hire_outcome' });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    metrics.telemetry_errors.inc({ 
      type: 'hire_outcome', 
      reason: 'database_error' 
    });
    
    console.error('Outcome ingestion error:', redact(error));
    
    return NextResponse.json(
      { error: 'Database error', details: 'Failed to store outcome' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'telemetry_outcomes' }, duration / 1000);
  }
}
