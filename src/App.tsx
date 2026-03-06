import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs';
import {
  BarChart3,
  Bookmark,
  Compass,
  LayoutGrid,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { api } from '@/api/client';
import type {
  CritiqueLevel,
  Job,
  JobAiSummaryResponse,
  ResumeAnalysisResponse,
  ResumeOptimizeResponse,
} from '@/api/types';
import { FilterBar, type FilterState } from '@/components/filters/FilterBar';
import { FilterSheet } from '@/components/filters/FilterSheet';
import { JobCardStack } from '@/components/jobs/JobCardStack';
import { JobDetailDialog } from '@/components/jobs/JobDetailDialog';
import { JobGrid } from '@/components/jobs/JobGrid';
import { SavedJobsSheet } from '@/components/jobs/SavedJobsSheet';
import { ResumeLabPanel } from '@/components/resume/ResumeLabPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useJobsList } from '@/hooks/useJobs';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import { cn } from '@/lib/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const CONTRAST_STORAGE_KEY = 'job_feed_high_contrast';
const GUEST_RESUME_SESSION_KEY = 'job_feed_guest_resume_v1';
const DEFAULT_CRITIQUE_LEVEL: CritiqueLevel = 'balanced';

type GuestResumeState = {
  fileName: string | null;
  text: string;
};

function getInitialContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(CONTRAST_STORAGE_KEY) === 'true';
}

function readGuestResumeState(): GuestResumeState {
  if (typeof window === 'undefined') return { fileName: null, text: '' };
  const raw = window.sessionStorage.getItem(GUEST_RESUME_SESSION_KEY);
  if (!raw) return { fileName: null, text: '' };
  try {
    const parsed = JSON.parse(raw) as GuestResumeState;
    return {
      fileName: parsed.fileName || null,
      text: parsed.text || '',
    };
  } catch {
    return { fileName: null, text: '' };
  }
}

function SwipeFeed({
  jobs,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onSave,
  onToggleSaved,
  onOptimizeRole,
  onDetails,
  isJobSaved,
  resumeReady,
}: {
  jobs: Job[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void | Promise<unknown>;
  onSave: (job: Job) => void;
  onToggleSaved: (job: Job) => void;
  onOptimizeRole: (job: Job) => void;
  onDetails: (job: Job) => void;
  isJobSaved: (job: Job) => boolean;
  resumeReady: boolean;
}) {
  const [swipeIndex, setSwipeIndex] = useState(0);

  useEffect(() => {
    setSwipeIndex((prev) => {
      if (jobs.length <= 0) return 0;
      return Math.min(prev, jobs.length - 1);
    });
  }, [jobs.length]);

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && swipeIndex + 6 >= jobs.length) {
      void fetchNextPage();
    }
  }, [swipeIndex, jobs.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleAdvanceSwipe = () => {
    setSwipeIndex((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2">Loading feed...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <JobCardStack
        jobs={jobs}
        index={swipeIndex}
        onAdvance={handleAdvanceSwipe}
        onSave={onSave}
        onToggleSaved={onToggleSaved}
        onDismiss={() => {}}
        onDetails={onDetails}
        isJobSaved={isJobSaved}
        onOptimizeRole={onOptimizeRole}
        resumeReady={resumeReady}
      />

      <div className="text-center text-xs text-muted-foreground">
        Loaded {jobs.length} jobs{hasNextPage ? ' (more available)' : ''}.
      </div>
    </div>
  );
}

function JobsPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [mobileMode, setMobileMode] = useState<'swipe' | 'list'>('swipe');
  const [highContrast, setHighContrast] = useState<boolean>(getInitialContrastMode);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [guestResume, setGuestResume] = useState<GuestResumeState>(readGuestResumeState);
  const [critiqueLevel, setCritiqueLevel] = useState<CritiqueLevel>(DEFAULT_CRITIQUE_LEVEL);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResponse | null>(null);
  const [resumeErrorMessage, setResumeErrorMessage] = useState<string | null>(null);
  const [isResumeExtracting, setIsResumeExtracting] = useState(false);
  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false);
  const [jobSummaryById, setJobSummaryById] = useState<Record<string, JobAiSummaryResponse>>({});
  const [summaryLoadingById, setSummaryLoadingById] = useState<Record<string, boolean>>({});
  const [jobOptimizationById, setJobOptimizationById] = useState<Record<string, ResumeOptimizeResponse>>({});
  const [optimizationLoadingById, setOptimizationLoadingById] = useState<Record<string, boolean>>({});

  const [q, setQ] = useQueryState('q', parseAsString);
  const [location, setLocation] = useQueryState('location', parseAsString);
  const [source, setSource] = useQueryState('source', parseAsString);
  const [remote, setRemote] = useQueryState('remote', parseAsBoolean);

  const filters: FilterState = useMemo(
    () => ({
      q: q ?? '',
      location: location ?? '',
      source: source ?? '',
      remote: remote ?? false,
    }),
    [q, location, source, remote]
  );

  const setFilters = (next: FilterState) => {
    setQ(next.q ? next.q : null);
    setLocation(next.location ? next.location : null);
    setSource(next.source ? next.source : null);
    setRemote(next.remote ? true : null);
  };

  const queryParams = useMemo(
    () => ({
      q: filters.q || undefined,
      location: filters.location || undefined,
      source: filters.source || undefined,
      remote: filters.remote ? true : undefined,
    }),
    [filters.q, filters.location, filters.source, filters.remote]
  );

  const {
    jobs,
    asOf,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useJobsList(queryParams);

  const { savedJobs, savedCount, isJobSaved, saveJob, unsaveJob, toggleSaved, clearAll } =
    useSavedJobs();

  const mode = isMobile ? mobileMode : 'list';
  const feedKey = useMemo(
    () => JSON.stringify([filters.q, filters.location, filters.source, filters.remote]),
    [filters.q, filters.location, filters.source, filters.remote]
  );

  const getJobKey = (job: Job) => job.id;
  const resumeReady = Boolean(guestResume.text.trim());

  const persistGuestResume = (next: GuestResumeState) => {
    setGuestResume(next);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(GUEST_RESUME_SESSION_KEY, JSON.stringify(next));
    }
  };

  const ensureJobSummary = async (job: Job) => {
    const key = getJobKey(job);
    if (jobSummaryById[key] || summaryLoadingById[key]) return;
    setSummaryLoadingById((prev) => ({ ...prev, [key]: true }));
    try {
      const summary = await api.ai.summary(job.id);
      setJobSummaryById((prev) => ({ ...prev, [key]: summary }));
    } catch {
      // Keep UI responsive with no hard failure.
    } finally {
      setSummaryLoadingById((prev) => ({ ...prev, [key]: false }));
    }
  };

  const openDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
    void ensureJobSummary(job);
  };

  const handleResumeUpload = async (file: File) => {
    setResumeErrorMessage(null);
    setIsResumeExtracting(true);
    try {
      const extracted = await api.ai.extractResume(file);
      persistGuestResume({
        fileName: extracted.file_name || file.name,
        text: extracted.text || '',
      });
      setResumeAnalysis(null);
      if (!extracted.text?.trim()) {
        setResumeErrorMessage('Could not extract readable text from this file.');
      }
    } catch (err) {
      setResumeErrorMessage(err instanceof Error ? err.message : 'Resume upload failed.');
    } finally {
      setIsResumeExtracting(false);
    }
  };

  const handleClearResume = () => {
    persistGuestResume({ fileName: null, text: '' });
    setResumeAnalysis(null);
    setResumeErrorMessage(null);
  };

  const handleAnalyzeResume = async () => {
    if (!resumeReady) {
      setResumeErrorMessage('Upload a resume first.');
      return;
    }
    setResumeErrorMessage(null);
    setIsResumeAnalyzing(true);
    try {
      const result = await api.ai.analyzeResume(guestResume.text, critiqueLevel);
      setResumeAnalysis(result);
    } catch (err) {
      setResumeErrorMessage(err instanceof Error ? err.message : 'Resume analysis failed.');
    } finally {
      setIsResumeAnalyzing(false);
    }
  };

  const handleOptimizeForRole = async (job: Job) => {
    if (!resumeReady) {
      setResumeErrorMessage('Upload a resume in Resume Lab before role optimization.');
      return;
    }
    const key = getJobKey(job);
    setOptimizationLoadingById((prev) => ({ ...prev, [key]: true }));
    setResumeErrorMessage(null);
    try {
      const result = await api.ai.optimizeResumeForJob(job.id, guestResume.text, critiqueLevel);
      setJobOptimizationById((prev) => ({ ...prev, [key]: result }));
      openDetails(job);
    } catch (err) {
      setResumeErrorMessage(err instanceof Error ? err.message : 'Role optimization failed.');
    } finally {
      setOptimizationLoadingById((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const selectedSaved = selectedJob ? isJobSaved(selectedJob) : false;
  const selectedKey = selectedJob ? getJobKey(selectedJob) : null;
  const selectedAiSummary = selectedKey ? jobSummaryById[selectedKey] ?? null : null;
  const selectedAiSummaryLoading = selectedKey ? Boolean(summaryLoadingById[selectedKey]) : false;
  const selectedOptimization = selectedKey ? jobOptimizationById[selectedKey] ?? null : null;
  const selectedOptimizationLoading = selectedKey ? Boolean(optimizationLoadingById[selectedKey]) : false;
  const navItems = ['Home', 'Swipe Feed', 'All Jobs', 'Saved Roles', 'FAQ'];

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.toggle('contrast', highContrast);
    window.localStorage.setItem(CONTRAST_STORAGE_KEY, String(highContrast));
  }, [highContrast]);

  const contrastToggle = (
    <Button
      variant={highContrast ? 'default' : 'outline'}
      size="sm"
      onClick={() => setHighContrast((prev) => !prev)}
      aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      title={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      className="min-w-28 transition-all duration-300"
    >
      {highContrast ? 'Contrast: On' : 'Contrast: Off'}
    </Button>
  );

  const savedTrigger = (
    <Button
      variant="outline"
      size={isMobile ? 'icon' : 'default'}
      className={cn(
        'border-border/70 bg-background/60 text-foreground transition-all duration-300 hover:bg-muted/60',
        !isMobile && 'gap-2',
        savedCount > 0 &&
          'border-primary/50 bg-primary/10 text-foreground hover:border-primary hover:shadow-lg hover:shadow-primary/20'
      )}
      aria-label="Open saved jobs"
    >
      <Bookmark className={cn(savedCount > 0 && 'fill-primary text-primary')} />
      {!isMobile && (
        <>
          Saved
          {savedCount > 0 && (
            <Badge variant="secondary" className="shadow-sm">
              {savedCount}
            </Badge>
          )}
        </>
      )}
    </Button>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1820px] px-3 py-6 sm:px-6 lg:px-8 2xl:px-8">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="hidden lg:flex lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] flex-col rounded-[1.6rem] border border-border/70 bg-card/80 p-5 shadow-xl shadow-black/25 backdrop-blur">
            <div>
              <p className="font-display text-2xl font-bold tracking-tight">Renaisons Jobs</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Discover. Match. Apply.
              </p>
            </div>

            <nav className="mt-8 space-y-1.5">
              {navItems.map((item, idx) => (
                <button
                  key={item}
                  type="button"
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-left text-sm transition-all',
                    idx === 0
                      ? 'border-primary/50 bg-primary/10 text-foreground'
                      : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground'
                  )}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="mt-auto rounded-xl border border-border/60 bg-background/50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Status</p>
              <p className="mt-2 text-sm text-foreground">
                API-connected feed with stable session ordering.
              </p>
            </div>
          </aside>

          <main className="space-y-6">
            <header className="rounded-[2rem] border border-border/70 bg-card/80 p-5 shadow-xl shadow-black/25 backdrop-blur sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Hiring Signal Feed
                  </p>
                  <h1 className="font-display text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
                    Shape your job hunt around signal, not noise.
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Fast role discovery, high-confidence metadata, and a swipe flow tuned for
                    decisions.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <SavedJobsSheet
                    jobs={savedJobs}
                    onSelectJob={(job) => openDetails(job)}
                    onRemove={unsaveJob}
                    onClearAll={clearAll}
                    trigger={savedTrigger}
                  />
                  {contrastToggle}

                  {isMobile && (
                    <>
                      <FilterSheet filters={filters} onChange={setFilters} />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMobileMode((m) => (m === 'swipe' ? 'list' : 'swipe'))}
                        aria-label="Toggle swipe/list view"
                      >
                        <LayoutGrid />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/45 p-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Jobs Loaded
                  </div>
                  <p className="mt-1 text-2xl font-semibold">{jobs.length}+</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/45 p-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <Compass className="h-3.5 w-3.5" />
                    Saved Roles
                  </div>
                  <p className="mt-1 text-2xl font-semibold">{savedCount}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/45 p-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Feed Mode
                  </div>
                  <p className="mt-1 text-2xl font-semibold">Stable</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full bg-background/80 px-3 py-1">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Stable session feed
                </Badge>
                {asOf && (
                  <Badge variant="outline" className="rounded-full bg-background/80 px-3 py-1">
                    Snapshot {new Date(asOf).toLocaleString()}
                  </Badge>
                )}
              </div>
            </header>

            {isMobile && (
              <section className="rounded-[1.4rem] border border-border/70 bg-card/80 p-4 shadow-xl shadow-black/25 backdrop-blur">
                <ResumeLabPanel
                  resumeFileName={guestResume.fileName}
                  resumeText={guestResume.text}
                  critiqueLevel={critiqueLevel}
                  onCritiqueLevelChange={setCritiqueLevel}
                  onUpload={handleResumeUpload}
                  onClearResume={handleClearResume}
                  onAnalyzeResume={handleAnalyzeResume}
                  isExtracting={isResumeExtracting}
                  isAnalyzing={isResumeAnalyzing}
                  analysis={resumeAnalysis}
                  errorMessage={resumeErrorMessage}
                />
              </section>
            )}

            {!isMobile && (
              <section className="rounded-[1.7rem] border border-border/70 bg-card/80 p-4 shadow-xl shadow-black/25 backdrop-blur sm:p-5">
                <FilterBar filters={filters} onChange={setFilters} />
              </section>
            )}

            {!isMobile && (
              <section className="hidden rounded-[1.7rem] border border-border/70 bg-card/80 p-4 shadow-xl shadow-black/25 backdrop-blur sm:p-5 lg:block 2xl:hidden">
                <ResumeLabPanel
                  resumeFileName={guestResume.fileName}
                  resumeText={guestResume.text}
                  critiqueLevel={critiqueLevel}
                  onCritiqueLevelChange={setCritiqueLevel}
                  onUpload={handleResumeUpload}
                  onClearResume={handleClearResume}
                  onAnalyzeResume={handleAnalyzeResume}
                  isExtracting={isResumeExtracting}
                  isAnalyzing={isResumeAnalyzing}
                  analysis={resumeAnalysis}
                  errorMessage={resumeErrorMessage}
                />
              </section>
            )}

            {isError && (
              <div className="rounded-[1.4rem] border border-destructive/50 bg-destructive/10 p-6 shadow-lg shadow-black/25">
                <div className="font-semibold text-destructive">Failed to load jobs</div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </div>
                <div className="mt-5 flex gap-2">
                  <Button
                    onClick={() => refetch()}
                    variant="outline"
                    className="hover:border-primary/50 transition-all"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            <section className="rounded-[1.7rem] border border-border/70 bg-card/80 p-4 shadow-xl shadow-black/25 backdrop-blur sm:p-5">
              {isMobile && mode === 'swipe' ? (
                <SwipeFeed
                  key={feedKey}
                  jobs={jobs}
                  isLoading={isLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={Boolean(hasNextPage)}
                  fetchNextPage={fetchNextPage}
                  onSave={saveJob}
                  onToggleSaved={toggleSaved}
                  onOptimizeRole={handleOptimizeForRole}
                  onDetails={openDetails}
                  isJobSaved={isJobSaved}
                  resumeReady={resumeReady}
                />
              ) : (
                <div className="space-y-6">
                  <JobGrid
                    jobs={jobs}
                    isLoading={isLoading}
                    onJobClick={openDetails}
                    isJobSaved={isJobSaved}
                    onToggleSaved={toggleSaved}
                    onOptimizeRole={handleOptimizeForRole}
                    resumeReady={resumeReady}
                  />

                  {hasNextPage && !isLoading && (
                    <div className="flex justify-center pt-2">
                      <Button
                        onClick={handleLoadMore}
                        disabled={isFetchingNextPage}
                        size="lg"
                        variant="outline"
                        className="group transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/15"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          <>
                            Load more jobs
                            <span className="ml-2 transition-transform group-hover:translate-y-0.5">
                              v
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!isLoading && jobs.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </section>
          </main>

          <aside className="hidden 2xl:block 2xl:sticky 2xl:top-6 2xl:h-[calc(100vh-3rem)]">
            <ResumeLabPanel
              resumeFileName={guestResume.fileName}
              resumeText={guestResume.text}
              critiqueLevel={critiqueLevel}
              onCritiqueLevelChange={setCritiqueLevel}
              onUpload={handleResumeUpload}
              onClearResume={handleClearResume}
              onAnalyzeResume={handleAnalyzeResume}
              isExtracting={isResumeExtracting}
              isAnalyzing={isResumeAnalyzing}
              analysis={resumeAnalysis}
              errorMessage={resumeErrorMessage}
            />
          </aside>
        </div>
      </div>

      <JobDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        job={selectedJob}
        saved={selectedSaved}
        aiSummary={selectedAiSummary}
        aiSummaryLoading={selectedAiSummaryLoading}
        optimization={selectedOptimization}
        optimizationLoading={selectedOptimizationLoading}
        onOptimizeRole={() => {
          if (!selectedJob) return;
          void handleOptimizeForRole(selectedJob);
        }}
        resumeReady={resumeReady}
        critiqueLevel={critiqueLevel}
        onToggleSaved={() => {
          if (!selectedJob) return;
          toggleSaved(selectedJob);
        }}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JobsPage />
    </QueryClientProvider>
  );
}

export default App;
