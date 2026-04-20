import { type ReactNode } from 'react';
import { ExternalLink, Loader2, MapPin, Sparkles, WandSparkles } from 'lucide-react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from '@nextui-org/react';

import type { Job, JobMatchResponse, OptimizeMode, ResumeOptimizeResponse } from '@/api/types';
import {
  buildJobTags,
  extractSkillTags,
  formatEmploymentType,
  formatPostedDate,
  getJobSummaryBullets,
  getTagClasses,
} from '@/lib/jobPresentation';
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

const MODE_LABELS: Record<OptimizeMode, string> = {
  bullets: 'Bullet Improvements',
  overview: 'Summary Rewrite',
  full_rewrite: 'Full Rewrite',
};

function getFitBandClasses(band: string): string {
  if (band === 'strong') return 'border-emerald-400/25 bg-emerald-400/12 text-emerald-100';
  if (band === 'good') return 'border-sky-300/25 bg-sky-300/12 text-sky-100';
  if (band === 'moderate') return 'border-amber-300/25 bg-amber-300/12 text-amber-100';
  return 'border-white/10 bg-white/[0.05] text-white/68';
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</div>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function OptimizationResult({ optimization }: { optimization: ResumeOptimizeResponse }) {
  if (optimization.mode === 'bullets') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/55">{optimization.suggestions.length} bullet improvements generated</p>
        <ul className="space-y-3">
          {optimization.suggestions.map((suggestion, index) => (
            <li key={index} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm line-through text-white/42">{suggestion.original}</div>
              <div className="mt-3 flex items-start gap-3">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <div className="text-sm leading-7 text-foreground">{suggestion.improved}</div>
              </div>
              <div className="mt-3 text-sm text-white/52">{suggestion.reason}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (optimization.mode === 'overview') {
    return (
      <div className="space-y-5 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Original</div>
          <p className="mt-2 leading-7 text-white/58">{optimization.suggestions.original_summary}</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Optimized</div>
          <div className="mt-2 flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <p className="leading-7 text-foreground">{optimization.suggestions.optimized_summary}</p>
          </div>
        </div>
        {optimization.suggestions.key_changes.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Key Changes</div>
            <ul className="mt-3 space-y-2">
              {optimization.suggestions.key_changes.map((change, index) => (
                <li key={index} className="flex gap-3 text-sm text-white/62">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/38 shrink-0" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
      <pre className="whitespace-pre-wrap text-sm leading-7 text-foreground">{optimization.optimized_resume}</pre>
    </div>
  );
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
  if (!job) {
    return (
      <Modal
        isOpen={open}
        onOpenChange={onOpenChange}
        classNames={{
          base: 'border border-white/10 bg-[linear-gradient(180deg,rgba(12,21,35,0.96),rgba(7,14,24,0.92))] backdrop-blur-2xl',
          closeButton: 'text-white/52 hover:text-foreground hover:bg-white/[0.08]',
        }}
      >
        <ModalContent>
          {() => (
            <ModalBody className="py-8">
              <p className="font-display text-2xl text-foreground">Job details</p>
              <p className="text-sm text-white/55">Nothing selected.</p>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    );
  }

  const companyLabel = job.company || 'Unknown company';
  const posted = formatPostedDate(job.posted_date);
  const skillTags = extractSkillTags(job, 6);
  const metaTags = buildJobTags(job);
  const summaryBullets = getJobSummaryBullets(job, 4);
  const employmentType = formatEmploymentType(job.employment_type);
  const attentionTags = job.ai_summary_detail?.attention_tags ?? [];

  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: 'border border-white/10 bg-[linear-gradient(180deg,rgba(12,21,35,0.96),rgba(7,14,24,0.92))] backdrop-blur-2xl max-h-[90vh]',
        closeButton: 'text-white/52 hover:text-foreground hover:bg-white/[0.08] z-10',
        body: 'px-6 py-5',
        footer: 'border-t border-white/10 px-6 py-5',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalBody>
              <div className="space-y-5">
                <section className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                        {job.source || 'Aggregated'}
                      </div>
                      <h2 className="mt-3 font-display text-4xl leading-none text-foreground">{job.title}</h2>
                      <div className="mt-4 text-base font-medium text-white/74">{companyLabel}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/52">
                        {job.location && (
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {employmentType && <span>{employmentType}</span>}
                        <span>{posted}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleSaved}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                        saved
                          ? 'border-white/16 bg-white/[0.14] text-foreground'
                          : 'border-white/10 bg-white/[0.05] text-white/65 hover:border-white/16 hover:bg-white/[0.09] hover:text-foreground'
                      )}
                    >
                      {saved ? 'Saved' : 'Save role'}
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {metaTags.map((tag) => (
                      <span
                        key={tag.label}
                        className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium', getTagClasses(tag.tone))}
                      >
                        {tag.label}
                      </span>
                    ))}
                    {matchScore && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium',
                          getFitBandClasses(matchScore.fit_band),
                        )}
                        title={`Match score: ${matchScore.match_score}/100`}
                      >
                        {matchScore.match_score}% match · {matchScore.fit_band}
                      </span>
                    )}
                  </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <div className="space-y-5">
                    <Section label="Summary" title="Role overview">
                      {summaryBullets.length > 0 ? (
                        <ul className="space-y-3">
                          {summaryBullets.map((point, index) => (
                            <li key={index} className="flex gap-3 text-sm leading-7 text-white/68">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/38 shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm leading-7 text-white/58">
                          No summary is available yet for this role.
                        </p>
                      )}
                    </Section>

                    <Section label="Description" title="Full posting">
                      <div className="whitespace-pre-wrap text-sm leading-7 text-white/68">
                        {job.description || 'No description provided.'}
                      </div>
                    </Section>
                  </div>

                  <div className="space-y-5">
                    <Section label="Signal set" title="Skills and attention tags">
                      {skillTags.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Skills</div>
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
                        </div>
                      )}

                      {attentionTags.length > 0 && (
                        <div className="mt-5">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Attention tags</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {attentionTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/72"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </Section>

                    {(optimization || optimizationLoading) && (
                      <Section label="Resume Lab" title="Optimization output">
                        {optimizationLoading ? (
                          <div className="flex items-center gap-3 text-sm text-white/58">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Tailoring your resume to this role...
                          </div>
                        ) : optimization ? (
                          <OptimizationResult optimization={optimization} />
                        ) : null}
                      </Section>
                    )}
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="flex-wrap justify-between gap-3">
              <div className="text-sm text-white/45">Mode: {MODE_LABELS[optimizeMode]}</div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="bordered"
                  onPress={onOptimizeRole}
                  isDisabled={!resumeUploaded || optimizationLoading}
                  title={resumeUploaded ? `Optimize resume (${MODE_LABELS[optimizeMode]})` : 'Upload a resume in Resume Lab first'}
                  className="border-white/12 bg-white/[0.05] text-foreground hover:bg-white/[0.08]"
                >
                  {optimizationLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <WandSparkles className="mr-2 h-4 w-4" />
                  )}
                  Optimize For This Role
                </Button>
                <Button
                  variant="bordered"
                  onPress={() => onOpenChange(false)}
                  className="border-white/12 bg-white/[0.05] text-foreground hover:bg-white/[0.08]"
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
                    className="bg-white text-slate-950 hover:bg-white/90"
                    endContent={<ExternalLink className="h-4 w-4" />}
                  >
                    Apply
                  </Button>
                ) : (
                  <Button color="primary" variant="solid" isDisabled className="bg-white text-slate-950/70">
                    Apply
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
