import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JobUpdateSchema } from '@/lib/ats/schemas';
import { metrics } from '@/lib/metrics/prom';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ats/jobs/[id] - Get a single job
export async function GET(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { order: 'asc' } },
        skills: {
          include: { skill: true },
        },
        applications: {
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { appliedAt: 'desc' },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: job,
    });
    
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_jobs_get' }, duration / 1000);
  }
}

// PATCH /api/ats/jobs/[id] - Update a job
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = JobUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    // Check if job exists
    const existing = await prisma.job.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    const data = validation.data;
    
    // Handle status transition for publishing
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'open' && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    if (data.closingDate) {
      updateData.closingDate = new Date(data.closingDate);
    }
    
    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        skills: { include: { skill: true } },
        sections: { orderBy: { order: 'asc' } },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: job,
    });
    
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_jobs_update' }, duration / 1000);
  }
}

// DELETE /api/ats/jobs/[id] - Delete a job
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    // Check if job exists
    const existing = await prisma.job.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    await prisma.job.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_jobs_delete' }, duration / 1000);
  }
}
