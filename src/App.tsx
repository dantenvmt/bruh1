import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs';
import { ChevronDown, Loader2, WandSparkles } from 'lucide-react';

import { api } from '@/api/client';
import type {
  CritiqueLevel,
  Job,
  JobMatchResponse,
  OptimizeMode,
  ResumeAnalysisResponse,
  ResumeMatchProfile,
  ResumeOptimizeResponse,
} from '@/api/types';
import { type FilterState } from '@/components/filters/FilterBar';
import { JobCarousel } from '@/components/jobs/JobCarousel';
import { JobCardStack } from '@/components/jobs/JobCardStack';
import { JobDetailDialog } from '@/components/jobs/JobDetailDialog';
import { JobGrid } from '@/components/jobs/JobGrid';
import { TopBar } from '@/components/layout/TopBar';
import { ResumeLabPanel } from '@/components/resume/ResumeLabPanel';
import { Button } from '@/components/ui/button';
import { useJobsList } from '@/hooks/useJobs';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRecommendedJobs } from '@/hooks/useRecommendedJobs';
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
const GUEST_USER_ID_KEY = 'guest_user_id';
const DEFAULT_OPTIMIZE_MODE: OptimizeMode = 'bullets';
const DEFAULT_CRITIQUE_LEVEL: CritiqueLevel = 'balanced';

function getOrCreateGuestUserId(): string {
  if (typeof window === 'undefined') return 'guest';
  const stored = window.sessionStorage.getItem(GUEST_USER_ID_KEY);
  if (stored) return stored;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(GUEST_USER_ID_KEY, id);
  return id;
}

type GuestResumeState = {
  fileName: string | null;
  uploaded: boolean;
};

function getInitialContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(CONTRAST_STORAGE_KEY) === 'true';
}

function JobsPage() {
  const [highContrast] = useState<boolean>(getInitialContrastMode);
  const [activePage, setActivePage] = useState<'home' | 'feed' | 'recommended'>('home');
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [swipeIndex, setSwipeIndex] = useState(0);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [guestResume, setGuestResume] = useState<GuestResumeState>({ fileName: null, uploaded: false });
  const [optimizeMode, setOptimizeMode] = useState<OptimizeMode>(DEFAULT_OPTIMIZE_MODE);
  const [critiqueLevel, setCritiqueLevel] = useState<CritiqueLevel>(DEFAULT_CRITIQUE_LEVEL);
  const [resumeErrorMessage, setResumeErrorMessage] = useState<string | null>(null);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResponse | null>(null);
  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false);
  const [resumeMatchProfile, setResumeMatchProfile] = useState<ResumeMatchProfile | null>(null);
  const [jobMatchScoreById, setJobMatchScoreById] = useState<Record<string, JobMatchResponse>>({});
  const [matchScoreLoadingById, setMatchScoreLoadingById] = useState<Record<string, boolean>>({});
  const [jobOptimizationById, setJobOptimizationById] = useState<Record<string, ResumeOptimizeResponse>>({});
  const [optimizationLoadingById, setOptimizationLoadingById] = useState<Record<string, boolean>>({});
  const [resumeLabOpen, setResumeLabOpen] = useState(false);
  const guestUserId = useMemo(() => getOrCreateGuestUserId(), []);

  const [q, setQ] = useQueryState('q', parseAsString);
  const [location] = useQueryState('location', parseAsString);
  const [source] = useQueryState('source', parseAsString);
  const [remote] = useQueryState('remote', parseAsBoolean);

  const filters: FilterState = useMemo(
    () => ({
      q: q ?? '',
      location: location ?? '',
      source: source ?? '',
      remote: remote ?? false,
    }),
    [q, location, source, remote],
  );

  const queryParams = useMemo(
    () => ({
      q: filters.q || undefined,
      location: filters.location || undefined,
      source: filters.source || undefined,
      remote: filters.remote ? true : undefined,
    }),
    [filters.q, filters.location, filters.source, filters.remote],
  );

  const {
    jobs,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useJobsList(queryParams);

  const recommendedParams = useMemo(() => {
    const base = { ...queryParams };
    if (resumeMatchProfile?.skills_extracted && resumeMatchProfile.skills.length > 0) {
      const normalizedSkills = [...new Set(
        resumeMatchProfile.skills.map((skill) => skill.trim()).filter(Boolean),
      )].join(',');

      return {
        ...base,
        profile_skills: normalizedSkills,
        profile_experience_years: resumeMatchProfile.experience_years ?? undefined,
        user_id: guestUserId,
      };
    }

    return base;
  }, [queryParams, resumeMatchProfile, guestUserId]);

  const {
    jobs: recommendedJobs,
    isLoading: recommendedLoading,
  } = useRecommendedJobs(recommendedParams);

  const { isJobSaved, toggleSaved } = useSavedJobs();

  const getJobKey = (job: Job) => job.id;
  const resumeUploaded = guestResume.uploaded;

  const ensureMatchScore = async (job: Job, profile: ResumeMatchProfile) => {
    if (!profile.skills_extracted) return;
    const key = getJobKey(job);
    if (jobMatchScoreById[key] || matchScoreLoadingById[key]) return;
    setMatchScoreLoadingById((prev) => ({ ...prev, [key]: true }));
    try {
      const score = await api.jobs.matchScore(job.id, profile.skills, profile.experience_years);
      setJobMatchScoreById((prev) => ({ ...prev, [key]: score }));
    } catch {
      // Non-fatal
    } finally {
      setMatchScoreLoadingById((prev) => ({ ...prev, [key]: false }));
    }
  };

  const openDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
    if (resumeMatchProfile) void ensureMatchScore(job, resumeMatchProfile);
  };

  const handleResumeUpload = async (file: File) => {
    setResumeErrorMessage(null);
    setIsResumeUploading(true);
    try {
      const result = await api.resume.upload(guestUserId, file);
      setGuestResume({ fileName: result.filename || file.name, uploaded: true });
      setJobOptimizationById({});
      setJobMatchScoreById({});
      setResumeAnalysis(null);

      if (!result.skills_extracted) {
        setResumeErrorMessage(
          'Resume uploaded, but skills could not be extracted. Optimize-for-role and job summary features still work.',
        );
      }

      try {
        const profile = await api.resume.matchProfile(guestUserId);
        setResumeMatchProfile(profile);
      } catch {
        // Non-fatal
      }
    } catch (err) {
      setResumeErrorMessage(err instanceof Error ? err.message : 'Resume upload failed.');
    } finally {
      setIsResumeUploading(false);
    }
  };

  const handleClearResume = () => {
    setGuestResume({ fileName: null, uploaded: false });
    setResumeErrorMessage(null);
    setResumeAnalysis(null);
    setResumeMatchProfile(null);
    setJobOptimizationById({});
    setJobMatchScoreById({});
  };

  const handleAnalyzeResume = async () => {
    setResumeErrorMessage(null);
    setIsResumeAnalyzing(true);
    try {
      const result = await api.resume.analyze(guestUserId, critiqueLevel);
      setResumeAnalysis(result);
    } catch (err) {
      setResumeErrorMessage(err instanceof Error ? err.message : 'Resume analysis failed.');
    } finally {
      setIsResumeAnalyzing(false);
    }
  };

  const handleOptimizeForRole = async (job: Job) => {
    if (!resumeUploaded) {
      setResumeErrorMessage('Upload a resume in Resume Lab before role optimization.');
      return;
    }

    const key = getJobKey(job);
    setOptimizationLoadingById((prev) => ({ ...prev, [key]: true }));
    setResumeErrorMessage(null);
    try {
      const result = await api.resume.optimize(job.id, guestUserId, optimizeMode);
      setJobOptimizationById((prev) => ({ ...prev, [key]: result }));
    } catch (err) {
      setResumeErrorMessage(err instanceof Error ? err.message : 'Role optimization failed.');
    } finally {
      setOptimizationLoadingById((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  useEffect(() => {
    if (isMobile && hasNextPage && !isFetchingNextPage && jobs.length - swipeIndex <= 3) {
      fetchNextPage();
    }
  }, [isMobile, swipeIndex, jobs.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    setSwipeIndex(0);
  }, [queryParams]);

  const selectedSaved = selectedJob ? isJobSaved(selectedJob) : false;
  const selectedKey = selectedJob ? getJobKey(selectedJob) : null;
  const selectedMatchScore = selectedKey ? jobMatchScoreById[selectedKey] ?? null : null;
  const selectedOptimization = selectedKey ? jobOptimizationById[selectedKey] ?? null : null;
  const selectedOptimizationLoading = selectedKey ? Boolean(optimizationLoadingById[selectedKey]) : false;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.toggle('contrast', highContrast);
    window.localStorage.setItem(CONTRAST_STORAGE_KEY, String(highContrast));
  }, [highContrast]);

  return (
    <div className="min-h-screen w-full">
      <TopBar
        searchQuery={q ?? ''}
        onSearchChange={setQ}
        activePage={activePage}
        onPageChange={setActivePage}
        userName="User"
        onProfileClick={() => {
          // Profile click handler
        }}
      />

      <div className="w-full px-3 py-5 sm:px-4 md:px-6 lg:px-8">
        <main className="mx-auto w-full max-w-[1600px] space-y-6">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_32px_90px_-40px_rgba(0,0,0,0.92)] backdrop-blur-2xl sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
                    Premium job workspace
                  </div>
                  <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[0.95] text-foreground sm:text-5xl">
                    A cleaner command center for scanning serious opportunities.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                    Review curated openings, surface the strongest roles faster, and keep every card consistent enough to compare at a glance.
                  </p>
                </div>

                <div className="grid min-w-[240px] grid-cols-2 gap-3 sm:min-w-[320px]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4 backdrop-blur-md">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Live roles</div>
                    <div className="mt-2 text-3xl font-semibold text-foreground">{jobs.length}</div>
                    <div className="mt-1 text-xs text-white/46">Current results in your active feed</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4 backdrop-blur-md">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Recommended</div>
                    <div className="mt-2 text-3xl font-semibold text-foreground">{recommendedJobs.length}</div>
                    <div className="mt-1 text-xs text-white/46">Roles ranked for this session</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4 backdrop-blur-md">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Resume Lab</div>
                    <div className="mt-2 text-lg font-semibold text-foreground">{resumeUploaded ? 'Connected' : 'Waiting'}</div>
                    <div className="mt-1 text-xs text-white/46">Upload once to unlock job tailoring</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4 backdrop-blur-md">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Search state</div>
                    <div className="mt-2 text-lg font-semibold text-foreground">{filters.q ? 'Focused' : 'Broad'}</div>
                    <div className="mt-1 text-xs text-white/46">{filters.q || 'No keyword filter applied yet'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_32px_90px_-40px_rgba(0,0,0,0.92)] backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => setResumeLabOpen((value) => !value)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.06]">
                    <WandSparkles className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Resume Lab</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">Tune your resume against the roles you are reviewing</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {resumeUploaded && (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-100">
                      Ready
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-white/55 transition-transform duration-200',
                      resumeLabOpen && 'rotate-180',
                    )}
                  />
                </div>
              </button>

              {resumeLabOpen && (
                <div className="border-t border-white/10 px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
                  <ResumeLabPanel
                    resumeFileName={guestResume.fileName}
                    resumeUploaded={resumeUploaded}
                    optimizeMode={optimizeMode}
                    onOptimizeModeChange={setOptimizeMode}
                    critiqueLevel={critiqueLevel}
                    onCritiqueLevelChange={setCritiqueLevel}
                    onUpload={handleResumeUpload}
                    onClearResume={handleClearResume}
                    onAnalyzeResume={handleAnalyzeResume}
                    isUploading={isResumeUploading}
                    isAnalyzing={isResumeAnalyzing}
                    analysis={resumeAnalysis}
                    matchProfile={resumeMatchProfile}
                    errorMessage={resumeErrorMessage}
                  />
                </div>
              )}
            </div>
          </section>

          {isError && (
            <div className="rounded-[1.8rem] border border-destructive/35 bg-destructive/10 p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] backdrop-blur-lg">
              <div className="font-semibold text-destructive">Failed to load jobs</div>
              <div className="mt-2 text-sm leading-relaxed text-white/62">
                {error instanceof Error ? error.message : 'Unknown error'}
              </div>
              <div className="mt-5 flex gap-2">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-white/15 bg-white/[0.05] hover:border-white/22"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-4 px-1">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Featured stream</div>
                <h2 className="mt-2 font-display text-3xl text-foreground">Roles worth opening first</h2>
              </div>
              <div className="max-w-sm text-right text-sm text-white/50">
                Recommendations stay visually consistent with the main feed, so it is easier to compare seniority, compensation, and fit.
              </div>
            </div>
            <JobCarousel
              jobs={recommendedJobs}
              isLoading={recommendedLoading}
              onJobClick={openDetails}
              isJobSaved={isJobSaved}
              onToggleSaved={toggleSaved}
            />
          </section>

          {isMobile ? (
            <JobCardStack
              jobs={jobs}
              index={swipeIndex}
              onAdvance={() => setSwipeIndex((value) => value + 1)}
              onSave={toggleSaved}
              onToggleSaved={toggleSaved}
              onDismiss={() => {
                // dismiss = just advance
              }}
              onDetails={openDetails}
              isJobSaved={isJobSaved}
              onOptimizeRole={handleOptimizeForRole}
              resumeReady={resumeUploaded}
              isFetchingNextPage={isFetchingNextPage || isLoading}
            />
          ) : (
            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_32px_90px_-40px_rgba(0,0,0,0.92)] backdrop-blur-2xl sm:p-5">
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4 px-1">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Main feed</div>
                    <h2 className="mt-2 font-display text-3xl text-foreground">Uniform cards, faster scanning</h2>
                  </div>
                  <div className="max-w-md text-sm leading-6 text-white/50">
                    Consistent tiles, compact metadata, and tighter description panels keep the feed professional instead of visually noisy.
                  </div>
                </div>

                <JobGrid
                  jobs={jobs}
                  isLoading={isLoading}
                  onJobClick={openDetails}
                  isJobSaved={isJobSaved}
                  onToggleSaved={toggleSaved}
                  onOptimizeRole={handleOptimizeForRole}
                  resumeReady={resumeUploaded}
                />

                {hasNextPage && !isLoading && (
                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                      size="lg"
                      variant="outline"
                      className="border-white/15 bg-white/[0.05] transition-all hover:scale-[1.02] hover:border-white/24 hover:bg-white/[0.08]"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading more...
                        </>
                      ) : (
                        'Load more jobs'
                      )}
                    </Button>
                  </div>
                )}

                {!isLoading && jobs.length > 0 && (
                  <div className="text-center text-sm text-white/45">
                    Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      <JobDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        job={selectedJob}
        saved={selectedSaved}
        matchScore={selectedMatchScore}
        optimization={selectedOptimization}
        optimizationLoading={selectedOptimizationLoading}
        onOptimizeRole={() => {
          if (!selectedJob) return;
          void handleOptimizeForRole(selectedJob);
        }}
        resumeUploaded={resumeUploaded}
        optimizeMode={optimizeMode}
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
