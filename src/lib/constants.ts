/**
 * Application Constants
 */

export const JOB_SOURCES = [
  { value: 'USAJobs', label: 'USAJobs' },
  { value: 'Adzuna', label: 'Adzuna' },
  { value: 'JSearch', label: 'JSearch' },
  { value: 'Greenhouse', label: 'Greenhouse' },
  { value: 'Lever', label: 'Lever' },
  { value: 'RemoteOK', label: 'RemoteOK' },
  { value: 'TheMuse', label: 'The Muse' },
  { value: 'Remotive', label: 'Remotive' },
  { value: 'Findwork', label: 'Findwork' },
  { value: 'CareerOneStop', label: 'CareerOneStop' },
  { value: 'HN RSS', label: 'HN RSS' },
] as const;

export type JobSource = typeof JOB_SOURCES[number]['value'];

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'temporary',
  'internship',
] as const;

export type EmploymentType = typeof EMPLOYMENT_TYPES[number];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
