import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis/client';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { metrics } from '@/lib/metrics/prom';

const LUA_SCRIPT = readFileSync(
  process.cwd() + '/lib/redis/lua/reserve_slot.lua', 
  'utf8'
);

const ReserveSchema = z.object({
  slotId: z.string().min(1),
  candidateId: z.string().min(1),
  alternatives: z.array(z.string()).optional()
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = ReserveSchema.safeParse(body);
    
    if (!validation.success) {
      metrics.reservation_errors.inc({ reason: 'invalid_payload' });
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error }, 
        { status: 400 }
      );
    }

    const { slotId, candidateId, alternatives = [] } = validation.data;
    
    const slotKey = `slot:${slotId}`;
    const altKey = `alt:${slotId}`;
    const ttl = 15 * 60; // 15 minutes
    
    const result = await redis.eval(
      LUA_SCRIPT,
      2, // number of keys
      slotKey,
      altKey,
      candidateId,
      ttl.toString(),
      JSON.stringify(alternatives)
    ) as [string, string];

    const [status, data] = result;

    if (status === 'success') {
      metrics.reservations_created.inc();
      return NextResponse.json({
        success: true,
        reservationId: `${slotId}:${candidateId}`,
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
      });
    } else {
      metrics.reservation_conflicts.inc();
      
      // Get stored alternatives
      const storedAlternatives = await redis.get(altKey);
      const alternativeSlots = storedAlternatives ? JSON.parse(storedAlternatives) : [];
      
      return NextResponse.json({
        success: false,
        reason: 'slot_conflict',
        conflictedWith: data,
        alternatives: alternativeSlots,
        suggestedAction: 'escalate_to_human'
      });
    }
  } catch (error) {
    metrics.reservation_errors.inc({ reason: 'system_error' });
    console.error('Reservation error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: 'Reservation system unavailable' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'scheduling_reserve' }, duration / 1000);
  }
}
