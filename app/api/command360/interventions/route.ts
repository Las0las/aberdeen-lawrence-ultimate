import { NextRequest, NextResponse } from 'next/server';
import { getInterventions } from '@/lib/command360';
import type { InterventionSurface } from '@/types/intervention360';
import { metrics } from '@/lib/metrics/prom';

const VALID_SURFACES: InterventionSurface[] = [
  'escalations',
  'analytics',
  'pipeline_actions',
];

/**
 * GET /api/command360/interventions
 *
 * Returns ranked Intervention360 records from the canonical registry.
 *
 * Query parameters:
 * - surface: optional — filter to a specific work surface
 *   ('escalations' | 'analytics' | 'pipeline_actions')
 * - limit: optional — maximum number of results (default 50, max 200)
 *
 * Constitutional rule: this endpoint is the ONLY approved read path for
 * surface-level work. No UI surface may query work data directly from the
 * database or derive its own prioritization.
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = req.nextUrl.searchParams;
    const rawSurface = searchParams.get('surface');
    const rawLimit = searchParams.get('limit');

    let surface: InterventionSurface | undefined;
    if (rawSurface !== null) {
      if (!VALID_SURFACES.includes(rawSurface as InterventionSurface)) {
        return NextResponse.json(
          {
            error: 'Invalid surface',
            validValues: VALID_SURFACES,
          },
          { status: 400 }
        );
      }
      surface = rawSurface as InterventionSurface;
    }

    const limit = rawLimit !== null
      ? Math.min(Math.max(1, parseInt(rawLimit, 10) || 50), 200)
      : 50;

    const interventions = await getInterventions({ surface, limit });

    return NextResponse.json({ interventions, total: interventions.length });
  } catch (error) {
    console.error('Command360 interventions error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve interventions' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'command360_interventions' }, duration / 1000);
  }
}
