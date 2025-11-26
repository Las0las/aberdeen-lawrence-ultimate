import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JobSectionSchema, ReorderItemsSchema } from '@/lib/ats/schemas';
import { metrics } from '@/lib/metrics/prom';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ats/jobs/[id]/sections - List job sections
export async function GET(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    const sections = await prisma.jobSection.findMany({
      where: { jobId: id },
      orderBy: { order: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: sections,
    });
    
  } catch (error) {
    console.error('Error fetching job sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job sections' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_job_sections_list' }, duration / 1000);
  }
}

// POST /api/ats/jobs/[id]/sections - Add job section
export async function POST(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = JobSectionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id },
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    const data = validation.data;
    
    // Get max order for this job's sections
    const maxOrder = await prisma.jobSection.aggregate({
      where: { jobId: id },
      _max: { order: true },
    });
    
    const section = await prisma.jobSection.create({
      data: {
        jobId: id,
        title: data.title,
        content: data.content,
        sectionType: data.sectionType,
        order: data.order ?? (maxOrder._max.order ?? -1) + 1,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: section,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating job section:', error);
    return NextResponse.json(
      { error: 'Failed to create job section' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_job_sections_create' }, duration / 1000);
  }
}

// PUT /api/ats/jobs/[id]/sections - Reorder sections (for DnD)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = ReorderItemsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id },
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Update order for each section
    const updates = validation.data.items.map(item =>
      prisma.jobSection.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );
    
    await prisma.$transaction(updates);
    
    const sections = await prisma.jobSection.findMany({
      where: { jobId: id },
      orderBy: { order: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: sections,
    });
    
  } catch (error) {
    console.error('Error reordering job sections:', error);
    return NextResponse.json(
      { error: 'Failed to reorder job sections' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_job_sections_reorder' }, duration / 1000);
  }
}
