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
  experience_level: string | null;
  experience_min_years: number | null;
  experience_max_years: number | null;
  required_skills: string[] | null;
  industry: string | null;
  work_mode: string | null;
  created_at: string | null; // ISO datetime string
  updated_at: string | null; // ISO datetime string
  // AI-generated summaries (stored in DB, returned with every job)
  ai_summary_card: string | null;
  ai_summary_detail: JobSummaryResponse | null;
  ai_summarized_at: string | null;
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
  profile_skills?: string;
  profile_experience_years?: number | null;
  user_id?: string | null;
}

export interface ApiError {
  detail: string;
}

// Resume upload response
export interface ResumeUploadResponse {
  resume_id: string;
  user_id: string;
  extracted_text_preview: string;
  filename: string | null;
  extracted_skills: string[];
  extracted_experience_years: number | null;
  skills_extracted: boolean;
  created_at: string;
}

// Job AI summary
export interface JobSummaryResponse {
  job_id: string;
  summary_short: string;
  summary_bullets: string[];
  attention_tags: string[];
}

// Resume analysis (general critique)
export type CritiqueLevel = 'light' | 'balanced' | 'hardcore';

export interface ResumeAnalysisResponse {
  score: number;
  headline: string;
  strengths: string[];
  gaps: string[];
  priority_actions: string[];
}

// Resume match profile (extracted skills for scorer)
export interface ResumeMatchProfile {
  user_id: string;
  skills: string[];
  experience_years: number | null;
  skills_extracted: boolean;
}

// Match score response (existing endpoint)
export interface JobMatchResponse {
  job_id: string;
  match_score: number;
  fit_band: string;
  breakdown: Record<string, unknown>;
  reasons: string[];
  gaps: string[];
}

// Resume fetch response
export interface ResumeGetResponse {
  resume_id: string;
  user_id: string;
  raw_text: string;
  filename: string | null;
  created_at: string;
  updated_at: string;
}

// Optimize mode
export type OptimizeMode = 'bullets' | 'overview' | 'full_rewrite';

// Bullet suggestion item
export interface BulletSuggestion {
  original: string;
  improved: string;
  reason: string;
}

// Overview suggestion object
export interface OverviewSuggestion {
  original_summary: string;
  optimized_summary: string;
  key_changes: string[];
}

// bullets mode response
export interface OptimizeBulletsResponse {
  job_id: string;
  mode: 'bullets';
  suggestions: BulletSuggestion[];
}

// overview mode response
export interface OptimizeOverviewResponse {
  job_id: string;
  mode: 'overview';
  suggestions: OverviewSuggestion;
}

// full_rewrite mode response
export interface OptimizeFullRewriteResponse {
  job_id: string;
  mode: 'full_rewrite';
  optimized_resume: string;
}

export type ResumeOptimizeResponse =
  | OptimizeBulletsResponse
  | OptimizeOverviewResponse
  | OptimizeFullRewriteResponse;

// Window type extension for runtime config
declare global {
  interface Window {
    __CONFIG__?: {
      API_URL?: string;
    };
  }
}
