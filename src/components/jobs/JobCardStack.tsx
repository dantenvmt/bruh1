import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, type PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Bookmark, BookmarkCheck, ChevronUp, Clock3, DollarSign, Heart, Loader2, MapPin, Sparkles, WandSparkles, X } from 'lucide-react';

import type { Job } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getDisplayCompensation,
  getDisplayLocation,
  getVisaLabel,
  getVisaSignal,
  getWorkModeLabel,
  getWorkModeSignal,
} from '@/lib/jobSignals';
import { cn } from '@/lib/utils';

type SwipeDirection = 'left' | 'right';

interface JobCardStackProps {
  jobs: Job[];
  index: number;
  onAdvance: () => void;
  onSave: (job: Job) => void;
  onToggleSaved: (job: Job) => void;
  onDismiss: (job: Job) => void;
  onDetails: (job: Job) => void;
  isJobSaved: (job: Job) => boolean;
  onOptimizeRole: (job: Job) => void;
  resumeReady: boolean;
  isFetchingNextPage?: boolean;
  isAnimating?: boolean;
}

const SWIPE_X_THRESHOLD_PX = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;
const LONG_PRESS_MS = 420;
const LONG_PRESS_MOVE_CANCEL_PX = 10;
const DRAG_ELASTIC = 0.15;
const DRAG_STIFFNESS = 200;
const DRAG_DAMPING = 22;

function formatPosted(dateString: string | null): string {
  if (!dateString) return 'Recently';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

function buildSnapshot(description: string | null): string[] {
  if (!description) return ['Role snapshot unavailable.', 'Open details to view the full job post.'];

  const plain = description
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return ['Role snapshot unavailable.', 'Open details to view the full job post.'];

  const chunks = plain
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return chunks.slice(0, 3).map((line) => (line.length > 135 ? `${line.slice(0, 132)}...` : line));
}

function JobSwipeCard({
  job,
  saved,
  onOpen,
  snapshotVisible,
  onToggleSaved,
  onOptimizeRole,
  resumeReady,
}: {
  job: Job;
  saved: boolean;
  onOpen: () => void;
  snapshotVisible: boolean;
  onToggleSaved: () => void;
  onOptimizeRole: () => void;
  resumeReady: boolean;
}) {
  const companyLabel = job.company || 'Unknown company';
  const compensation = getDisplayCompensation(job);
  const location = getDisplayLocation(job);
  const visaSignal = getVisaSignal(job);
  const visaLabel = getVisaLabel(visaSignal);
  const workModeSignal = getWorkModeSignal(job);
  const workModeLabel = getWorkModeLabel(workModeSignal);
  const postedLabel = formatPosted(job.posted_date);
  const snapshotLines = useMemo(() => buildSnapshot(job.description), [job.description]);

  const visaClass =
    visaSignal === 'friendly'
      ? 'border-primary/40 bg-primary/10 text-foreground'
      : visaSignal === 'not_supported'
        ? 'border-destructive/35 bg-destructive/10 text-foreground'
        : 'border-border/60 bg-background/40 text-muted-foreground';

  const modeClass =
    workModeSignal === 'remote'
      ? 'border-primary/30 bg-primary/10 text-foreground'
      : workModeSignal === 'hybrid'
        ? 'border-accent/70 bg-accent/55 text-foreground'
        : 'border-border/60 bg-background/40 text-muted-foreground';

  return (
    <Card
      className={cn(
        'relative h-full w-full rounded-[2rem] border-0 bg-card/95 p-6 shadow-2xl shadow-black/50',
        'backdrop-blur-sm transition-all cursor-pointer',
        // flame gradient border via pseudo-element workaround using outline + ring
        '[background-clip:padding-box]',
        'ring-1 ring-white/[0.07]',
      )}
      style={{
        boxShadow: '0 0 0 1px rgba(255,97,84,0.18), 0 25px 50px -12px rgba(0,0,0,0.6), 0 8px 24px rgba(253,41,107,0.06)',
      }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{job.source ?? 'Unknown source'}</span>
              {job.employment_type && (
                <>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/70" />
                  <span className="capitalize">{job.employment_type}</span>
                </>
              )}
            </div>
            <h3 className="text-xl font-semibold leading-tight line-clamp-3">{job.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{companyLabel}</p>
          </div>

          <button
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border shrink-0 transition-colors',
              saved
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
            aria-label={saved ? 'Saved' : 'Not saved'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaved();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5">
          <div className="rounded-xl border border-border/60 bg-background/45 px-3.5 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pay</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <DollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{compensation ?? 'Not listed'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Badge
              variant="outline"
              className={cn('justify-center rounded-xl px-3 py-2 text-xs font-medium', modeClass)}
            >
              {workModeLabel}
            </Badge>
            <Badge
              variant="outline"
              className={cn('justify-center rounded-xl px-3 py-2 text-xs font-medium', visaClass)}
            >
              {visaLabel}
            </Badge>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/45 px-3.5 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Location</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={cn(
            'mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
            resumeReady
              ? 'border-primary/35 bg-primary/10 text-foreground hover:border-primary/60 hover:bg-primary/15'
              : 'cursor-not-allowed border-border/50 bg-background/40 text-muted-foreground'
          )}
          disabled={!resumeReady}
          title={resumeReady ? 'Optimize resume for this role' : 'Upload a resume in Resume Lab first'}
          onClick={(e) => {
            e.stopPropagation();
            onOptimizeRole();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Optimize for role
        </button>

        <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{postedLabel}</span>
        </div>
      </div>

      <AnimatePresence>
        {snapshotVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-[2rem] bg-black/70 p-5 text-white"
          >
            <div className="flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Role Snapshot
              </div>

              <div className="mt-3 text-sm text-white/85">{job.title}</div>
              <div className="text-xs text-white/70">{companyLabel}</div>

              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                {snapshotLines.map((line, idx) => (
                  <p key={`${job.id}-snapshot-${idx}`} className="line-clamp-3">
                    {line}
                  </p>
                ))}
              </div>

              <div className="mt-auto text-xs text-white/70">Release to return to swipe</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function JobCardStack({
  jobs,
  index,
  onAdvance,
  onSave,
  onToggleSaved,
  onDismiss,
  onDetails,
  isJobSaved,
  onOptimizeRole,
  resumeReady,
  isFetchingNextPage,
  isAnimating = false,
}: JobCardStackProps) {
  const [snapshotVisible, setSnapshotVisible] = useState(false);
  const isFlyingRef = useRef(false);

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);

  const current = jobs[index] ?? null;
  const next = jobs[index + 1] ?? null;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);

  // Reset motion values when card changes
  useEffect(() => {
    x.set(0);
    y.set(0);
    opacity.set(1);
    isFlyingRef.current = false;
  }, [index, x, y, opacity]);

  const rotate = useTransform(x, [-260, 0, 260], [-12, 0, 12]);
  const scale = useTransform(x, [-240, 0, 240], [0.985, 1, 0.985]);
  const likeOpacity = useTransform(x, [40, SWIPE_X_THRESHOLD_PX], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_X_THRESHOLD_PX, -40], [1, 0]);

  const canShowControls = useMemo(() => Boolean(current), [current]);

  const clearLongPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer]);

  const handlePressStart = (clientX: number, clientY: number) => {
    if (!current) return;
    pressStartRef.current = { x: clientX, y: clientY };
    longPressTriggeredRef.current = false;
    setSnapshotVisible(false);
    clearLongPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setSnapshotVisible(true);
    }, LONG_PRESS_MS);
  };

  const handlePressMove = (clientX: number, clientY: number) => {
    const start = pressStartRef.current;
    if (!start) return;
    const deltaX = Math.abs(clientX - start.x);
    const deltaY = Math.abs(clientY - start.y);
    if (deltaX > LONG_PRESS_MOVE_CANCEL_PX || deltaY > LONG_PRESS_MOVE_CANCEL_PX) {
      clearLongPressTimer();
    }
  };

  const handlePressEnd = useCallback(() => {
    clearLongPressTimer();
    pressStartRef.current = null;
    setSnapshotVisible(false);
  }, [clearLongPressTimer]);

  const handleOpenDetails = () => {
    if (!current) return;
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onDetails(current);
  };

  // Fling the card off-screen via motion values, THEN advance
  const handleDecision = useCallback(async (direction: SwipeDirection, job: Job) => {
    if (isFlyingRef.current) return;
    isFlyingRef.current = true;
    handlePressEnd();

    const targetX = direction === 'right' ? 500 : -500;

    await Promise.all([
      animate(x, targetX, { duration: 0.22, ease: 'easeOut' }),
      animate(opacity, 0, { duration: 0.22, ease: 'easeOut' }),
    ]);

    if (direction === 'right') onSave(job);
    else onDismiss(job);
    onAdvance();
  }, [x, opacity, handlePressEnd, onSave, onDismiss, onAdvance]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!current) return;
    handlePressEnd();

    const swipedRight =
      info.offset.x > SWIPE_X_THRESHOLD_PX || info.velocity.x > SWIPE_VELOCITY_THRESHOLD;
    const swipedLeft =
      info.offset.x < -SWIPE_X_THRESHOLD_PX || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;

    if (swipedRight) {
      void handleDecision('right', current);
      return;
    }
    if (swipedLeft) {
      void handleDecision('left', current);
      return;
    }
  };

  if (!current) {
    if (isFetchingNextPage) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <div className="text-sm text-muted-foreground">Loading more jobs...</div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
          <div className="relative rounded-3xl bg-gradient-to-br from-muted to-muted/60 p-8 shadow-lg">
            <Bookmark className="w-16 h-16 text-muted-foreground/70" />
          </div>
        </div>
        <div className="text-2xl font-semibold mb-3">No more jobs</div>
        <div className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Try changing filters or check back later.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[22rem] mx-auto">
      <div className="relative h-[480px]">
        {next && (
          <div className="absolute inset-0 translate-y-2 scale-[0.985] opacity-70">
            <JobSwipeCard
              job={next}
              saved={isJobSaved(next)}
              onOpen={() => onDetails(next)}
              snapshotVisible={false}
              onToggleSaved={() => onToggleSaved(next)}
              onOptimizeRole={() => onOptimizeRole(next)}
              resumeReady={resumeReady}
            />
          </div>
        )}

        <motion.div
          key={current.id}
          className="absolute inset-0"
          style={{ x, rotate, scale, opacity, touchAction: 'none' }}
          drag={!snapshotVisible && !isAnimating && !isFlyingRef.current ? 'x' : false}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={DRAG_ELASTIC}
          dragMomentum
          dragTransition={{ bounceStiffness: DRAG_STIFFNESS, bounceDamping: DRAG_DAMPING }}
          onDragStart={() => {
            clearLongPressTimer();
            setSnapshotVisible(false);
          }}
          onDragEnd={handleDragEnd}
          onPointerDownCapture={(e) => handlePressStart(e.clientX, e.clientY)}
          onPointerMoveCapture={(e) => handlePressMove(e.clientX, e.clientY)}
          onPointerUpCapture={handlePressEnd}
          onPointerCancelCapture={handlePressEnd}
          initial={{ opacity: 0, scale: 0.97, y: 14 }}
          animate={{
            scale: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 280, damping: 28, mass: 0.75 },
          }}
          whileDrag={{ scale: 1.01 }}
        >
          <div className="pointer-events-none absolute left-5 top-5 z-10">
            <motion.div
              className="rounded-xl border-2 border-emerald-400 px-4 py-1.5 text-base font-black uppercase tracking-widest text-emerald-300"
              style={{ opacity: likeOpacity, rotate: -15, textShadow: '0 0 20px rgba(52,211,153,0.5)' }}
            >
              MATCH
            </motion.div>
          </div>
          <div className="pointer-events-none absolute right-5 top-5 z-10">
            <motion.div
              className="rounded-xl border-2 border-rose-400 px-4 py-1.5 text-base font-black uppercase tracking-widest text-rose-300"
              style={{ opacity: nopeOpacity, rotate: 15, textShadow: '0 0 20px rgba(251,113,133,0.5)' }}
            >
              NOPE
            </motion.div>
          </div>

          <JobSwipeCard
            job={current}
            saved={isJobSaved(current)}
            onOpen={handleOpenDetails}
            snapshotVisible={snapshotVisible}
            onToggleSaved={() => onToggleSaved(current)}
            onOptimizeRole={() => onOptimizeRole(current)}
            resumeReady={resumeReady}
          />
        </motion.div>
      </div>

      {canShowControls && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-12 transition-all hover:border-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10"
            onClick={() => void handleDecision('left', current)}
            aria-label="Ignore job"
          >
            <X />
            Ignore
          </Button>
          <Button
            variant="outline"
            className="h-12 transition-all hover:border-primary/50 hover:scale-105"
            onClick={() => onDetails(current)}
            aria-label="Open details"
          >
            <ChevronUp />
            Details
          </Button>
          <Button
            className="h-12 border-0 text-white font-semibold shadow-lg transition-all hover:scale-105 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #FF6154, #FD296B)', boxShadow: '0 4px 20px rgba(253,41,107,0.35)' }}
            onClick={() => void handleDecision('right', current)}
            aria-label="Match job"
          >
            <Heart className="fill-white" />
            Match
          </Button>
        </div>
      )}
    </div>
  );
}
