/**
 * API Client
 * Handles all backend communication with runtime configuration
 */

import type { JobsResponse, JobsQueryParams, ApiError } from './types';
import type {
  CritiqueLevel,
  JobAiSummaryResponse,
  ResumeAnalysisResponse,
  ResumeExtractResponse,
  ResumeOptimizeResponse,
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
  const url = buildUrl('/jobs', params as Record<string, unknown>);
  return fetchApi<JobsResponse>(url);
}

export async function fetchAiJobSummary(jobId: string): Promise<JobAiSummaryResponse> {
  const url = buildUrl(`/ai/jobs/${jobId}/summary`);
  return fetchApi<JobAiSummaryResponse>(url, {
    method: 'POST',
  });
}

export async function extractResumeFromFile(file: File): Promise<ResumeExtractResponse> {
  const url = buildUrl('/ai/resume/extract');
  const form = new FormData();
  form.append('file', file);
  return fetchApi<ResumeExtractResponse>(url, {
    method: 'POST',
    body: form,
  });
}

export async function analyzeResume(
  resumeText: string,
  critiqueLevel: CritiqueLevel
): Promise<ResumeAnalysisResponse> {
  const url = buildUrl('/ai/resume/analyze');
  return fetchApi<ResumeAnalysisResponse>(url, {
    method: 'POST',
    body: JSON.stringify({
      resume_text: resumeText,
      critique_level: critiqueLevel,
    }),
  });
}

export async function optimizeResumeForJob(
  jobId: string,
  resumeText: string,
  critiqueLevel: CritiqueLevel
): Promise<ResumeOptimizeResponse> {
  const url = buildUrl(`/ai/jobs/${jobId}/resume-optimize`);
  return fetchApi<ResumeOptimizeResponse>(url, {
    method: 'POST',
    body: JSON.stringify({
      resume_text: resumeText,
      critique_level: critiqueLevel,
    }),
  });
}

/**
 * API client object (for future expansion)
 */
export const api = {
  jobs: {
    list: fetchJobs,
  },
  ai: {
    summary: fetchAiJobSummary,
    extractResume: extractResumeFromFile,
    analyzeResume,
    optimizeResumeForJob,
  },
};

export default api;
