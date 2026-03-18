import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bookmark, BookmarkCheck, Clock, WandSparkles, ExternalLink, MapPin } from 'lucide-react';
import { Chip } from '@nextui-org/react';
import { cn } from '@/lib/utils';
import type { Job } from '@/api/types';
import {
  getDisplayCompensation,
  getWorkModeLabel,
  getWorkModeSignal,
  getVisaSignal,
} from '@/lib/jobSignals';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  saved?: boolean;
  onToggleSaved?: (job: Job) => void;
  onOptimizeRole?: (job: Job) => void;
  resumeReady?: boolean;
}

function formatPostedDate(dateString: string | null): string {
  if (!dateString) return 'Recently';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

function getCompanyDomain(company: string | null): string | null {
  if (!company) return null;
  const cleaned = company
    .toLowerCase()
    .replace(/\s+(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?|group|technologies|technology|solutions|services|global|international)$/i, '')
    .trim()
    .replace(/[^a-z0-9]/g, '');
  return cleaned ? `${cleaned}.com` : null;
}

function CompanyLogo({ company }: { company: string | null }) {
  const [failed, setFailed] = useState(false);
  const domain = getCompanyDomain(company);

  const initials = (company ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (!domain || failed) {
    return (
      <div className="h-6 w-6 rounded-md bg-white/[0.08] border border-white/[0.10] flex items-center justify-center font-bold text-default-400 shrink-0 text-[9px]">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={company ?? ''}
      onError={() => setFailed(true)}
      className="h-6 w-6 rounded-md object-contain bg-white/5 p-0.5 border border-white/[0.08] shrink-0"
    />
  );
}

/** Pick up to 3 skill tags — prefer structured API fields, fall back to description scan. */
function extractSkillTags(job: Job): string[] {
  // Use structured fields from the API first — already extracted by the backend
  const structured = [
    ...(job.required_skills ?? []),
    ...(job.skills ?? []),
  ];

  if (structured.length > 0) {
    // Deduplicate case-insensitively, keep original casing, cap at 3
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of structured) {
      const key = s.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(s.trim());
      if (result.length >= 3) break;
    }
    if (result.length > 0) return result;
  }

  // Fallback: scan description with regexes, avoiding common false positives
  if (!job.description) return [];
  const raw = job.description;
  const probes: [RegExp, string][] = [
    [/\bpython\b/i, 'Python'], [/\btypescript\b/i, 'TypeScript'], [/\bjavascript\b/i, 'JavaScript'],
    [/\breact\.?js\b|\breact\b/i, 'React'], [/\bnode\.?js\b/i, 'Node.js'], [/\baws\b/i, 'AWS'],
    [/\bsql\b/i, 'SQL'], [/\bjava\b(?!script)/i, 'Java'], [/\bkubernetes\b|\bk8s\b/i, 'Kubernetes'],
    [/\bdocker\b/i, 'Docker'], [/\bgolang\b/i, 'Go'], [/\bruby\b/i, 'Ruby'],
    [/\brust\b/i, 'Rust'], [/\bc\+\+/i, 'C++'], [/\bmachine\s+learning\b/i, 'ML'],
    [/\bci\/cd\b/i, 'CI/CD'], [/\bkafka\b/i, 'Kafka'], [/\bpostgres(?:ql)?\b/i, 'PostgreSQL'],
    [/\bmongodb\b/i, 'MongoDB'], [/\bterraform\b/i, 'Terraform'], [/\bfigma\b/i, 'Figma'],
    [/\bfp&a\b|\bfinancial\s+planning\b/i, 'FP&A'], [/\bdevops\b/i, 'DevOps'],
    [/\bproject\s+management\b/i, 'Project Mgmt'], [/\bdata\s+analysis\b/i, 'Data Analysis'],
    [/\bagile\b/i, 'Agile'], [/\bsecurity\b/i, 'Security'], [/\bcloud\b/i, 'Cloud'],
    [/\bmarketing\b/i, 'Marketing'], [/\bsales\b/i, 'Sales'],
  ];
  const found: string[] = [];
  for (const [regex, label] of probes) {
    if (found.length >= 3) break;
    if (regex.test(raw)) found.push(label);
  }
  return found;
}

/** Distill a job description into 2 clean bullet points. */
function getBulletPoints(raw: string): string[] {
  const cleaned = raw
    .replace(/\r?\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    // Strip metadata/boilerplate patterns
    .replace(/\b(Posting Date|Headquarters|URL|Website|Location|Industry|Company size|Founded|Job Type|Job Title|Experience Level)[:\s][^.!?]*/gi, '')
    .replace(/^[\s\S]{0,80}?\.(com|io|co|org|net)\b\s*/i, '') // strip leading domain fragment
    .replace(/\b(Article|Comments?|Points?|#\s*Comments?)[:\s]\S*\s*/gi, '')
    .replace(/\bOur Mission\b\s*/gi, '')  // strip section headers
    .replace(/\bAbout\s+\w[\w\s]{0,30}:\s*/gi, '') // "About HighLevel:" etc
    .replace(/\bJob Summary:\s*/gi, '')
    .replace(/^[^a-zA-Z$]*/,'') // strip leading non-alpha
    .trim();

  const sentences = cleaned
    // Split on ". " but avoid "U.S." / "e.g." / single-letter abbreviations
    .split(/(?<=[a-z,)])\.\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s =>
      s.length > 40 &&
      /^[A-Z]/.test(s) &&           // must start with capital letter
      !/^(http|www\.)/i.test(s) &&
      !/^\d/.test(s) &&
      !s.includes('/') &&            // no URL path segments
      !s.includes('ycombinator')
    );

  return sentences.slice(0, 3);
}

/** Extract experience years from description/title, e.g. "5+ years", "3-5 years" */
function getExperienceTag(job: Job): string | null {
  const haystack = `${job.title ?? ''} ${job.description ?? ''}`;
  const match = haystack.match(/(\d+)\s*[-–+]?\s*(\d+)?\s*\+?\s*years?/i);
  if (!match) return null;
  const lo = parseInt(match[1], 10);
  const hi = match[2] ? parseInt(match[2], 10) : null;
  if (hi) return `${lo}–${hi} yrs`;
  return match[0].includes('+') ? `${lo}+ yrs` : `${lo} yrs`;
}

interface TagDef {
  label: string;
  color: 'pay' | 'remote' | 'hybrid' | 'amber' | 'rose' | 'slate' | 'green';
}

function getTagColor(color: TagDef['color']): { base: string; content: string } {
  switch (color) {
    case 'pay':    return { base: 'border-primary/30 bg-primary/10',           content: 'text-primary' };
    case 'remote': return { base: 'border-primary/25 bg-primary/8',            content: 'text-primary/90' };
    case 'hybrid': return { base: 'border-white/[0.14] bg-white/[0.05]',       content: 'text-foreground/70' };
    case 'amber':  return { base: 'border-amber-500/30 bg-amber-500/10',       content: 'text-amber-400' };
    case 'rose':   return { base: 'border-rose-500/30 bg-rose-500/10',         content: 'text-rose-400' };
    case 'green':  return { base: 'border-primary/25 bg-primary/10',           content: 'text-primary/80' };
    case 'slate':
    default:       return { base: 'border-white/[0.10] bg-white/[0.04]',       content: 'text-default-400' };
  }
}

function buildTags(job: Job): TagDef[] {
  const tags: TagDef[] = [];

  // 1. Pay
  const pay = getDisplayCompensation(job);
  if (pay) tags.push({ label: pay, color: 'pay' });

  // 2. Work mode (only if meaningfully known)
  const workSignal = getWorkModeSignal(job);
  if (workSignal !== 'unspecified') {
    const color = workSignal === 'remote' ? 'remote' : workSignal === 'hybrid' ? 'hybrid' : 'slate';
    tags.push({ label: getWorkModeLabel(workSignal), color });
  }

  // 3. (Location shown inline under title, not as tag)

  // 4. Experience years — amber highlight like hiring.cafe
  const exp = getExperienceTag(job);
  if (exp) tags.push({ label: exp, color: 'amber' });

  // 5. Employment type
  if (job.employment_type?.trim()) {
    const et = job.employment_type.trim();
    const label = et.charAt(0).toUpperCase() + et.slice(1).toLowerCase();
    tags.push({ label, color: 'slate' });
  }

  // 6. Visa
  const visa = getVisaSignal(job);
  if (visa === 'friendly') tags.push({ label: 'Visa OK', color: 'green' });
  else if (visa === 'not_supported') tags.push({ label: 'No sponsorship', color: 'rose' });

  return tags;
}

export function JobCard({
  job,
  onClick,
  saved = false,
  onToggleSaved,
  onOptimizeRole,
  resumeReady = false,
}: JobCardProps) {
  const postedDate = formatPostedDate(job.posted_date);
  const tags = buildTags(job);
  const loc = (job.location ?? '').trim();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(job)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(job)}
      className="group rounded-2xl bg-content1 border border-white/[0.06] shadow-md shadow-black/30 hover:border-primary/25 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col h-[420px] overflow-hidden"
    >
      <div className="p-4 flex flex-col gap-2 flex-1 overflow-hidden">

        {/* Title + badge + save */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[0.85rem] font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            {loc && (
              <p className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-default-400">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{loc}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {job.experience_level && <ExperienceLevelBadge level={job.experience_level} />}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSaved?.(job); }}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border transition-all',
                saved
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-white/[0.08] text-default-400 hover:border-primary/40 hover:text-primary'
              )}
              aria-label={saved ? 'Unsave job' : 'Save job'}
            >
              {saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const { base, content } = getTagColor(tag.color);
              return (
                <Chip
                  key={tag.label}
                  size="sm"
                  variant="flat"
                  classNames={{
                    base: cn('border h-[22px]', base),
                    content: cn('text-[10px] font-semibold px-1', content),
                  }}
                >
                  {tag.label}
                </Chip>
              );
            })}
          </div>
        )}

        {/* Company row */}
        <div className="flex items-center gap-2">
          <CompanyLogo company={job.company} />
          <p className="text-[0.72rem] font-semibold text-default-300 truncate">
            {job.company || 'Unknown'}
          </p>
        </div>

        {/* Description box — flex-1 so it fills remaining space */}
        {job.description && (
          <div className="flex-1 overflow-hidden">
            <DescriptionBox job={job} />
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-4 pb-3 border-t border-white/[0.04] flex items-center justify-between pt-2.5">
        <span className="flex items-center gap-1 text-[10px] text-default-500">
          <Clock className="h-2.5 w-2.5" />
          {postedDate}
        </span>
        <div className="flex items-center gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-default-400 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Apply
            </a>
          )}
          <button
            type="button"
            disabled={!resumeReady}
            onClick={(e) => { e.stopPropagation(); onOptimizeRole?.(job); }}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium border transition-all shrink-0',
              resumeReady
                ? 'border-primary/40 text-primary hover:bg-primary/10'
                : 'border-white/[0.06] text-default-300 cursor-not-allowed opacity-40'
            )}
            title={resumeReady ? 'Optimize resume for this role' : 'Upload a resume first'}
          >
            <WandSparkles className="h-3 w-3" />
            Optimize
          </button>
        </div>
      </div>
    </div>
  );
}

type ExperienceLevel = 'intern' | 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

const LEVEL_CONFIG: Record<string, { label: string; gradient: string; text: string }> = {
  intern:    { label: 'Intern',     gradient: 'from-white/5 to-white/[0.03] border-white/15',              text: 'text-foreground/60' },
  entry:     { label: 'Entry',      gradient: 'from-white/5 to-white/[0.03] border-white/15',              text: 'text-foreground/60' },
  mid:       { label: 'Mid-Level',  gradient: 'from-primary/15 to-primary/5 border-primary/30',            text: 'text-primary' },
  senior:    { label: 'Senior',     gradient: 'from-primary/20 to-[hsl(340_98%_58%/0.1)] border-primary/40', text: 'text-primary' },
  lead:      { label: 'Lead',       gradient: 'from-[hsl(340_98%_58%/0.2)] to-primary/10 border-[hsl(340_98%_58%/0.4)]', text: 'text-[hsl(340,98%,72%)]' },
  executive: { label: 'Executive',  gradient: 'from-[hsl(340_98%_58%/0.25)] to-primary/15 border-[hsl(340_98%_58%/0.5)]', text: 'text-[hsl(340,98%,75%)]' },
};

const UNKNOWN_LEVELS = new Set(['unknown', 'n/a', 'na', 'not specified', 'unspecified', '']);

function ExperienceLevelBadge({ level }: { level: string }) {
  const key = level.toLowerCase().trim() as ExperienceLevel;
  if (UNKNOWN_LEVELS.has(key)) return null;

  const cfg = LEVEL_CONFIG[key] ?? null;
  // Don't show badge for unrecognized values either — prevents garbage from leaking through
  if (!cfg) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'bg-gradient-to-r border text-[9px] font-bold tracking-wide uppercase',
        cfg.gradient,
        cfg.text,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 shrink-0" />
      {cfg.label}
    </span>
  );
}

function DescriptionBox({ job }: { job: Job }) {
  const skills = extractSkillTags(job);
  const aiBullets = job.ai_summary_detail?.summary_bullets?.slice(0, 3) ?? null;
  const fallbackBullets = job.description ? getBulletPoints(job.description) : [];
  const bullets = aiBullets ?? fallbackBullets;

  if (skills.length === 0 && bullets.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 flex flex-col gap-1.5 overflow-hidden h-full">
      {/* Skill tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {bullets.length > 0 && (
        <ul className="flex flex-col gap-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-1.5 text-[0.62rem] text-default-500 leading-snug">
              <span className="mt-[2px] h-1 w-1 rounded-full bg-default-500/50 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

