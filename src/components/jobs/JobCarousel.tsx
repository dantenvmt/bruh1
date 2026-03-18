import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Bookmark, BookmarkCheck, MapPin, DollarSign } from 'lucide-react';
import type { Job } from '@/api/types';
import {
  getDisplayCompensation,
  getDisplayLocation,
  getWorkModeLabel,
  getWorkModeSignal,
} from '@/lib/jobSignals';
import { cn } from '@/lib/utils';

interface JobCarouselProps {
  jobs: Job[];
  isLoading: boolean;
  onJobClick: (job: Job) => void;
  isJobSaved: (job: Job) => boolean;
  onToggleSaved: (job: Job) => void;
}

function CardContent({
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
  const workSignal = getWorkModeSignal(job);
  const isRemote = workSignal === 'remote';

  return (
    <div className="flex flex-col gap-3 py-4 px-1">
      <div className="flex items-center justify-between">
        <span />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSaved(); }}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full border transition-all',
            saved
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-muted/30 border-white/[0.08] text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div>
        <h3 className="font-bold text-base leading-snug line-clamp-2 text-foreground">
          {job.title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground truncate font-medium">
          {job.company || 'Unknown'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {getDisplayCompensation(job) && (
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 border border-white/[0.06] px-2.5 py-1.5 min-w-0">
            <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold truncate">{getDisplayCompensation(job)}</span>
          </div>
        )}
        {(job.location ?? '').trim() && (
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 border border-white/[0.06] px-2.5 py-1.5 min-w-0">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold truncate">{getDisplayLocation(job)}</span>
          </div>
        )}
      </div>

      {workSignal !== 'unspecified' && (
        <span className={cn(
          'self-start inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
          isRemote
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : 'border-white/[0.08] bg-muted/30 text-muted-foreground'
        )}>
          {getWorkModeLabel(workSignal)}
        </span>
      )}

      <button
        type="button"
        onClick={onJobClick}
        className="mt-1 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 hover:border-primary/40 transition-all"
      >
        View Details →
      </button>
    </div>
  );
}

const DURATION = 420;

export function JobCarousel({ jobs, isLoading, onJobClick, isJobSaved, onToggleSaved }: JobCarouselProps) {
  const [index, setIndex] = useState(0);
  // 'idle' | 'staging' (incoming mounted at start pos, no transition) | 'sliding' (transition active)
  const [phase, setPhase] = useState<'idle' | 'staging' | 'sliding'>('idle');
  const [nextIdx, setNextIdx] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const busyRef = useRef(false);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideTo = (to: number, dir: 'next' | 'prev') => {
    if (busyRef.current || to === index || jobs.length <= 1) return;
    busyRef.current = true;

    setNextIdx(to);
    setDirection(dir);
    // Phase 1: mount incoming card at its off-screen start position, no transition yet
    setPhase('staging');
  };

  // When phase becomes 'staging', wait one rAF then start sliding
  useEffect(() => {
    if (phase !== 'staging') return;
    rafRef.current = requestAnimationFrame(() => {
      setPhase('sliding');
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // When phase becomes 'sliding', commit the new index after duration
  useEffect(() => {
    if (phase !== 'sliding') return;
    timerRef.current = setTimeout(() => {
      setIndex(nextIdx);
      setPhase('idle');
      busyRef.current = false;
    }, DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, nextIdx]);

  const next = () => slideTo((index + 1) % jobs.length, 'next');
  const prev = () => slideTo((index - 1 + jobs.length) % jobs.length, 'prev');
  const goTo = (i: number) => slideTo(i, i > index ? 'next' : 'prev');

  // Keep a ref to `next` so auto-scroll never uses stale closure
  const nextFnRef = useRef(next);
  useEffect(() => { nextFnRef.current = next; });

  useEffect(() => {
    if (isLoading || jobs.length <= 1) return;
    autoRef.current = setInterval(() => nextFnRef.current(), 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [jobs.length, isLoading]);

  if (!jobs.length && !isLoading) return null;

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-white/[0.06] bg-card/80 backdrop-blur shadow-lg shadow-black/30" role="region" aria-label="Recommended jobs carousel">
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading recommendations...</span>
        </div>
      </section>
    );
  }

  const currentJob = jobs[index];
  const incomingJob = phase !== 'idle' ? jobs[nextIdx] : null;

  const isSliding = phase === 'sliding';
  // next: current exits left, incoming enters from right
  // prev: current exits right, incoming enters from left
  const currentX = isSliding ? (direction === 'next' ? '-100%' : '100%') : '0%';
  const incomingX = isSliding ? '0%' : (direction === 'next' ? '100%' : '-100%');
  const transitionStyle = `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;

  return (
    <section
      className="rounded-2xl border border-white/[0.06] bg-card/80 backdrop-blur shadow-lg shadow-black/30 overflow-hidden"
      role="region"
      aria-label="Recommended jobs carousel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Featured for you
          </span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {(phase !== 'idle' ? nextIdx : index) + 1} <span className="opacity-40">/</span> {jobs.length}
        </span>
      </div>

      <div className="flex">
        <button onClick={prev} aria-label="Previous" className="flex items-center justify-center w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors z-10">
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Viewport */}
        <div className="flex-1 relative overflow-hidden min-w-0">
          {/* Invisible height anchor — keeps container height stable */}
          <div aria-hidden className="invisible pointer-events-none">
            <CardContent job={currentJob} saved={false} onJobClick={() => {}} onToggleSaved={() => {}} />
          </div>

          {/* Current card */}
          <div
            className="absolute inset-0 w-full"
            style={{
              transform: `translateX(${currentX})`,
              transition: isSliding ? transitionStyle : 'none',
            }}
          >
            <CardContent
              job={currentJob}
              saved={isJobSaved(currentJob)}
              onJobClick={() => onJobClick(currentJob)}
              onToggleSaved={() => onToggleSaved(currentJob)}
            />
          </div>

          {/* Incoming card */}
          {incomingJob && (
            <div
              className="absolute inset-0 w-full"
              style={{
                transform: `translateX(${incomingX})`,
                transition: isSliding ? transitionStyle : 'none',
              }}
            >
              <CardContent
                job={incomingJob}
                saved={isJobSaved(incomingJob)}
                onJobClick={() => onJobClick(incomingJob)}
                onToggleSaved={() => onToggleSaved(incomingJob)}
              />
            </div>
          )}
        </div>

        <button onClick={next} aria-label="Next" className="flex items-center justify-center w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors z-10">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dots */}
      {jobs.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {jobs.slice(0, Math.min(jobs.length, 20)).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-300',
                i === (phase !== 'idle' ? nextIdx : index) ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
