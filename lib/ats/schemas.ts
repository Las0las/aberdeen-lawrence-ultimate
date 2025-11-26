import { z } from 'zod';

// Candidate schemas
export const CandidateCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  summary: z.string().optional(),
  status: z.enum(['active', 'inactive', 'hired', 'rejected']).optional(),
  source: z.enum(['resume_upload', 'linkedin', 'referral', 'job_board', 'manual']).optional(),
  tags: z.array(z.string()).optional(),
});

export const CandidateUpdateSchema = CandidateCreateSchema.partial();

export const ExperienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export const EducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.number().min(0).max(4).optional(),
  honors: z.string().optional(),
  order: z.number().optional(),
});

export const SkillSchema = z.object({
  skillId: z.string().optional(),
  name: z.string().min(1),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  yearsExp: z.number().optional(),
});

// Job schemas
export const JobCreateSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().default('USD'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  status: z.enum(['draft', 'open', 'paused', 'closed', 'filled']).optional(),
  priority: z.number().optional(),
  closingDate: z.string().optional(),
});

export const JobUpdateSchema = JobCreateSchema.partial();

export const JobSectionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  sectionType: z.enum(['responsibilities', 'requirements', 'qualifications', 'benefits', 'about', 'custom']),
  order: z.number().optional(),
});

export const JobSkillSchema = z.object({
  skillId: z.string().optional(),
  name: z.string().min(1),
  required: z.boolean().optional(),
  minYears: z.number().optional(),
});

// Application schemas
export const ApplicationCreateSchema = z.object({
  jobId: z.string(),
  candidateId: z.string(),
  notes: z.string().optional(),
});

export const ApplicationUpdateSchema = z.object({
  status: z.enum(['new', 'screening', 'interview', 'offer', 'hired', 'rejected']).optional(),
  stage: z.string().optional(),
  stageOrder: z.number().optional(),
  notes: z.string().optional(),
});

// Document schemas
export const DocumentUploadSchema = z.object({
  candidateId: z.string().optional(),
  jobId: z.string().optional(),
  docType: z.enum(['resume', 'cover_letter', 'portfolio', 'certificate', 'job_description', 'other']),
});

// NL Query schemas
export const NLQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  userId: z.string().optional(),
  execute: z.boolean().optional(),
});

// Reorder schemas (for DnD)
export const ReorderItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    order: z.number(),
  })),
});

// Search schemas
export const SearchCandidatesSchema = z.object({
  query: z.string().optional(),
  skills: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'hired', 'rejected']).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().positive().optional(),
  pageSize: z.number().positive().max(100).optional(),
});

export const SearchJobsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['draft', 'open', 'paused', 'closed', 'filled']).optional(),
  department: z.string().optional(),
  locationType: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional(),
  page: z.number().positive().optional(),
  pageSize: z.number().positive().max(100).optional(),
});

// Types derived from schemas
export type CandidateCreateInput = z.infer<typeof CandidateCreateSchema>;
export type CandidateUpdateInput = z.infer<typeof CandidateUpdateSchema>;
export type ExperienceInput = z.infer<typeof ExperienceSchema>;
export type EducationInput = z.infer<typeof EducationSchema>;
export type SkillInput = z.infer<typeof SkillSchema>;
export type JobCreateInput = z.infer<typeof JobCreateSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type JobSectionInput = z.infer<typeof JobSectionSchema>;
export type JobSkillInput = z.infer<typeof JobSkillSchema>;
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof ApplicationUpdateSchema>;
export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>;
export type NLQueryInput = z.infer<typeof NLQuerySchema>;
export type ReorderItemsInput = z.infer<typeof ReorderItemsSchema>;
export type SearchCandidatesInput = z.infer<typeof SearchCandidatesSchema>;
export type SearchJobsInput = z.infer<typeof SearchJobsSchema>;
