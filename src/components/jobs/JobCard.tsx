import { formatDistanceToNow } from 'date-fns';
import { Bookmark, BookmarkCheck, Clock, DollarSign, MapPin, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Job } from '@/api/types';
import {
  getAttentionTags,
  getDisplayCompensation,
  getDisplayLocation,
  getJobHighlights,
  getVisaLabel,
  getVisaSignal,
  getWorkModeLabel,
  getWorkModeSignal,
} from '@/lib/jobSignals';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  saved?: boolean;
  onToggleSaved?: (job: Job) => void;
  onOptimizeRole?: (job: Job) => void;
  resumeReady?: boolean;
}

/**
 * Format posted date to relative time
 */
function formatPostedDate(dateString: string | null): string {
  if (!dateString) return 'Recently';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

export function JobCard({
  job,
  onClick,
  saved = false,
  onToggleSaved,
  onOptimizeRole,
  resumeReady = false,
}: JobCardProps) {
  const companyLabel = job.company || 'Unknown';
  const postedDate = formatPostedDate(job.posted_date);
  const compensation = getDisplayCompensation(job);
  const location = getDisplayLocation(job);
  const visaSignal = getVisaSignal(job);
  const visaLabel = getVisaLabel(visaSignal);
  const workModeSignal = getWorkModeSignal(job);
  const workModeLabel = getWorkModeLabel(workModeSignal);
  const highlights = getJobHighlights(job);
  const attentionTags = getAttentionTags(job);
  const compactTags = attentionTags.slice(0, 4);

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
        'w-full min-h-[30rem] sm:min-h-[32rem] overflow-hidden rounded-3xl border-border/70 bg-card/90 p-3.5 sm:p-4 cursor-pointer group',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/45',
        'hover:bg-card active:scale-[0.985]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        onClick && 'hover:border-primary/50'
      )}
      onClick={() => onClick?.(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(job);
        }
      }}
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {companyLabel}
          </p>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {job.source ?? 'Unknown'}
            </Badge>
            <Button
              variant={saved ? 'default' : 'outline'}
              size="icon"
              className={cn(
                'h-7 w-7 rounded-full',
                saved ? 'bg-emerald-600 hover:bg-emerald-600/90' : 'hover:border-primary/40'
              )}
              aria-label={saved ? 'Unsave job' : 'Save job'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSaved?.(job);
              }}
            >
              {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <h3 className="mt-3 font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {job.title}
        </h3>

        <div className="rounded-xl border border-border/60 bg-background/45 p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {compensation ? (
              <Badge variant="outline" className="text-[11px] shadow-sm">
                <DollarSign className="mr-1 h-3 w-3" />
                {compensation}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                Pay N/A
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-[11px] shadow-sm', modeClass)}>
              {workModeLabel}
            </Badge>
            <Badge variant="outline" className={cn('text-[11px] shadow-sm', visaClass)}>
              {visaLabel}
            </Badge>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        <div className="flex max-h-14 flex-wrap gap-1.5 overflow-hidden">
          {compactTags.map((tag) => (
            <Badge
              key={`${job.id}-${tag}`}
              variant="outline"
              className="rounded-full border-primary/25 bg-primary/10 text-[10px] uppercase tracking-wide text-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/55 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why this role pops
          </p>
          <ul className="mt-2 space-y-1">
            {highlights.slice(0, 3).map((point, idx) => (
              <li key={`${job.id}-hl-${idx}`} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                <span className="text-[12px] leading-[1.35] text-foreground/90 line-clamp-2">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{postedDate}</span>
            {job.employment_type && (
              <>
                <span className="mx-1 h-1 w-1 rounded-full bg-muted-foreground/70" />
                <span className="capitalize">{job.employment_type}</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center gap-1.5"
            disabled={!resumeReady}
            title={resumeReady ? 'Optimize resume for this role' : 'Upload a resume in Resume Lab first'}
            onClick={(e) => {
              e.stopPropagation();
              onOptimizeRole?.(job);
            }}
          >
            <WandSparkles className="h-3.5 w-3.5" />
            Optimize For This Role
          </Button>
        </div>
      </div>
    </Card>
  );
}
