import { formatDistanceToNow } from 'date-fns';
import { Bookmark, BookmarkCheck, ExternalLink, Loader2, MapPin, Sparkles, WandSparkles } from 'lucide-react';
import {
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
} from '@nextui-org/react';

import type { Job, JobMatchResponse, OptimizeMode, ResumeOptimizeResponse } from '@/api/types';
import { cn } from '@/lib/utils';

interface JobDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  saved: boolean;
  onToggleSaved: () => void;
  matchScore: JobMatchResponse | null;
  optimization: ResumeOptimizeResponse | null;
  optimizationLoading: boolean;
  onOptimizeRole: () => void;
  resumeUploaded: boolean;
  optimizeMode: OptimizeMode;
}

function formatPosted(dateString: string | null): string {
  if (!dateString) return 'Recently';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

function OptimizationResult({ optimization }: { optimization: ResumeOptimizeResponse }) {
  if (optimization.mode === 'bullets') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">{optimization.suggestions.length} bullet improvements</p>
        <ul className="space-y-3">
          {optimization.suggestions.map((s, idx) => (
            <li key={idx} className="space-y-1 rounded-lg border border-white/10 bg-background/40 p-2.5 text-sm">
              <div className="text-muted-foreground line-through">{s.original}</div>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{s.improved}</span>
              </div>
              <div className="text-xs text-muted-foreground italic">{s.reason}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (optimization.mode === 'overview') {
    const s = optimization.suggestions;
    return (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
          <p className="mt-1 text-muted-foreground">{s.original_summary}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Optimized</p>
          <div className="mt-1 flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p>{s.optimized_summary}</p>
          </div>
        </div>
        {s.key_changes.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Key Changes</p>
            <ul className="mt-1 space-y-1">
              {s.key_changes.map((change, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">• {change}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // full_rewrite
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Full rewritten resume</p>
      <pre className="whitespace-pre-wrap text-xs leading-relaxed">{optimization.optimized_resume}</pre>
    </div>
  );
}

const MODE_LABELS: Record<OptimizeMode, string> = {
  bullets: 'Bullet Improvements',
  overview: 'Summary Rewrite',
  full_rewrite: 'Full Rewrite',
};

function FitBandColor(band: string): string {
  if (band === 'strong') return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
  if (band === 'good') return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
  if (band === 'moderate') return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
  return 'bg-white/5 text-muted-foreground border-white/10';
}

export function JobDetailDialog({
  open,
  onOpenChange,
  job,
  saved,
  onToggleSaved,
  matchScore,
  optimization,
  optimizationLoading,
  onOptimizeRole,
  resumeUploaded,
  optimizeMode,
}: JobDetailDialogProps) {
  const summary = job?.ai_summary_detail ?? null;
  // Empty state
  if (!job) {
    return (
      <Modal
        isOpen={open}
        onOpenChange={onOpenChange}
        classNames={{
          base: "border border-white/10 bg-[#0d1117]/90 backdrop-blur-md",
          closeButton: "text-muted-foreground hover:text-foreground hover:bg-white/10",
        }}
      >
        <ModalContent>
          {() => (
            <ModalBody className="py-6">
              <p className="text-lg font-semibold text-foreground">Job details</p>
              <p className="text-sm text-muted-foreground">Nothing selected.</p>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    );
  }

  const companyLabel = job.company || 'Unknown company';
  const posted = formatPosted(job.posted_date);
  const skills = job.skills ?? [];
  const tags = job.tags ?? [];

  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: "border border-white/10 bg-[#0d1117]/90 backdrop-blur-md max-h-[88vh]",
        closeButton: "text-muted-foreground hover:text-foreground hover:bg-white/10 z-10",
        body: "px-6 py-4 space-y-3",
        footer: "border-t border-white/10 px-6 pb-6 gap-2",
      }}
    >
      <ModalContent>
        {(_onClose) => (
          <>
            {/* Custom header rendered inside ModalBody for layout control */}
            <ModalBody>
              {/* Header section */}
              <div className="flex items-start justify-between gap-3 pt-2 pr-8">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold leading-tight text-foreground">{job.title}</h2>
                  <p className="mt-1 text-sm">
                    <span className="font-medium text-foreground">{companyLabel}</span>
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {job.location && (
                      <Chip
                        variant="flat"
                        size="sm"
                        startContent={<MapPin className="h-3.5 w-3.5" />}
                        classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}
                      >
                        <span className="truncate max-w-[240px]">{job.location}</span>
                      </Chip>
                    )}
                    {job.remote && (
                      <Chip variant="flat" size="sm" classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}>
                        Remote
                      </Chip>
                    )}
                    {job.employment_type && (
                      <Chip variant="flat" size="sm" classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}>
                        {job.employment_type}
                      </Chip>
                    )}
                    {job.salary && (
                      <Chip variant="flat" size="sm" classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}>
                        {job.salary}
                      </Chip>
                    )}
                    <Chip variant="flat" size="sm" classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}>
                      {posted}
                    </Chip>
                    {matchScore && (
                      <Chip
                        variant="flat"
                        size="sm"
                        startContent={<Sparkles className="h-3 w-3" />}
                        classNames={{ base: cn("border", FitBandColor(matchScore.fit_band)) }}
                        title={`Match score: ${matchScore.match_score}/100`}
                      >
                        {matchScore.match_score}% match · {matchScore.fit_band}
                      </Chip>
                    )}
                  </div>
                </div>

                <Button
                  isIconOnly
                  variant={saved ? 'solid' : 'bordered'}
                  aria-label={saved ? 'Unsave job' : 'Save job'}
                  onPress={onToggleSaved}
                  className={cn(
                    'transition-all duration-300 shrink-0',
                    saved && 'bg-emerald-600 border-emerald-600 hover:bg-emerald-600/90 shadow-lg shadow-emerald-600/30',
                    !saved && 'border-white/20 hover:border-emerald-500/50 hover:text-emerald-500'
                  )}
                >
                  {saved
                    ? <BookmarkCheck className="transition-transform scale-110" />
                    : <Bookmark className="transition-transform hover:scale-110" />
                  }
                </Button>
              </div>

              {/* AI Summary */}
              {summary && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    AI Job Summary
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">{summary.summary_short}</p>
                  <ul className="mt-3 space-y-1.5">
                    {summary.summary_bullets.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {summary.attention_tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {summary.attention_tags.map((tag) => (
                        <Chip
                          key={tag}
                          variant="flat"
                          size="sm"
                          classNames={{
                            base: "border border-primary/25 bg-primary/10 uppercase",
                            content: "text-[10px] tracking-wide",
                          }}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full Description */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Full Description
                </p>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {job.description || 'No description provided.'}
                </div>
              </div>

              {/* Skills & Tags */}
              {(skills.length > 0 || tags.length > 0) && (
                <div className="space-y-2">
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill, idx) => (
                        <Chip
                          key={`${skill}-${idx}`}
                          variant="flat"
                          size="sm"
                          classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}
                        >
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag, idx) => (
                        <Chip
                          key={`${tag}-${idx}`}
                          variant="flat"
                          size="sm"
                          classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resume Optimization Results */}
              {(optimization || optimizationLoading) && (
                <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Resume Optimization
                    </p>
                    {optimization && (
                      <Chip
                        variant="flat"
                        size="sm"
                        classNames={{
                          base: "border border-white/10 bg-white/5 uppercase",
                          content: "text-[10px] tracking-wide text-foreground",
                        }}
                      >
                        {MODE_LABELS[optimization.mode]}
                      </Chip>
                    )}
                  </div>
                  {optimizationLoading ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Tailoring your resume to this role...
                    </div>
                  ) : optimization ? (
                    <div className="mt-3">
                      <OptimizationResult optimization={optimization} />
                    </div>
                  ) : null}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="flex-wrap">
              <Button
                variant="bordered"
                onPress={onOptimizeRole}
                isDisabled={!resumeUploaded || optimizationLoading}
                title={resumeUploaded ? `Optimize resume (${MODE_LABELS[optimizeMode]})` : 'Upload a resume in Resume Lab first'}
                className="border-white/20 text-foreground hover:border-white/40"
              >
                {optimizationLoading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="mr-1 h-4 w-4" />
                )}
                Optimize For This Role
              </Button>
              <Button
                variant="bordered"
                onPress={() => onOpenChange(false)}
                className="border-white/20 text-foreground hover:border-white/40 transition-all hover:scale-105"
              >
                Close
              </Button>
              {job.url ? (
                <Button
                  as="a"
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                  variant="solid"
                  className="transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
                  endContent={<ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                >
                  Apply
                </Button>
              ) : (
                <Button color="primary" variant="solid" isDisabled>
                  Apply <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
