import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CandidateUpdateSchema } from '@/lib/ats/schemas';
import { metrics } from '@/lib/metrics/prom';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ats/candidates/[id] - Get a single candidate
export async function GET(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        experiences: { orderBy: { order: 'asc' } },
        educations: { orderBy: { order: 'asc' } },
        skills: {
          include: { skill: true },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        applications: {
          include: {
            job: {
              select: { id: true, title: true, department: true, status: true },
            },
          },
          orderBy: { appliedAt: 'desc' },
        },
        parsedProfiles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: candidate,
    });
    
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_candidates_get' }, duration / 1000);
  }
}

// PATCH /api/ats/candidates/[id] - Update a candidate
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = CandidateUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Check if candidate exists
    const existing = await prisma.candidate.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }
    
    // Check if email is being changed and is unique
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.candidate.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another candidate' },
          { status: 409 }
        );
      }
    }
    
    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...data,
        linkedinUrl: data.linkedinUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
      },
      include: {
        skills: { include: { skill: true } },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: candidate,
    });
    
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_candidates_update' }, duration / 1000);
  }
}

// DELETE /api/ats/candidates/[id] - Delete a candidate
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    // Check if candidate exists
    const existing = await prisma.candidate.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }
    
    await prisma.candidate.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_candidates_delete' }, duration / 1000);
  }
}
