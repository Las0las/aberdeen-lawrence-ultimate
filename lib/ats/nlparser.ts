import type { NLIntent, NLParseResult } from '@/types/ats';

/**
 * Parse natural language query and determine intent
 */
export function parseNLQuery(query: string): NLParseResult {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Determine intent based on keywords
  const intent = detectIntent(normalizedQuery);
  const params = extractParams(normalizedQuery, intent);
  const confidence = calculateConfidence(normalizedQuery, intent, params);
  
  return {
    intent,
    confidence,
    params,
    suggestedAction: getSuggestedAction(intent, params),
  };
}

/**
 * Detect the primary intent of the query
 */
function detectIntent(query: string): NLIntent {
  // Search candidates patterns
  const searchCandidatePatterns = [
    /find\s+(?:me\s+)?(?:all\s+)?candidates?/i,
    /search\s+(?:for\s+)?candidates?/i,
    /show\s+(?:me\s+)?candidates?/i,
    /list\s+candidates?/i,
    /who\s+(?:are|is|has|have)/i,
    /candidates?\s+(?:with|who|that)/i,
  ];
  
  if (searchCandidatePatterns.some(p => p.test(query))) {
    return 'search_candidates';
  }
  
  // Match candidates to job
  const matchPatterns = [
    /match\s+candidates?\s+(?:to|for|with)/i,
    /(?:best|top)\s+candidates?\s+for/i,
    /who\s+(?:would\s+)?(?:be\s+)?good\s+for/i,
    /suitable\s+candidates?\s+for/i,
  ];
  
  if (matchPatterns.some(p => p.test(query))) {
    return 'match_candidates';
  }
  
  // Create job patterns
  const createJobPatterns = [
    /create\s+(?:a\s+)?(?:new\s+)?job/i,
    /add\s+(?:a\s+)?(?:new\s+)?job/i,
    /post\s+(?:a\s+)?(?:new\s+)?job/i,
    /new\s+job\s+(?:posting|opening)/i,
  ];
  
  if (createJobPatterns.some(p => p.test(query))) {
    return 'create_job';
  }
  
  // Create candidate patterns
  const createCandidatePatterns = [
    /create\s+(?:a\s+)?(?:new\s+)?candidate/i,
    /add\s+(?:a\s+)?(?:new\s+)?candidate/i,
    /register\s+(?:a\s+)?candidate/i,
  ];
  
  if (createCandidatePatterns.some(p => p.test(query))) {
    return 'create_candidate';
  }
  
  // Update candidate patterns
  const updateCandidatePatterns = [
    /update\s+candidate/i,
    /edit\s+candidate/i,
    /modify\s+candidate/i,
    /change\s+candidate/i,
  ];
  
  if (updateCandidatePatterns.some(p => p.test(query))) {
    return 'update_candidate';
  }
  
  // Filter patterns
  const filterPatterns = [
    /filter\s+by/i,
    /only\s+show/i,
    /narrow\s+(?:down|by)/i,
    /(?:with|having)\s+(?:more\s+than|at\s+least|over)/i,
  ];
  
  if (filterPatterns.some(p => p.test(query))) {
    return 'filter';
  }
  
  // Report patterns
  const reportPatterns = [
    /report\s+(?:on|for)/i,
    /statistics/i,
    /analytics/i,
    /how\s+many/i,
    /count\s+(?:of|all)/i,
    /summary\s+(?:of|report)/i,
  ];
  
  if (reportPatterns.some(p => p.test(query))) {
    return 'report';
  }
  
  // Default to search candidates if contains candidate-related keywords
  if (/candidate|resume|applicant|hire/i.test(query)) {
    return 'search_candidates';
  }
  
  return 'unknown';
}

/**
 * Extract parameters from the query based on intent
 */
function extractParams(query: string, intent: NLIntent): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  
  // Extract skills
  const skillPatterns = [
    /(?:with|know(?:s|ing)?|experienced?\s+(?:in|with))\s+([a-zA-Z0-9#+.\s,]+)/i,
    /([a-zA-Z0-9#+.]+)\s+(?:developer|engineer|designer|specialist)/i,
    /skills?:?\s*([a-zA-Z0-9#+.\s,]+)/i,
  ];
  
  for (const pattern of skillPatterns) {
    const match = query.match(pattern);
    if (match) {
      const skillsText = match[1];
      const skills = skillsText
        .split(/[,\s]+(?:and|or|&)?\s*/i)
        .map(s => s.trim())
        .filter(s => s.length > 1 && s.length < 30);
      if (skills.length > 0) {
        params.skills = skills;
        break;
      }
    }
  }
  
  // Extract years of experience
  const yearsMatch = query.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience)?/i);
  if (yearsMatch) {
    params.minYearsExperience = parseInt(yearsMatch[1], 10);
  }
  
  // Extract location
  const locationPatterns = [
    /(?:in|from|located?\s+(?:in|at)|based\s+in)\s+([a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/i,
    /location:?\s*([a-zA-Z\s,]+)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      params.location = match[1].trim();
      break;
    }
  }
  
  // Extract status
  if (/active/i.test(query)) params.status = 'active';
  if (/inactive/i.test(query)) params.status = 'inactive';
  if (/hired/i.test(query)) params.status = 'hired';
  if (/rejected/i.test(query)) params.status = 'rejected';
  
  // Extract job title for job creation
  const titleMatch = query.match(/(?:job|position|role)\s+(?:for|titled?|called)\s+["']?([^"']+)["']?/i);
  if (titleMatch) {
    params.title = titleMatch[1].trim();
  }
  
  // Extract department
  const deptMatch = query.match(/(?:in|for)\s+(?:the\s+)?([a-zA-Z]+)\s+(?:department|team)/i);
  if (deptMatch) {
    params.department = deptMatch[1].trim();
  }
  
  // Extract limit/count
  const limitMatch = query.match(/(?:top|first|show\s+me)\s+(\d+)/i);
  if (limitMatch) {
    params.limit = parseInt(limitMatch[1], 10);
  }
  
  // Extract remote/onsite preference
  if (/remote/i.test(query)) params.locationType = 'remote';
  if (/onsite|on-site|office/i.test(query)) params.locationType = 'onsite';
  if (/hybrid/i.test(query)) params.locationType = 'hybrid';
  
  // Extract employment type
  if (/full[\s-]?time/i.test(query)) params.employmentType = 'full_time';
  if (/part[\s-]?time/i.test(query)) params.employmentType = 'part_time';
  if (/contract/i.test(query)) params.employmentType = 'contract';
  if (/internship|intern/i.test(query)) params.employmentType = 'internship';
  
  // Extract candidate name or email for update queries
  if (intent === 'update_candidate') {
    const emailMatch = query.match(/[\w.-]+@[\w.-]+\.\w+/i);
    if (emailMatch) {
      params.email = emailMatch[0].toLowerCase();
    }
    
    const nameMatch = query.match(/candidate\s+([a-zA-Z]+\s+[a-zA-Z]+)/i);
    if (nameMatch) {
      params.name = nameMatch[1].trim();
    }
  }
  
  return params;
}

/**
 * Calculate confidence score for the parsing result
 */
function calculateConfidence(
  query: string,
  intent: NLIntent,
  params: Record<string, unknown>
): number {
  let confidence = 0.3; // Base confidence
  
  // Intent was recognized
  if (intent !== 'unknown') {
    confidence += 0.3;
  }
  
  // Parameters were extracted
  const paramCount = Object.keys(params).length;
  confidence += Math.min(paramCount * 0.1, 0.3);
  
  // Query length indicates more specific request
  const wordCount = query.split(/\s+/).length;
  if (wordCount >= 3 && wordCount <= 20) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1);
}

/**
 * Get suggested action based on parsed result
 */
function getSuggestedAction(
  intent: NLIntent,
  params: Record<string, unknown>
): string {
  switch (intent) {
    case 'search_candidates':
      if (params.skills) {
        return `Search for candidates with skills: ${(params.skills as string[]).join(', ')}`;
      }
      return 'Search for candidates matching your criteria';
      
    case 'match_candidates':
      return 'Find best matching candidates for the specified job';
      
    case 'create_job':
      if (params.title) {
        return `Create new job posting: ${params.title}`;
      }
      return 'Create a new job posting';
      
    case 'create_candidate':
      return 'Create a new candidate profile';
      
    case 'update_candidate':
      return 'Update an existing candidate profile';
      
    case 'filter':
      return 'Apply filters to narrow down results';
      
    case 'report':
      return 'Generate analytics report';
      
    default:
      return 'Could not determine the intended action. Please try rephrasing.';
  }
}

/**
 * Build a Prisma where clause from parsed parameters
 */
export function buildPrismaWhere(params: Record<string, unknown>): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  
  if (params.status) {
    where.status = params.status;
  }
  
  if (params.location) {
    where.location = {
      contains: params.location,
      mode: 'insensitive',
    };
  }
  
  if (params.skills && Array.isArray(params.skills)) {
    where.skills = {
      some: {
        skill: {
          name: {
            in: params.skills,
            mode: 'insensitive',
          },
        },
      },
    };
  }
  
  if (params.locationType) {
    where.locationType = params.locationType;
  }
  
  if (params.employmentType) {
    where.employmentType = params.employmentType;
  }
  
  if (params.department) {
    where.department = {
      contains: params.department,
      mode: 'insensitive',
    };
  }
  
  if (params.email) {
    where.email = params.email;
  }
  
  return where;
}

/**
 * Generate a human-readable SQL-like description of the query
 */
export function generateQueryDescription(
  intent: NLIntent,
  params: Record<string, unknown>
): string {
  const conditions: string[] = [];
  
  if (params.status) {
    conditions.push(`status = '${params.status}'`);
  }
  
  if (params.location) {
    conditions.push(`location LIKE '%${params.location}%'`);
  }
  
  if (params.skills && Array.isArray(params.skills)) {
    conditions.push(`skills IN (${(params.skills as string[]).map(s => `'${s}'`).join(', ')})`);
  }
  
  if (params.minYearsExperience) {
    conditions.push(`years_experience >= ${params.minYearsExperience}`);
  }
  
  let table = 'candidates';
  if (intent === 'create_job' || intent === 'match_candidates') {
    table = 'jobs';
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}` 
    : '';
  
  const limitClause = params.limit ? `LIMIT ${params.limit}` : '';
  
  return `SELECT * FROM ${table} ${whereClause} ${limitClause}`.trim();
}
