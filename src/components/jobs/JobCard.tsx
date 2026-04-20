import { useState } from 'react';
import { ArrowUpRight, Bookmark, BookmarkCheck, Clock3, MapPin, Sparkles, WandSparkles } from 'lucide-react';

import type { Job } from '@/api/types';
import {
  buildJobTags,
  extractSkillTags,
  formatPostedDate,
  getJobSummaryBullets,
  getTagClasses,
} from '@/lib/jobPresentation';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  saved?: boolean;
  onToggleSaved?: (job: Job) => void;
  onOptimizeRole?: (job: Job) => void;
  resumeReady?: boolean;
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
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

  if (!domain || failed) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.055] text-xs font-semibold text-white/75 shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={company ?? ''}
      onError={() => setFailed(true)}
      className="h-12 w-12 rounded-2xl border border-white/12 bg-white/[0.055] object-contain p-2 shrink-0"
    />
  );
}

function SurfaceTag({ label, toneClass }: { label: string; toneClass: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium', toneClass)}>
      {label}
    </span>
  );
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
  const metaTags = buildJobTags(job);
  const skillTags = extractSkillTags(job, 4);
  const summaryBullets = getJobSummaryBullets(job, 3);
  const location = (job.location ?? '').trim();
  const companyLabel = job.company || 'Unknown company';
  const sourceLabel = job.source || 'Aggregated';

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(job)}
      onKeyDown={(event) => event.key === 'Enter' && onClick?.(job)}
      className={cn(
        'group relative flex h-[430px] cursor-pointer flex-col overflow-hidden rounded-[1.9rem] border border-white/10',
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] p-5 shadow-[0_28px_90px_-40px_rgba(0,0,0,0.92)] backdrop-blur-2xl transition-all duration-300',
        'hover:-translate-y-1 hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.05))]',
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-full bg-[radial-gradient(circle_at_top,rgba(193,240,255,0.16),transparent_72%)] opacity-80" />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/46">
          {sourceLabel}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSaved?.(job);
          }}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-all',
            saved
              ? 'border-white/16 bg-white/[0.14] text-white'
              : 'border-white/10 bg-white/[0.05] text-white/60 hover:border-white/16 hover:bg-white/[0.09] hover:text-white'
          )}
          aria-label={saved ? 'Unsave job' : 'Save job'}
        >
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative mt-5 flex items-start gap-3">
        <CompanyLogo company={job.company} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-white/72">{companyLabel}</div>
          <h3 className="mt-1 line-clamp-2 text-[1.05rem] font-semibold leading-7 text-foreground">
            {job.title}
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-white/52">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location || 'Location not listed'}</span>
          </div>
        </div>
      </div>

      {metaTags.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {metaTags.map((tag) => (
            <SurfaceTag key={tag.label} label={tag.label} toneClass={getTagClasses(tag.tone)} />
          ))}
        </div>
      )}

      <div className="relative mt-4 flex-1 rounded-[1.45rem] border border-white/10 bg-black/10 p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
          <Sparkles className="h-3.5 w-3.5" />
          Role snapshot
        </div>

        {skillTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {skillTags.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-cyan-200/15 bg-cyan-200/10 px-2.5 py-1 text-[11px] font-medium text-cyan-50"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {summaryBullets.length > 0 ? (
          <ul className="mt-4 space-y-2.5">
            {summaryBullets.map((bullet, index) => (
              <li key={`${job.id}-bullet-${index}`} className="flex gap-3 text-sm leading-6 text-white/68">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/40 shrink-0" />
                <span className="line-clamp-2">{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-white/55">
            Open the role to review the full description and hiring details.
          </p>
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs text-white/46">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{postedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!resumeReady}
            onClick={(event) => {
              event.stopPropagation();
              onOptimizeRole?.(job);
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all',
              resumeReady
                ? 'border-white/12 bg-white/[0.06] text-foreground hover:bg-white/[0.1]'
                : 'cursor-not-allowed border-white/8 bg-white/[0.03] text-white/32'
            )}
            title={resumeReady ? 'Optimize your resume for this role' : 'Upload a resume first'}
          >
            <WandSparkles className="h-3.5 w-3.5" />
            Optimize
          </button>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-xs font-medium text-foreground transition-all group-hover:bg-white/[0.12]">
            View role
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
