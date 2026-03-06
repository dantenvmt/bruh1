import type { Job } from '@/api/types';

export type VisaSignal = 'friendly' | 'not_supported' | 'unknown';
export type WorkModeSignal = 'remote' | 'hybrid' | 'onsite' | 'unspecified';

const VISA_POSITIVE = new Set(['visa_friendly', 'visa_h1b', 'visa_opt', 'visa_sponsor_company']);
const VISA_NEGATIVE = new Set(['visa_no_sponsorship']);

function normalizeTags(tags: string[] | null | undefined): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  return tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
}

export function getVisaSignal(job: Job): VisaSignal {
  const tags = normalizeTags(job.tags);
  if (tags.some((tag) => VISA_NEGATIVE.has(tag))) return 'not_supported';
  if (tags.some((tag) => VISA_POSITIVE.has(tag))) return 'friendly';

  const haystack = `${job.title ?? ''} ${job.description ?? ''}`.toLowerCase();
  if (
    /\b(h-?1b|h1b|opt|cpt|visa sponsorship|sponsorship available|will sponsor)\b/i.test(haystack)
  ) {
    return 'friendly';
  }
  if (/\b(no sponsorship|without sponsorship|cannot sponsor|will not sponsor)\b/i.test(haystack)) {
    return 'not_supported';
  }
  return 'unknown';
}

export function getVisaLabel(signal: VisaSignal): string {
  if (signal === 'friendly') return 'Visa friendly';
  if (signal === 'not_supported') return 'No sponsorship';
  return 'Visa unknown';
}

export function getWorkModeSignal(job: Job): WorkModeSignal {
  const location = (job.location ?? '').toLowerCase();
  const title = (job.title ?? '').toLowerCase();
  const description = (job.description ?? '').toLowerCase();
  const tags = normalizeTags(job.tags).join(' ');
  const haystack = `${location} ${title} ${description} ${tags}`;

  if (job.remote === true || /\bremote\b/.test(haystack)) return 'remote';
  if (/\bhybrid\b/.test(haystack)) return 'hybrid';
  if (job.remote === false || /\bon[-\s]?site\b/.test(haystack)) return 'onsite';
  return 'unspecified';
}

export function getWorkModeLabel(signal: WorkModeSignal): string {
  if (signal === 'remote') return 'Remote';
  if (signal === 'hybrid') return 'Hybrid';
  if (signal === 'onsite') return 'On-site';
  return 'Mode N/A';
}

export function getDisplayCompensation(job: Job): string | null {
  if (!job.salary) return null;
  const compact = job.salary.replace(/\s+/g, ' ').trim();
  if (!compact) return null;
  return compact.length > 28 ? `${compact.slice(0, 28)}...` : compact;
}

export function getDisplayLocation(job: Job): string {
  const value = (job.location ?? '').trim();
  if (!value) return 'Location N/A';
  return value.length > 26 ? `${value.slice(0, 26)}...` : value;
}

function getFreshnessTag(postedDate: string | null): string {
  if (!postedDate) return 'Open now';
  try {
    const ageDays = Math.max(0, Math.floor((Date.now() - new Date(postedDate).getTime()) / 86400000));
    if (ageDays <= 3) return 'Fresh this week';
    if (ageDays <= 14) return 'Recently posted';
    return 'Still active';
  } catch {
    return 'Open now';
  }
}

export function getAttentionTags(job: Job): string[] {
  const tags: string[] = [];
  const compensation = getDisplayCompensation(job);
  const visa = getVisaSignal(job);
  const mode = getWorkModeSignal(job);

  tags.push(compensation ? 'Pay visible' : 'Pay not listed');

  if (mode === 'remote') tags.push('Remote ready');
  else if (mode === 'hybrid') tags.push('Hybrid rhythm');
  else if (mode === 'onsite') tags.push('On-site energy');
  else tags.push('Mode unknown');

  if (visa === 'friendly') tags.push('Visa friendly');
  else if (visa === 'not_supported') tags.push('No sponsorship');
  else tags.push('Visa details needed');

  tags.push(getFreshnessTag(job.posted_date));
  tags.push(job.url ? 'Direct apply live' : 'Apply path varies');
  tags.push(job.source ? `${job.source} feed` : 'Source tracked');

  if (job.employment_type?.trim()) {
    tags.push(`${toTitleWords(job.employment_type)} role`);
  }

  const skills = (job.skills ?? []).filter(Boolean).slice(0, 1);
  if (skills.length > 0) {
    tags.push(`${skills[0]} signal`);
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const key = tag.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(tag);
  }
  return deduped.slice(0, 6);
}

function toTitleWords(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getFreshnessHighlight(postedDate: string | null): string {
  if (!postedDate) return 'Freshness looks recent; exact date is not listed.';
  try {
    const ageDays = Math.max(0, Math.floor((Date.now() - new Date(postedDate).getTime()) / 86400000));
    if (ageDays <= 3) return 'Fresh listing posted in the last 72 hours.';
    if (ageDays <= 7) return 'New opening from this week.';
    if (ageDays <= 21) return 'Active opening from this month.';
    return 'Listing still active; check urgency with recruiter.';
  } catch {
    return 'Freshness looks recent; exact date is not listed.';
  }
}

function getSkillHighlight(job: Job): string | null {
  const explicitSkills = (job.skills ?? [])
    .map((skill) => String(skill).trim())
    .filter(Boolean)
    .slice(0, 2);
  if (explicitSkills.length > 0) {
    return `Skill spotlight: ${explicitSkills.join(' + ')}.`;
  }

  const text = `${job.title ?? ''} ${job.description ?? ''}`.toLowerCase();
  const probes = [
    ['machine learning', 'ML'],
    ['artificial intelligence', 'AI'],
    ['python', 'Python'],
    ['javascript', 'JavaScript'],
    ['typescript', 'TypeScript'],
    ['react', 'React'],
    ['node', 'Node'],
    ['java', 'Java'],
    ['sql', 'SQL'],
    ['aws', 'AWS'],
    ['kubernetes', 'Kubernetes'],
  ] as const;

  const hits: string[] = [];
  for (const [needle, label] of probes) {
    if (text.includes(needle)) hits.push(label);
    if (hits.length >= 2) break;
  }
  if (hits.length > 0) return `Skill spotlight: ${hits.join(' + ')}.`;
  return null;
}

export function getJobHighlights(job: Job): string[] {
  const highlights: string[] = [];
  const compensation = getDisplayCompensation(job);
  const mode = getWorkModeSignal(job);
  const visa = getVisaSignal(job);
  const location = getDisplayLocation(job);

  highlights.push(
    compensation
      ? `Comp is visible up front: ${compensation}.`
      : 'Comp is not listed yet, so negotiate from impact.'
  );

  if (mode === 'remote') highlights.push('Remote-first rhythm with flexibility baked in.');
  else if (mode === 'hybrid') highlights.push('Hybrid setup balances focus time and in-person sync.');
  else if (mode === 'onsite') highlights.push('On-site collaboration for fast team feedback loops.');
  else highlights.push('Work mode is open, so confirm team cadence early.');

  if (visa === 'friendly') highlights.push('Visa sponsorship signals look positive in this posting.');
  else if (visa === 'not_supported')
    highlights.push('Sponsorship looks limited, so verify before investing time.');
  else highlights.push('Visa policy is unclear, so ask in your first recruiter chat.');

  highlights.push(
    location !== 'Location N/A'
      ? `Hiring focus is ${location}.`
      : 'Location scope looks broad, which can mean wider team options.'
  );

  const skillHighlight = getSkillHighlight(job);
  if (skillHighlight) highlights.push(skillHighlight);

  if (job.employment_type?.trim()) {
    highlights.push(`${toTitleWords(job.employment_type)} role with clear commitment level.`);
  }

  highlights.push(getFreshnessHighlight(job.posted_date));

  if (job.url) {
    highlights.push('Direct apply path is live, so you can move quickly.');
  }

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of highlights) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  const fallback = [
    'Role scope appears focused and execution-oriented.',
    'Good candidate for a high-signal, tailored application.',
    'Worth shortlisting if the team and mission fit your goals.',
  ];
  for (const item of fallback) {
    if (unique.length >= 4) break;
    if (!seen.has(item.toLowerCase())) unique.push(item);
  }

  return unique.slice(0, 5);
}
