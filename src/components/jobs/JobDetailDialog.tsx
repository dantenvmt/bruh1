import { formatDistanceToNow } from 'date-fns';
import { Bookmark, BookmarkCheck, ExternalLink, Loader2, MapPin, Sparkles, WandSparkles } from 'lucide-react';

import type { CritiqueLevel, Job, JobAiSummaryResponse, ResumeOptimizeResponse } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface JobDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  saved: boolean;
  onToggleSaved: () => void;
  aiSummary: JobAiSummaryResponse | null;
  aiSummaryLoading: boolean;
  optimization: ResumeOptimizeResponse | null;
  optimizationLoading: boolean;
  onOptimizeRole: () => void;
  resumeReady: boolean;
  critiqueLevel: CritiqueLevel;
}

function formatPosted(dateString: string | null): string {
  if (!dateString) return 'Recently';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

export function JobDetailDialog({
  open,
  onOpenChange,
  job,
  saved,
  onToggleSaved,
  aiSummary,
  aiSummaryLoading,
  optimization,
  optimizationLoading,
  onOptimizeRole,
  resumeReady,
  critiqueLevel,
}: JobDetailDialogProps) {
  if (!job) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Job details</DialogTitle>
            <DialogDescription>Nothing selected.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const companyLabel = job.company || 'Unknown company';
  const posted = formatPosted(job.posted_date);
  const skills = job.skills ?? [];
  const tags = job.tags ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[88vh] overflow-hidden p-0">
        <div className="flex h-full flex-col">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-xl leading-tight">{job.title}</DialogTitle>
              <DialogDescription className="mt-1">
                <span className="font-medium text-foreground">{companyLabel}</span>
              </DialogDescription>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {job.location && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[240px]">{job.location}</span>
                  </Badge>
                )}
                {job.remote && <Badge variant="secondary">Remote</Badge>}
                {job.employment_type && <Badge variant="outline">{job.employment_type}</Badge>}
                {job.salary && <Badge variant="outline">{job.salary}</Badge>}
                <Badge variant="outline">{posted}</Badge>
                {job.source && <Badge variant="outline">via {job.source}</Badge>}
              </div>
            </div>

            <Button
              variant={saved ? 'default' : 'outline'}
              size="icon"
              aria-label={saved ? 'Unsave job' : 'Save job'}
              onClick={onToggleSaved}
              className={cn(
                'transition-all duration-300',
                saved && 'bg-emerald-600 hover:bg-emerald-600/90 shadow-lg shadow-emerald-600/30',
                !saved && 'hover:border-emerald-500/50 hover:text-emerald-600'
              )}
            >
              {saved ? <BookmarkCheck className="transition-transform scale-110" /> : <Bookmark className="transition-transform hover:scale-110" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-3 px-6 pb-4">
          <div className="max-h-[32vh] min-h-[24vh] overflow-auto rounded-xl border border-border/70 bg-muted/30 p-4 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                AI Job Summary
              </p>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {aiSummary?.provider ?? 'AI'}
              </Badge>
            </div>
            {aiSummaryLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building summary...
              </div>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-foreground/95">
                  {aiSummary?.summary_short || 'Summary not ready yet for this role.'}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {(aiSummary?.summary_bullets ?? []).map((point, idx) => (
                    <li key={`${job.id}-sum-${idx}`} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/80" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {aiSummary?.attention_tags && aiSummary.attention_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {aiSummary.attention_tags.map((tag) => (
                      <Badge
                        key={`${job.id}-attention-${tag}`}
                        variant="outline"
                        className="rounded-full border-primary/25 bg-primary/10 text-[10px] uppercase tracking-wide"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="max-h-[32vh] min-h-[24vh] overflow-auto rounded-xl border border-border/70 bg-muted/20 p-4 shadow-inner">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Full Description
            </p>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {job.description || aiSummary?.summary_full || 'No description provided.'}
            </div>
          </div>

          {(skills.length > 0 || tags.length > 0) && (
            <div className="space-y-2">
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, idx) => (
                    <Badge key={`${skill}-${idx}`} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <Badge key={`${tag}-${idx}`} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {(optimization || optimizationLoading) && (
            <div className="max-h-[26vh] overflow-auto rounded-xl border border-primary/25 bg-primary/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Resume Optimization ({critiqueLevel})
                </p>
                {optimization && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {`${optimization.score_before} to ${optimization.score_after_estimate}`}
                  </Badge>
                )}
              </div>
              {optimizationLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tailoring your resume to this role...
                </div>
              ) : optimization ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm leading-relaxed">{optimization.tailored_summary}</p>
                  {optimization.rewritten_bullets.length > 0 && (
                    <ul className="space-y-1.5">
                      {optimization.rewritten_bullets.slice(0, 5).map((bullet, idx) => (
                        <li key={`${job.id}-opt-${idx}`} className="flex items-start gap-2 text-sm">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 px-6 pb-6 sm:gap-2">
          <Button
            variant="outline"
            onClick={onOptimizeRole}
            disabled={!resumeReady || optimizationLoading}
            title={resumeReady ? 'Optimize resume for this role' : 'Upload a resume in Resume Lab first'}
          >
            {optimizationLoading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <WandSparkles className="mr-1 h-4 w-4" />
            )}
            Optimize For This Role
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="transition-all hover:scale-105">
            Close
          </Button>
          {job.url ? (
            <Button asChild className="group transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply <ExternalLink className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Button>
          ) : (
            <Button disabled>
              Apply <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
