import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JobCreateSchema, SearchJobsSchema } from '@/lib/ats/schemas';
import { metrics } from '@/lib/metrics/prom';

// GET /api/ats/jobs - List/search jobs
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    
    const input = SearchJobsSchema.safeParse({
      query: searchParams.get('query') || undefined,
      status: searchParams.get('status') || undefined,
      department: searchParams.get('department') || undefined,
      locationType: searchParams.get('locationType') || undefined,
      employmentType: searchParams.get('employmentType') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : undefined,
    });
    
    if (!input.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: input.error },
        { status: 400 }
      );
    }
    
    const { query, status, department, locationType, employmentType, page = 1, pageSize = 20 } = input.data;
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { requirements: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }
    
    if (locationType) {
      where.locationType = locationType;
    }
    
    if (employmentType) {
      where.employmentType = employmentType;
    }
    
    // Get total count and jobs
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: {
          skills: {
            include: { skill: true },
          },
          _count: {
            select: {
              applications: true,
              sections: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: jobs,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_jobs_list' }, duration / 1000);
  }
}

// POST /api/ats/jobs - Create a new job
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = JobCreateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    const job = await prisma.job.create({
      data: {
        title: data.title,
        department: data.department,
        location: data.location,
        locationType: data.locationType,
        employmentType: data.employmentType,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
        status: data.status || 'draft',
        priority: data.priority || 0,
        closingDate: data.closingDate ? new Date(data.closingDate) : null,
      },
      include: {
        skills: { include: { skill: true } },
        sections: { orderBy: { order: 'asc' } },
      },
    });
    
    metrics.telemetry_ingested.inc({ type: 'job_created' });
    
    return NextResponse.json({
      success: true,
      data: job,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_jobs_create' }, duration / 1000);
  }
}
