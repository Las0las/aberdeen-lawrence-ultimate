import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readStoredFile, deleteStoredFile } from '@/lib/ats/storage';
import { metrics } from '@/lib/metrics/prom';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ats/documents/[id] - Get/download a document
export async function GET(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
      },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // If download requested, return the file
    if (download) {
      try {
        const fileBuffer = await readStoredFile(document.storageKey);
        
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            'Content-Type': document.mimeType,
            'Content-Disposition': `attachment; filename="${document.originalName}"`,
            'Content-Length': document.size.toString(),
          },
        });
      } catch {
        return NextResponse.json(
          { error: 'File not found on storage' },
          { status: 404 }
        );
      }
    }
    
    // Return document metadata
    return NextResponse.json({
      success: true,
      data: document,
    });
    
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_documents_get' }, duration / 1000);
  }
}

// DELETE /api/ats/documents/[id] - Delete a document
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    const document = await prisma.document.findUnique({
      where: { id },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete from storage
    try {
      await deleteStoredFile(document.storageKey);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }
    
    // Delete from database
    await prisma.document.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_documents_delete' }, duration / 1000);
  }
}
