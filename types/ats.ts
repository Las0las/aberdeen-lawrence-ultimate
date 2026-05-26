// ATS Types for Candidate Management

export interface CandidateProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  status: CandidateStatus;
  source?: CandidateSource;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  experiences?: Experience[];
  educations?: Education[];
  skills?: CandidateSkillProfile[];
  documents?: DocumentInfo[];
}

export type CandidateStatus = 'active' | 'inactive' | 'hired' | 'rejected';

export type CandidateSource = 'resume_upload' | 'linkedin' | 'referral' | 'job_board' | 'manual';

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
  highlights: string[];
  order: number;
}

export interface Education {
  id: string;
  institution: string;
  degree?: string;
  field?: string;
  startDate?: Date;
  endDate?: Date;
  gpa?: number;
  honors?: string;
  order: number;
}

export interface CandidateSkillProfile {
  id: string;
  skill: SkillInfo;
  proficiency?: SkillProficiency;
  yearsExp?: number;
  verified: boolean;
}

export type SkillProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillInfo {
  id: string;
  name: string;
  category?: SkillCategory;
  aliases: string[];
}

export type SkillCategory = 'technical' | 'soft' | 'language' | 'certification';

// Document Types

export interface DocumentInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  docType: DocumentType;
  textContent?: string;
  metadata?: Record<string, unknown>;
  parsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'job_description' | 'other';

// Parsed Profile Types

export interface ParsedProfileData {
  id: string;
  candidateId: string;
  documentId?: string;
  rawData: RawParsedData;
  structuredData: StructuredProfileData;
  confidence: number;
  parserVersion: string;
  createdAt: Date;
}

export interface RawParsedData {
  text: string;
  sections?: Record<string, string>;
  entities?: ExtractedEntity[];
  [key: string]: unknown;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  position?: { start: number; end: number };
}

export interface StructuredProfileData {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  summary?: string;
  experiences?: Omit<Experience, 'id'>[];
  educations?: Omit<Education, 'id' | 'order'>[];
  skills?: { name: string; proficiency?: string; yearsExp?: number }[];
  certifications?: { name: string; issuer?: string; date?: string }[];
  languages?: { name: string; proficiency?: string }[];
}

// Job Types

export interface JobPosting {
  id: string;
  title: string;
  department?: string;
  location?: string;
  locationType?: LocationType;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  status: JobStatus;
  priority: number;
  publishedAt?: Date;
  closingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  sections?: JobSection[];
  skills?: JobSkillRequirement[];
}

export type JobStatus = 'draft' | 'open' | 'paused' | 'closed' | 'filled';

export type LocationType = 'remote' | 'onsite' | 'hybrid';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';

export interface JobSection {
  id: string;
  title: string;
  content: string;
  sectionType: JobSectionType;
  order: number;
}

export type JobSectionType = 'responsibilities' | 'requirements' | 'qualifications' | 'benefits' | 'about' | 'custom';

export interface JobSkillRequirement {
  id: string;
  skill: SkillInfo;
  required: boolean;
  minYears?: number;
}

// Application Types

export interface JobApplicationInfo {
  id: string;
  jobId: string;
  job?: Pick<JobPosting, 'id' | 'title' | 'department' | 'status'>;
  candidateId: string;
  candidate?: Pick<CandidateProfile, 'id' | 'firstName' | 'lastName' | 'email'>;
  status: ApplicationStatus;
  stage: string;
  stageOrder: number;
  matchScore?: number;
  matchDetails?: MatchDetails;
  notes?: string;
  appliedAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface MatchDetails {
  overallScore: number;
  skillMatches: { skill: string; match: boolean; score: number }[];
  experienceScore: number;
  educationScore: number;
  reasons: string[];
}

// NL Parser Types

export interface NLQueryResult {
  id: string;
  query: string;
  parsedIntent: NLIntent;
  parsedParams: Record<string, unknown>;
  generatedSQL?: string;
  resultCount?: number;
  successful: boolean;
  errorMessage?: string;
  executionMs?: number;
}

export type NLIntent = 
  | 'search_candidates' 
  | 'create_job' 
  | 'update_candidate' 
  | 'filter' 
  | 'report' 
  | 'create_candidate'
  | 'match_candidates'
  | 'unknown';

export interface NLParseResult {
  intent: NLIntent;
  confidence: number;
  params: Record<string, unknown>;
  suggestedAction?: string;
}

// DnD Types

export interface DragItem {
  id: string;
  type: 'experience' | 'education' | 'section' | 'application' | 'skill';
  index: number;
  data?: unknown;
}

export interface DropResult {
  sourceId: string;
  destinationId: string;
  sourceIndex: number;
  destinationIndex: number;
  type: DragItem['type'];
}

// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// File Upload Types

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  storageKey: string;
}

export interface ParsedResumeResult {
  documentId: string;
  candidateId?: string;
  profile: StructuredProfileData;
  confidence: number;
  suggestions?: string[];
}
