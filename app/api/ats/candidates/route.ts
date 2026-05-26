import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CandidateCreateSchema, SearchCandidatesSchema } from '@/lib/ats/schemas';
import { metrics } from '@/lib/metrics/prom';

// GET /api/ats/candidates - List/search candidates
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    
    const input = SearchCandidatesSchema.safeParse({
      query: searchParams.get('query') || undefined,
      skills: searchParams.get('skills')?.split(',').filter(Boolean) || undefined,
      status: searchParams.get('status') || undefined,
      location: searchParams.get('location') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : undefined,
    });
    
    if (!input.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: input.error },
        { status: 400 }
      );
    }
    
    const { query, skills, status, location, tags, page = 1, pageSize = 20 } = input.data;
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    
    if (skills && skills.length > 0) {
      where.skills = {
        some: {
          skill: {
            name: { in: skills, mode: 'insensitive' },
          },
        },
      };
    }
    
    // Get total count and candidates
    const [total, candidates] = await Promise.all([
      prisma.candidate.count({ where }),
      prisma.candidate.findMany({
        where,
        include: {
          skills: {
            include: { skill: true },
          },
          _count: {
            select: {
              documents: true,
              applications: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: candidates,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
    
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_candidates_list' }, duration / 1000);
  }
}

// POST /api/ats/candidates - Create a new candidate
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = CandidateCreateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if candidate with email already exists
    const existing = await prisma.candidate.findUnique({
      where: { email: data.email },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Candidate with this email already exists', candidateId: existing.id },
        { status: 409 }
      );
    }
    
    const candidate = await prisma.candidate.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        location: data.location,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        summary: data.summary,
        status: data.status || 'active',
        source: data.source || 'manual',
        tags: data.tags || [],
      },
      include: {
        skills: { include: { skill: true } },
      },
    });
    
    metrics.telemetry_ingested.inc({ type: 'candidate_created' });
    
    return NextResponse.json({
      success: true,
      data: candidate,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_candidates_create' }, duration / 1000);
  }
}
