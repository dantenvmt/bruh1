/**
 * API Client
 * Handles all backend communication with runtime configuration
 */

import type { JobsResponse, JobsQueryParams, ApiError } from './types';
import type {
  CritiqueLevel,
  JobMatchResponse,
  OptimizeMode,
  ResumeAnalysisResponse,
  ResumeMatchProfile,
  ResumeOptimizeResponse,
  ResumeUploadResponse,
} from './types';

/**
 * Get API base URL from runtime config or fallback to env variable
 */
function getApiUrl(): string {
  // Try runtime config first (injected at deploy time)
  if (typeof window !== 'undefined' && window.__CONFIG__?.API_URL) {
    const url = window.__CONFIG__.API_URL;
    // Don't use placeholder in development
    if (url !== '__API_URL_PLACEHOLDER__') {
      return url;
    }
  }

  // Fallback to Vite env variable for local development
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const baseUrl = getApiUrl();
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${cleanBase}${cleanEndpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const isFormData =
      typeof FormData !== 'undefined' && options?.body instanceof FormData;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

/**
 * Fetch jobs with cursor pagination
 */
export async function fetchJobs(params?: JobsQueryParams): Promise<JobsResponse> {
  const url = buildUrl('/api/v1/jobs', params as Record<string, unknown>);
  return fetchApi<JobsResponse>(url);
}

/**
 * Fetch recommended jobs based on user preferences algorithm
 */
export async function fetchRecommendedJobs(params?: JobsQueryParams): Promise<JobsResponse> {
  const url = buildUrl('/api/v1/jobs/recommended', params as Record<string, unknown>);
  return fetchApi<JobsResponse>(url);
}

/**
 * Upload a PDF resume for a user. Returns extracted text preview.
 */
export async function uploadResume(userId: string, file: File): Promise<ResumeUploadResponse> {
  const url = buildUrl('/api/v1/resume', { user_id: userId });
  const form = new FormData();
  form.append('file', file);
  return fetchApi<ResumeUploadResponse>(url, { method: 'POST', body: form });
}

/**
 * Optimize a user's saved resume against a specific job.
 */
export async function optimizeResumeForJob(
  jobId: string,
  userId: string,
  mode: OptimizeMode
): Promise<ResumeOptimizeResponse> {
  const url = buildUrl(`/api/v1/jobs/${jobId}/optimize-resume`, { user_id: userId });
  return fetchApi<ResumeOptimizeResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

/**
 * Analyze a user's resume generally (critique + score).
 */
export async function analyzeResume(
  userId: string,
  critiqueLevel: CritiqueLevel
): Promise<ResumeAnalysisResponse> {
  const url = buildUrl('/api/v1/resume/analyze', { user_id: userId });
  return fetchApi<ResumeAnalysisResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ critique_level: critiqueLevel }),
  });
}

/**
 * Fetch the extracted skills/experience profile from the user's stored resume.
 * Used to power the match scorer.
 */
export async function fetchResumeMatchProfile(userId: string): Promise<ResumeMatchProfile> {
  const url = buildUrl('/api/v1/resume/match-profile', { user_id: userId });
  return fetchApi<ResumeMatchProfile>(url);
}

/**
 * Get rule-based match score for a job against a user profile.
 */
export async function fetchJobMatchScore(
  jobId: string,
  skills: string[],
  experienceYears: number | null
): Promise<JobMatchResponse> {
  const url = buildUrl(`/api/v1/jobs/${jobId}/match`);
  return fetchApi<JobMatchResponse>(url, {
    method: 'POST',
    body: JSON.stringify({
      profile_skills: skills,
      profile_experience_years: experienceYears,
    }),
  });
}

/**
 * API client object
 */
export const api = {
  jobs: {
    list: fetchJobs,
    matchScore: fetchJobMatchScore,
    recommended: fetchRecommendedJobs,
  },
  resume: {
    upload: uploadResume,
    analyze: analyzeResume,
    optimize: optimizeResumeForJob,
    matchProfile: fetchResumeMatchProfile,
  },
};

export default api;
