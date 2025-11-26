import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ExperienceSchema, ReorderItemsSchema } from '@/lib/ats/schemas';
import { metrics } from '@/lib/metrics/prom';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ats/candidates/[id]/experiences - List experiences
export async function GET(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    const experiences = await prisma.experience.findMany({
      where: { candidateId: id },
      orderBy: { order: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: experiences,
    });
    
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiences' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_experiences_list' }, duration / 1000);
  }
}

// POST /api/ats/candidates/[id]/experiences - Add experience
export async function POST(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = ExperienceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error },
        { status: 400 }
      );
    }
    
    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }
    
    const data = validation.data;
    
    // Get max order for this candidate's experiences
    const maxOrder = await prisma.experience.aggregate({
      where: { candidateId: id },
      _max: { order: true },
    });
    
    const experience = await prisma.experience.create({
      data: {
        candidateId: id,
        title: data.title,
        company: data.company,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        current: data.current || false,
        description: data.description,
        highlights: data.highlights || [],
        order: data.order ?? (maxOrder._max.order ?? -1) + 1,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: experience,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating experience:', error);
    return NextResponse.json(
      { error: 'Failed to create experience' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_experiences_create' }, duration / 1000);
  }
}

// PUT /api/ats/candidates/[id]/experiences - Reorder experiences (for DnD)
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
    
    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }
    
    // Update order for each experience
    const updates = validation.data.items.map(item =>
      prisma.experience.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );
    
    await prisma.$transaction(updates);
    
    const experiences = await prisma.experience.findMany({
      where: { candidateId: id },
      orderBy: { order: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: experiences,
    });
    
  } catch (error) {
    console.error('Error reordering experiences:', error);
    return NextResponse.json(
      { error: 'Failed to reorder experiences' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_experiences_reorder' }, duration / 1000);
  }
}
