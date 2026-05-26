import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readStoredFile } from '@/lib/ats/storage';
import { extractTextFromDocument, parseResumeText } from '@/lib/ats/parser';
import { metrics } from '@/lib/metrics/prom';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/ats/documents/[id]/parse - Parse a document and extract profile data
export async function POST(req: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { createCandidate = false, updateCandidate = false, candidateId = null } = body;
    
    const document = await prisma.document.findUnique({
      where: { id },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readStoredFile(document.storageKey);
    } catch {
      return NextResponse.json(
        { error: 'File not found on storage' },
        { status: 404 }
      );
    }
    
    // Extract text from document
    const textContent = await extractTextFromDocument(fileBuffer, document.mimeType);
    
    // Parse the text to structured data
    const { data: structuredData, confidence, raw: rawData } = parseResumeText(textContent);
    
    // Update document with parsed text
    await prisma.document.update({
      where: { id },
      data: {
        textContent,
        parsed: true,
        metadata: {
          parsedAt: new Date().toISOString(),
          confidence,
        },
      },
    });
    
    let candidate = null;
    let parsedProfile = null;
    
    // Handle candidate creation/update
    if (createCandidate && structuredData.personalInfo?.email) {
      // Check if candidate already exists
      const existing = await prisma.candidate.findUnique({
        where: { email: structuredData.personalInfo.email },
      });
      
      if (existing) {
        candidate = existing;
      } else {
        // Create new candidate
        candidate = await prisma.candidate.create({
          data: {
            email: structuredData.personalInfo.email,
            firstName: structuredData.personalInfo.firstName || 'Unknown',
            lastName: structuredData.personalInfo.lastName || 'Unknown',
            phone: structuredData.personalInfo.phone,
            location: structuredData.personalInfo.location,
            linkedinUrl: structuredData.personalInfo.linkedinUrl,
            portfolioUrl: structuredData.personalInfo.portfolioUrl,
            summary: structuredData.summary,
            source: 'resume_upload',
            status: 'active',
            tags: [],
          },
        });
        
        // Link document to candidate
        await prisma.document.update({
          where: { id },
          data: { candidateId: candidate.id },
        });
        
        metrics.telemetry_ingested.inc({ type: 'candidate_created_from_parse' });
      }
    } else if (updateCandidate && (candidateId || document.candidateId)) {
      const targetCandidateId = candidateId || document.candidateId;
      
      candidate = await prisma.candidate.findUnique({
        where: { id: targetCandidateId },
      });
      
      if (candidate) {
        // Update candidate with parsed data
        await prisma.candidate.update({
          where: { id: targetCandidateId },
          data: {
            phone: structuredData.personalInfo?.phone || candidate.phone,
            location: structuredData.personalInfo?.location || candidate.location,
            linkedinUrl: structuredData.personalInfo?.linkedinUrl || candidate.linkedinUrl,
            portfolioUrl: structuredData.personalInfo?.portfolioUrl || candidate.portfolioUrl,
            summary: structuredData.summary || candidate.summary,
          },
        });
      }
    }
    
    // Create parsed profile record if we have a candidate
    const targetCandidateId = candidate?.id || candidateId || document.candidateId;
    if (targetCandidateId) {
      parsedProfile = await prisma.parsedProfile.create({
        data: {
          candidateId: targetCandidateId,
          documentId: id,
          rawData: rawData as object,
          structuredData: structuredData as object,
          confidence,
          parserVersion: 'v1.0',
        },
      });
      
      // Create experiences if we have them
      if (structuredData.experiences && structuredData.experiences.length > 0) {
        await prisma.experience.createMany({
          data: structuredData.experiences.map((exp, index) => ({
            candidateId: targetCandidateId,
            title: exp.title,
            company: exp.company,
            location: exp.location || null,
            startDate: null, // Would need date parsing
            endDate: null,
            current: exp.current || false,
            description: exp.description || null,
            highlights: exp.highlights || [],
            order: index,
          })),
          skipDuplicates: true,
        });
      }
      
      // Create educations if we have them
      if (structuredData.educations && structuredData.educations.length > 0) {
        await prisma.education.createMany({
          data: structuredData.educations.map((edu, index) => ({
            candidateId: targetCandidateId,
            institution: edu.institution,
            degree: edu.degree || null,
            field: edu.field || null,
            startDate: null, // Would need date parsing
            endDate: null,
            gpa: edu.gpa || null,
            honors: edu.honors || null,
            order: index,
          })),
          skipDuplicates: true,
        });
      }
      
      // Create skills if we have them
      if (structuredData.skills && structuredData.skills.length > 0) {
        for (const skillData of structuredData.skills) {
          // Find or create skill
          let skill = await prisma.skill.findUnique({
            where: { name: skillData.name },
          });
          
          if (!skill) {
            skill = await prisma.skill.create({
              data: {
                name: skillData.name,
                category: 'technical',
                aliases: [],
              },
            });
          }
          
          // Create candidate-skill association
          await prisma.candidateSkill.upsert({
            where: {
              candidateId_skillId: {
                candidateId: targetCandidateId,
                skillId: skill.id,
              },
            },
            create: {
              candidateId: targetCandidateId,
              skillId: skill.id,
              proficiency: skillData.proficiency as string | undefined,
              yearsExp: skillData.yearsExp,
              verified: false,
            },
            update: {},
          });
        }
      }
    }
    
    metrics.telemetry_ingested.inc({ type: 'document_parsed' });
    
    return NextResponse.json({
      success: true,
      data: {
        documentId: id,
        textContent: textContent.slice(0, 500) + (textContent.length > 500 ? '...' : ''),
        structuredData,
        confidence,
        candidateId: targetCandidateId,
        candidate: candidate ? {
          id: candidate.id,
          email: candidate.email,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
        } : null,
        parsedProfileId: parsedProfile?.id,
      },
    });
    
  } catch (error) {
    console.error('Error parsing document:', error);
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    );
  } finally {
    const duration = Date.now() - startTime;
    metrics.api_latency.observe({ route: 'ats_documents_parse' }, duration / 1000);
  }
}
