import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { storeFile, isValidFileType, isValidFileSize, getAllowedMimeTypes, getMaxFileSize } from '@/lib/ats/storage';
import { metrics } from '@/lib/metrics/prom';

// GET /api/ats/documents - List documents
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');
    const docType = searchParams.get('docType');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    
    const where: Record<string, unknown> = {};
    
    if (candidateId) {
      where.candidateId = candidateId;
    }
    
    if (jobId) {
      where.jobId = jobId;
    }
    
    if (docType) {
      where.docType = docType;
    }
    
    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          job: {
            select: { id: true, title: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: documents,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
    
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_documents_list' }, duration / 1000);
  }
}

// POST /api/ats/documents - Upload a document
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const candidateId = formData.get('candidateId') as string | null;
    const jobId = formData.get('jobId') as string | null;
    const docType = formData.get('docType') as string || 'resume';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type', 
          allowedTypes: getAllowedMimeTypes(),
        },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        { 
          error: 'File too large', 
          maxSize: getMaxFileSize(),
        },
        { status: 400 }
      );
    }
    
    // Validate candidateId or jobId exists if provided
    if (candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
      });
      if (!candidate) {
        return NextResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        );
      }
    }
    
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
    }
    
    // Store the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const storedFile = await storeFile(buffer, file.name, file.type);
    
    // Create document record
    const document = await prisma.document.create({
      data: {
        candidateId: candidateId || null,
        jobId: jobId || null,
        filename: storedFile.filename,
        originalName: storedFile.originalName,
        mimeType: storedFile.mimeType,
        size: storedFile.size,
        storageKey: storedFile.storageKey,
        docType,
        parsed: false,
      },
    });
    
    metrics.telemetry_ingested.inc({ type: 'document_uploaded' });
    
    return NextResponse.json({
      success: true,
      data: document,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_documents_upload' }, duration / 1000);
  }
}
