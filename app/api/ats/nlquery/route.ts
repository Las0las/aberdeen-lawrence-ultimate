import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { NLQuerySchema } from '@/lib/ats/schemas';
import { parseNLQuery, buildPrismaWhere, generateQueryDescription } from '@/lib/ats/nlparser';
import { metrics } from '@/lib/metrics/prom';

// POST /api/ats/nlquery - Process natural language query
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = NLQuerySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    const { query, userId, execute = true } = validation.data;
    
    // Parse the natural language query
    const parseResult = parseNLQuery(query);
    
    // Generate SQL-like description for audit
    const generatedSQL = generateQueryDescription(parseResult.intent, parseResult.params);
    
    let results: unknown[] = [];
    let resultCount = 0;
    let errorMessage: string | undefined;
    
    // Execute query if requested
    if (execute && parseResult.intent !== 'unknown') {
      try {
        switch (parseResult.intent) {
          case 'search_candidates':
          case 'match_candidates':
          case 'filter': {
            const where = buildPrismaWhere(parseResult.params);
            const limit = (parseResult.params.limit as number) || 20;
            
            const [candidates, count] = await Promise.all([
              prisma.candidate.findMany({
                where,
                include: {
                  skills: {
                    include: { skill: true },
                  },
                  _count: {
                    select: { applications: true, documents: true },
                  },
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
              }),
              prisma.candidate.count({ where }),
            ]);
            
            results = candidates;
            resultCount = count;
            break;
          }
          
          case 'create_job': {
            // Return suggestion for job creation - don't auto-create
            results = [{
              suggestion: 'Create a new job posting',
              params: parseResult.params,
              endpoint: 'POST /api/ats/jobs',
            }];
            resultCount = 1;
            break;
          }
          
          case 'create_candidate': {
            // Return suggestion for candidate creation - don't auto-create
            results = [{
              suggestion: 'Create a new candidate profile',
              params: parseResult.params,
              endpoint: 'POST /api/ats/candidates',
            }];
            resultCount = 1;
            break;
          }
          
          case 'update_candidate': {
            // Find the candidate to update
            const where = buildPrismaWhere(parseResult.params);
            const candidate = await prisma.candidate.findFirst({
              where,
              include: {
                skills: { include: { skill: true } },
              },
            });
            
            if (candidate) {
              results = [candidate];
              resultCount = 1;
            } else {
              errorMessage = 'Candidate not found matching the criteria';
            }
            break;
          }
          
          case 'report': {
            // Generate basic statistics
            const [
              totalCandidates,
              activeCandidates,
              totalJobs,
              openJobs,
              totalApplications,
            ] = await Promise.all([
              prisma.candidate.count(),
              prisma.candidate.count({ where: { status: 'active' } }),
              prisma.job.count(),
              prisma.job.count({ where: { status: 'open' } }),
              prisma.jobApplication.count(),
            ]);
            
            results = [{
              type: 'statistics',
              data: {
                candidates: {
                  total: totalCandidates,
                  active: activeCandidates,
                },
                jobs: {
                  total: totalJobs,
                  open: openJobs,
                },
                applications: {
                  total: totalApplications,
                },
              },
            }];
            resultCount = 1;
            break;
          }
          
          default:
            errorMessage = 'Could not determine query intent';
        }
      } catch (execError) {
        console.error('Query execution error:', execError);
        errorMessage = 'Failed to execute query';
      }
    }
    
    // Log the query
    const logEntry = await prisma.nLQueryLog.create({
      data: {
        query,
        parsedIntent: parseResult.intent,
        parsedParams: parseResult.params,
        generatedSQL,
        resultCount,
        userId: userId || null,
        successful: !errorMessage,
        errorMessage,
        executionMs: Date.now() - startTime,
      },
    });
    
    metrics.telemetry_ingested.inc({ type: 'nl_query' });
    
    return NextResponse.json({
      success: true,
      data: {
        queryId: logEntry.id,
        query,
        parsed: {
          intent: parseResult.intent,
          confidence: parseResult.confidence,
          params: parseResult.params,
          suggestedAction: parseResult.suggestedAction,
        },
        generatedQuery: generatedSQL,
        results: execute ? results : undefined,
        resultCount: execute ? resultCount : undefined,
        error: errorMessage,
      },
    });
    
  } catch (error) {
    console.error('Error processing NL query:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_nlquery' }, duration / 1000);
  }
}

// GET /api/ats/nlquery - Get query history
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    
    const where: Record<string, unknown> = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    const [total, queries] = await Promise.all([
      prisma.nLQueryLog.count({ where }),
      prisma.nLQueryLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: queries,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
    
  } catch (error) {
    console.error('Error fetching query history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query history' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_nlquery_history' }, duration / 1000);
  }
}
