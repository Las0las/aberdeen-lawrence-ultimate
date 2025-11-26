import type { 
  StructuredProfileData, 
  RawParsedData,
  Experience,
  Education 
} from '@/types/ats';

/**
 * Simple text extraction based on file type
 * In production, this would use specialized libraries like pdf-parse, mammoth, etc.
 */
export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // For text files, directly convert buffer to string
  if (mimeType === 'text/plain' || mimeType === 'text/rtf') {
    return buffer.toString('utf-8');
  }

  // For PDF and Word docs, we would use specialized libraries
  // For now, return placeholder text indicating the format
  if (mimeType === 'application/pdf') {
    // In production: use pdf-parse or similar
    return extractFromPdfBuffer(buffer);
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // In production: use mammoth or similar
    return extractFromWordBuffer(buffer);
  }

  return '';
}

/**
 * Extract text from PDF buffer
 * Placeholder implementation - would use pdf-parse in production
 */
function extractFromPdfBuffer(buffer: Buffer): string {
  // Check for PDF magic bytes
  const header = buffer.slice(0, 5).toString('ascii');
  if (header === '%PDF-') {
    // Basic extraction of visible text (very simplified)
    const text = buffer.toString('latin1');
    // Extract text between stream markers (simplified)
    const textMatches = text.match(/BT\s*(.*?)\s*ET/gs) || [];
    const extractedText = textMatches
      .map(match => {
        // Extract text from Tj and TJ operators
        const tjMatches = match.match(/\((.*?)\)\s*Tj/g) || [];
        return tjMatches.map(t => t.replace(/\((.*?)\)\s*Tj/, '$1')).join(' ');
      })
      .filter(t => t.trim())
      .join('\n');
    
    return extractedText || '[PDF content - specialized parser required]';
  }
  return '[Invalid PDF format]';
}

/**
 * Extract text from Word buffer
 * Placeholder implementation - would use mammoth in production
 */
function extractFromWordBuffer(buffer: Buffer): string {
  // Check for DOCX (ZIP) magic bytes
  const header = buffer.slice(0, 4);
  if (header[0] === 0x50 && header[1] === 0x4B) {
    // DOCX format detected
    return '[DOCX content - specialized parser required]';
  }
  // Old DOC format
  return '[DOC content - specialized parser required]';
}

/**
 * Parse text content into structured profile data using pattern matching
 * This is a simplified implementation - production would use AI/NLP
 */
export function parseResumeText(text: string): { 
  data: StructuredProfileData; 
  confidence: number;
  raw: RawParsedData;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const raw: RawParsedData = { 
    text, 
    sections: {},
    entities: [] 
  };
  
  const data: StructuredProfileData = {
    personalInfo: {},
    experiences: [],
    educations: [],
    skills: [],
  };

  let confidence = 0.5;

  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/i);
  if (emailMatch) {
    data.personalInfo!.email = emailMatch[0].toLowerCase();
    raw.entities!.push({ type: 'email', value: emailMatch[0], confidence: 0.95 });
    confidence += 0.1;
  }

  // Extract phone
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    data.personalInfo!.phone = phoneMatch[0];
    raw.entities!.push({ type: 'phone', value: phoneMatch[0], confidence: 0.9 });
    confidence += 0.05;
  }

  // Extract LinkedIn URL
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/i);
  if (linkedinMatch) {
    data.personalInfo!.linkedinUrl = linkedinMatch[0].startsWith('http') 
      ? linkedinMatch[0] 
      : `https://${linkedinMatch[0]}`;
    raw.entities!.push({ type: 'linkedin', value: linkedinMatch[0], confidence: 0.95 });
    confidence += 0.05;
  }

  // Try to extract name from first lines
  if (lines.length > 0) {
    const firstLine = lines[0];
    // Simple heuristic: first line that doesn't look like email/phone/URL might be name
    if (!firstLine.includes('@') && !firstLine.match(/\d{3}/) && !firstLine.includes('http')) {
      const nameParts = firstLine.split(/\s+/);
      if (nameParts.length >= 2 && nameParts.length <= 4) {
        data.personalInfo!.firstName = nameParts[0];
        data.personalInfo!.lastName = nameParts.slice(1).join(' ');
        confidence += 0.1;
      }
    }
  }

  // Extract location patterns
  const locationPatterns = [
    /(?:located?\s*(?:in|at)?[:.]?\s*)([A-Za-z\s]+,\s*[A-Z]{2})/i,
    /([A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})/,
    /([A-Za-z]+,\s*[A-Z]{2})/,
  ];
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.personalInfo!.location = match[1].trim();
      break;
    }
  }

  // Extract skills section
  const skillsSection = extractSection(text, ['skills', 'technical skills', 'technologies', 'expertise']);
  if (skillsSection) {
    raw.sections!['skills'] = skillsSection;
    const skillsList = extractSkillsList(skillsSection);
    data.skills = skillsList.map(name => ({ name }));
    confidence += 0.1;
  }

  // Extract experience section
  const experienceSection = extractSection(text, ['experience', 'work experience', 'employment', 'professional experience']);
  if (experienceSection) {
    raw.sections!['experience'] = experienceSection;
    data.experiences = parseExperienceSection(experienceSection);
    confidence += 0.1;
  }

  // Extract education section
  const educationSection = extractSection(text, ['education', 'academic background', 'degrees']);
  if (educationSection) {
    raw.sections!['education'] = educationSection;
    data.educations = parseEducationSection(educationSection);
    confidence += 0.1;
  }

  // Extract summary section
  const summarySection = extractSection(text, ['summary', 'profile', 'objective', 'about']);
  if (summarySection) {
    data.summary = summarySection.slice(0, 500);
    raw.sections!['summary'] = summarySection;
  }

  return {
    data,
    confidence: Math.min(confidence, 1),
    raw,
  };
}

/**
 * Extract a section by header keywords
 */
function extractSection(text: string, headers: string[]): string | null {
  const lines = text.split('\n');
  let inSection = false;
  let sectionLines: string[] = [];
  
  const headerPattern = new RegExp(
    `^(?:${headers.join('|')})\\s*[:.]?\\s*$`,
    'i'
  );
  
  const nextSectionPattern = /^(?:experience|education|skills|projects|certifications|references|summary|objective|work|employment)\s*[:.]?\s*$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (headerPattern.test(trimmed)) {
      inSection = true;
      continue;
    }
    
    if (inSection) {
      if (nextSectionPattern.test(trimmed) && !headerPattern.test(trimmed)) {
        break;
      }
      if (trimmed) {
        sectionLines.push(trimmed);
      }
    }
  }

  return sectionLines.length > 0 ? sectionLines.join('\n') : null;
}

/**
 * Extract skills from skills section text
 */
function extractSkillsList(text: string): string[] {
  const skills: string[] = [];
  
  // Split by common delimiters
  const candidates = text.split(/[,;•·|\/\n]+/);
  
  for (const candidate of candidates) {
    const cleaned = candidate.trim()
      .replace(/^[-•*]\s*/, '')
      .replace(/[:]\s*$/, '');
    
    if (cleaned && cleaned.length > 1 && cleaned.length < 50) {
      // Filter out common non-skill text
      if (!cleaned.match(/^(years?|months?|experience|proficient|expert|advanced|intermediate|beginner)/i)) {
        skills.push(cleaned);
      }
    }
  }
  
  return [...new Set(skills)];
}

/**
 * Parse experience entries from section text
 */
function parseExperienceSection(text: string): Omit<Experience, 'id'>[] {
  const experiences: Omit<Experience, 'id'>[] = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  let currentExp: Partial<Omit<Experience, 'id'>> | null = null;
  let highlights: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for date patterns that might indicate a new entry
    const dateMatch = trimmed.match(/(\d{1,2}\/\d{4}|\w+\s*\d{4})\s*[-–—to]+\s*(\d{1,2}\/\d{4}|\w+\s*\d{4}|present|current)/i);
    
    // Check for job title patterns (often all caps or title case with company)
    const titleMatch = trimmed.match(/^([A-Za-z\s]+)\s+(?:at|@|[-–—])\s+(.+)$/i);
    
    if (dateMatch || titleMatch) {
      // Save previous experience if exists
      if (currentExp && currentExp.title) {
        currentExp.highlights = highlights;
        experiences.push(currentExp as Omit<Experience, 'id'>);
        highlights = [];
      }
      
      currentExp = {
        title: '',
        company: '',
        current: false,
        highlights: [],
        order: experiences.length,
      };
      
      if (titleMatch) {
        currentExp.title = titleMatch[1].trim();
        currentExp.company = titleMatch[2].trim();
      } else {
        // Try to extract title from line
        currentExp.title = trimmed.replace(dateMatch![0], '').trim();
      }
      
      if (dateMatch) {
        currentExp.current = /present|current/i.test(dateMatch[2]);
      }
    } else if (currentExp) {
      // Add as highlight/description
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        highlights.push(trimmed.replace(/^[-•*]\s*/, ''));
      } else if (!currentExp.company && trimmed.length < 100) {
        currentExp.company = trimmed;
      } else {
        highlights.push(trimmed);
      }
    }
  }
  
  // Save last experience
  if (currentExp && currentExp.title) {
    currentExp.highlights = highlights;
    experiences.push(currentExp as Omit<Experience, 'id'>);
  }
  
  return experiences;
}

/**
 * Parse education entries from section text
 */
function parseEducationSection(text: string): Omit<Education, 'id' | 'order'>[] {
  const educations: Omit<Education, 'id' | 'order'>[] = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  const degreePatterns = [
    /(?:Bachelor|B\.?S\.?|B\.?A\.?|B\.?Sc\.?)/i,
    /(?:Master|M\.?S\.?|M\.?A\.?|M\.?Sc\.?|MBA)/i,
    /(?:Ph\.?D\.?|Doctor)/i,
    /(?:Associate|A\.?S\.?|A\.?A\.?)/i,
  ];
  
  let currentEdu: Partial<Omit<Education, 'id' | 'order'>> | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for degree patterns
    let foundDegree = false;
    for (const pattern of degreePatterns) {
      if (pattern.test(trimmed)) {
        // Save previous education if exists
        if (currentEdu && currentEdu.institution) {
          educations.push(currentEdu as Omit<Education, 'id' | 'order'>);
        }
        
        currentEdu = {
          institution: '',
          degree: trimmed,
        };
        foundDegree = true;
        break;
      }
    }
    
    if (!foundDegree && currentEdu) {
      // Try to identify institution or field
      if (!currentEdu.institution && trimmed.length < 100) {
        currentEdu.institution = trimmed;
      } else if (!currentEdu.field) {
        currentEdu.field = trimmed;
      }
    }
    
    // Check for GPA
    const gpaMatch = trimmed.match(/GPA:?\s*([\d.]+)/i);
    if (gpaMatch && currentEdu) {
      currentEdu.gpa = parseFloat(gpaMatch[1]);
    }
  }
  
  // Save last education
  if (currentEdu && currentEdu.institution) {
    educations.push(currentEdu as Omit<Education, 'id' | 'order'>);
  }
  
  return educations;
}

/**
 * Calculate match score between candidate profile and job requirements
 */
export function calculateMatchScore(
  profile: StructuredProfileData,
  jobSkills: { name: string; required: boolean; minYears?: number }[]
): { score: number; details: { skill: string; match: boolean; score: number }[] } {
  const details: { skill: string; match: boolean; score: number }[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;
  
  const candidateSkillNames = new Set(
    (profile.skills || []).map(s => s.name.toLowerCase())
  );
  
  for (const jobSkill of jobSkills) {
    const weight = jobSkill.required ? 2 : 1;
    totalWeight += weight;
    
    const hasSkill = candidateSkillNames.has(jobSkill.name.toLowerCase());
    const skillScore = hasSkill ? 1 : 0;
    
    if (hasSkill) {
      matchedWeight += weight * skillScore;
    }
    
    details.push({
      skill: jobSkill.name,
      match: hasSkill,
      score: skillScore,
    });
  }
  
  const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  
  return { score, details };
}
