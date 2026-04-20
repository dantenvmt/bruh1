import { formatDistanceToNow } from 'date-fns';

import type { Job } from '@/api/types';
import {
  getDisplayCompensation,
  getWorkModeLabel,
  getWorkModeSignal,
  getVisaSignal,
} from '@/lib/jobSignals';

export type JobTagTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger';

export interface JobTag {
  label: string;
  tone: JobTagTone;
}

export function formatPostedDate(dateString: string | null): string {
  if (!dateString) return 'Recently';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

export function formatEmploymentType(value: string | null): string | null {
  if (!value?.trim()) return null;
  return value.trim().replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\r?\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(
      /\b(Posting Date|Headquarters|URL|Website|Location|Industry|Company size|Founded|Job Type|Job Title|Experience Level)[:\s][^.!?]*/gi,
      '',
    )
    .replace(/\b(Article|Comments?|Points?|#\s*Comments?)[:\s]\S*\s*/gi, '')
    .replace(/\bOur Mission\b\s*/gi, '')
    .replace(/\bJob Summary:\s*/gi, '')
    .replace(/^[^a-zA-Z$]*/, '')
    .trim();
}

export function extractSkillTags(job: Job, limit = 4): string[] {
  const structured = [...(job.required_skills ?? []), ...(job.skills ?? [])];

  if (structured.length > 0) {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const skill of structured) {
      const normalized = skill.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(skill.trim());
      if (result.length >= limit) break;
    }

    if (result.length > 0) return result;
  }

  if (!job.description) return [];

  const probes: Array<[RegExp, string]> = [
    [/\bpython\b/i, 'Python'],
    [/\btypescript\b/i, 'TypeScript'],
    [/\bjavascript\b/i, 'JavaScript'],
    [/\breact\.?js\b|\breact\b/i, 'React'],
    [/\bnode\.?js\b/i, 'Node.js'],
    [/\baws\b/i, 'AWS'],
    [/\bsql\b/i, 'SQL'],
    [/\bjava\b(?!script)/i, 'Java'],
    [/\bkubernetes\b|\bk8s\b/i, 'Kubernetes'],
    [/\bdocker\b/i, 'Docker'],
    [/\bgolang\b/i, 'Go'],
    [/\bterraform\b/i, 'Terraform'],
    [/\bfigma\b/i, 'Figma'],
    [/\bdevops\b/i, 'DevOps'],
    [/\bsecurity\b/i, 'Security'],
    [/\bcloud\b/i, 'Cloud'],
  ];

  const found: string[] = [];
  for (const [regex, label] of probes) {
    if (found.length >= limit) break;
    if (regex.test(job.description)) found.push(label);
  }

  return found;
}

export function getJobSummaryBullets(job: Job, limit = 3): string[] {
  const aiBullets = job.ai_summary_detail?.summary_bullets?.filter(Boolean) ?? [];
  if (aiBullets.length > 0) return aiBullets.slice(0, limit);

  if (!job.description) return [];

  return cleanDescription(job.description)
    .split(/(?<=[a-z,)])\.\s+(?=[A-Z])/)
    .map((sentence) => sentence.trim())
    .filter(
      (sentence) =>
        sentence.length > 42 &&
        /^[A-Z]/.test(sentence) &&
        !/^(http|www\.)/i.test(sentence) &&
        !sentence.includes('/'),
    )
    .slice(0, limit);
}

function getExperienceTag(job: Job): string | null {
  const haystack = `${job.title ?? ''} ${job.description ?? ''}`;
  const match = haystack.match(/(\d+)\s*(?:-|to)?\s*(\d+)?\s*\+?\s*years?/i);
  if (!match) return null;

  const low = Number.parseInt(match[1], 10);
  const high = match[2] ? Number.parseInt(match[2], 10) : null;

  if (high) return `${low}-${high} yrs`;
  return match[0].includes('+') ? `${low}+ yrs` : `${low} yrs`;
}

export function buildJobTags(job: Job): JobTag[] {
  const tags: JobTag[] = [];

  const compensation = getDisplayCompensation(job);
  if (compensation) tags.push({ label: compensation, tone: 'accent' });

  const workMode = getWorkModeSignal(job);
  if (workMode !== 'unspecified') {
    tags.push({
      label: getWorkModeLabel(workMode),
      tone: workMode === 'remote' ? 'success' : 'neutral',
    });
  }

  const experience = getExperienceTag(job);
  if (experience) tags.push({ label: experience, tone: 'warning' });

  const employmentType = formatEmploymentType(job.employment_type);
  if (employmentType) tags.push({ label: employmentType, tone: 'neutral' });

  const visaSignal = getVisaSignal(job);
  if (visaSignal === 'friendly') tags.push({ label: 'Visa OK', tone: 'success' });
  if (visaSignal === 'not_supported') tags.push({ label: 'No sponsorship', tone: 'danger' });

  return tags.slice(0, 5);
}

export function getTagClasses(tone: JobTagTone): string {
  switch (tone) {
    case 'accent':
      return 'border-white/15 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]';
    case 'success':
      return 'border-emerald-400/25 bg-emerald-400/12 text-emerald-100';
    case 'warning':
      return 'border-amber-300/25 bg-amber-300/12 text-amber-100';
    case 'danger':
      return 'border-rose-300/25 bg-rose-300/12 text-rose-100';
    case 'neutral':
    default:
      return 'border-white/10 bg-white/[0.045] text-white/72';
  }
}
