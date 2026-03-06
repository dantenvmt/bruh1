/**
 * API Type Definitions
 * Matches backend FastAPI models
 */

export interface Job {
  id: string;
  dedupe_key?: string; // Optional until EC2 is updated
  source: string | null;
  source_job_id: string | null;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
  salary: string | null;
  employment_type: string | null;
  posted_date: string | null; // ISO date string
  remote: boolean | null;
  category: string | null;
  tags: string[] | null;
  skills: string[] | null;
  created_at: string | null; // ISO datetime string
  updated_at: string | null; // ISO datetime string
}

export interface JobsResponse {
  items: Job[];
  // New cursor-based pagination (once EC2 is updated)
  next_cursor?: string | null;
  as_of?: string; // ISO datetime string - snapshot timestamp
  has_more?: boolean;
  // Legacy offset-based pagination (current EC2)
  limit?: number;
  offset?: number;
}

export interface JobsQueryParams {
  limit?: number;
  cursor?: string | null;
  q?: string | null;
  source?: string | null;
  remote?: boolean | null;
  location?: string | null;
  as_of?: string | null; // For stable pagination across same snapshot
  offset?: number; // Legacy offset pagination (current EC2)
}

export interface ApiError {
  detail: string;
}

export type CritiqueLevel = 'light' | 'balanced' | 'hardcore';

export interface ResumeExtractResponse {
  file_name: string;
  text: string;
  chars: number;
  truncated: boolean;
}

export interface ResumeAnalysisResponse {
  score: number;
  headline: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  priority_actions: string[];
  provider: string;
  model: string;
}

export interface JobAiSummaryResponse {
  job_id: string;
  summary_short: string;
  summary_bullets: string[];
  summary_full: string;
  attention_tags: string[];
  provider: string;
  model: string;
}

export interface ResumeOptimizeResponse {
  job_id: string;
  score_before: number;
  score_after_estimate: number;
  tailored_summary: string;
  rewritten_bullets: string[];
  missing_keywords: string[];
  interview_focus: string[];
  provider: string;
  model: string;
}

// Window type extension for runtime config
declare global {
  interface Window {
    __CONFIG__?: {
      API_URL?: string;
    };
  }
}
