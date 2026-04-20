import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import type { Job } from '@/api/types';
import { buildJobTags, extractSkillTags, formatPostedDate, getJobSummaryBullets, getTagClasses } from '@/lib/jobPresentation';
import { cn } from '@/lib/utils';

interface JobCarouselProps {
  jobs: Job[];
  isLoading: boolean;
  onJobClick: (job: Job) => void;
  isJobSaved: (job: Job) => boolean;
  onToggleSaved: (job: Job) => void;
}

function FeaturedCard({
  job,
  saved,
  onJobClick,
  onToggleSaved,
}: {
  job: Job;
  saved: boolean;
  onJobClick: () => void;
  onToggleSaved: () => void;
}) {
  const tags = buildJobTags(job).slice(0, 3);
  const skills = extractSkillTags(job, 3);
  const bullets = getJobSummaryBullets(job, 2);

  return (
    <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
              {job.source || 'Recommended'}
            </div>
            <h3 className="mt-3 line-clamp-2 font-display text-[2rem] leading-none text-foreground sm:text-[2.4rem]">
              {job.title}
            </h3>
            <div className="mt-4 text-base font-medium text-white/72">{job.company || 'Unknown company'}</div>
            <div className="mt-2 text-sm text-white/48">{job.location || 'Location not listed'}</div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSaved();
            }}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full border transition-all shrink-0',
              saved
                ? 'border-white/16 bg-white/[0.14] text-white'
                : 'border-white/10 bg-white/[0.05] text-white/60 hover:border-white/16 hover:bg-white/[0.09] hover:text-white'
            )}
            aria-label={saved ? 'Unsave job' : 'Save job'}
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium', getTagClasses(tag.tone))}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {bullets.length > 0 && (
          <ul className="mt-6 space-y-3">
            {bullets.map((bullet, index) => (
              <li key={`${job.id}-featured-bullet-${index}`} className="flex gap-3 text-sm leading-7 text-white/70">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/38 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-black/10 p-5 backdrop-blur-md">
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">Why it stands out</div>
        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-cyan-200/15 bg-cyan-200/10 px-2.5 py-1 text-[11px] font-medium text-cyan-50"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="text-sm font-medium text-foreground">Freshness</div>
          <div className="mt-1 text-sm text-white/55">{formatPostedDate(job.posted_date)}</div>
        </div>

        <button
          type="button"
          onClick={onJobClick}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-white/[0.12]"
        >
          Open featured role
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const DURATION_MS = 420;

export function JobCarousel({ jobs, isLoading, onJobClick, isJobSaved, onToggleSaved }: JobCarouselProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'staging' | 'sliding'>('idle');
  const [nextIndex, setNextIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const busyRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideTo = (targetIndex: number, targetDirection: 'next' | 'prev') => {
    if (busyRef.current || targetIndex === index || jobs.length <= 1) return;
    busyRef.current = true;
    setNextIndex(targetIndex);
    setDirection(targetDirection);
    setPhase('staging');
  };

  useEffect(() => {
    if (phase !== 'staging') return;
    animationFrameRef.current = requestAnimationFrame(() => setPhase('sliding'));
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'sliding') return;
    timerRef.current = setTimeout(() => {
      setIndex(nextIndex);
      setPhase('idle');
      busyRef.current = false;
    }, DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, nextIndex]);

  useEffect(() => {
    if (isLoading || jobs.length <= 1) return;
    autoRef.current = setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % jobs.length);
    }, 7000);

    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [jobs.length, isLoading]);

  if (!jobs.length && !isLoading) return null;

  if (isLoading) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_28px_90px_-40px_rgba(0,0,0,0.92)] backdrop-blur-2xl">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-white/60" />
          <span className="ml-3 text-sm text-white/55">Loading recommendations...</span>
        </div>
      </section>
    );
  }

  const currentJob = jobs[index];
  const incomingJob = phase !== 'idle' ? jobs[nextIndex] : null;
  const isSliding = phase === 'sliding';
  const currentX = isSliding ? (direction === 'next' ? '-100%' : '100%') : '0%';
  const incomingX = isSliding ? '0%' : (direction === 'next' ? '100%' : '-100%');
  const transitionStyle = `transform ${DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_28px_90px_-40px_rgba(0,0,0,0.92)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(155,233,255,0.75)]" />
          <span className="text-[11px] uppercase tracking-[0.24em] text-white/45">Featured for you</span>
        </div>
        <span className="text-xs tabular-nums text-white/45">
          {(phase !== 'idle' ? nextIndex : index) + 1} / {jobs.length}
        </span>
      </div>

      <div className="flex">
        <button
          onClick={() => slideTo((index - 1 + jobs.length) % jobs.length, 'prev')}
          aria-label="Previous"
          className="flex w-12 shrink-0 items-center justify-center text-white/45 transition-colors hover:bg-white/[0.04] hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div aria-hidden className="invisible pointer-events-none">
            <FeaturedCard job={currentJob} saved={false} onJobClick={() => {}} onToggleSaved={() => {}} />
          </div>

          <div
            className="absolute inset-0 w-full"
            style={{
              transform: `translateX(${currentX})`,
              transition: isSliding ? transitionStyle : 'none',
            }}
          >
            <FeaturedCard
              job={currentJob}
              saved={isJobSaved(currentJob)}
              onJobClick={() => onJobClick(currentJob)}
              onToggleSaved={() => onToggleSaved(currentJob)}
            />
          </div>

          {incomingJob && (
            <div
              className="absolute inset-0 w-full"
              style={{
                transform: `translateX(${incomingX})`,
                transition: isSliding ? transitionStyle : 'none',
              }}
            >
              <FeaturedCard
                job={incomingJob}
                saved={isJobSaved(incomingJob)}
                onJobClick={() => onJobClick(incomingJob)}
                onToggleSaved={() => onToggleSaved(incomingJob)}
              />
            </div>
          )}
        </div>

        <button
          onClick={() => slideTo((index + 1) % jobs.length, 'next')}
          aria-label="Next"
          className="flex w-12 shrink-0 items-center justify-center text-white/45 transition-colors hover:bg-white/[0.04] hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {jobs.length > 1 && (
        <div className="flex justify-center gap-2 pb-4">
          {jobs.slice(0, Math.min(jobs.length, 20)).map((_, dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => slideTo(dotIndex, dotIndex > index ? 'next' : 'prev')}
              aria-label={`Go to item ${dotIndex + 1}`}
              className={cn(
                'rounded-full transition-all duration-300',
                dotIndex === (phase !== 'idle' ? nextIndex : index)
                  ? 'h-1.5 w-7 bg-white/75'
                  : 'h-1.5 w-1.5 bg-white/20 hover:bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
