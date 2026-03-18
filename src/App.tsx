import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs';
import {
  ChevronDown,
  Loader2,
  WandSparkles,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
  uploaded: boolean; // true once successfully uploaded to backend
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
    [q, location, source, remote]
  );

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
        resumeMatchProfile.skills.map(s => s.trim()).filter(Boolean)
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

  const { isJobSaved, toggleSaved } =
    useSavedJobs();

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
          'Resume uploaded, but skills could not be extracted (Groq not configured). ' +
          'Optimize for role and job summary features still work.'
        );
      }

      // Fetch the match profile so we can score jobs automatically
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

  // Auto-fetch next page when swipe index nears the end
  useEffect(() => {
    if (isMobile && hasNextPage && !isFetchingNextPage && jobs.length - swipeIndex <= 3) {
      fetchNextPage();
    }
  }, [isMobile, swipeIndex, jobs.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset swipe index when filters change
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
        <main className="w-full space-y-5">
          {/* Resume Lab — collapsible dropdown */}
          <div className="rounded-2xl border border-white/[0.06] bg-card/80 backdrop-blur shadow-lg shadow-black/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setResumeLabOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <WandSparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">Resume Lab</span>
                {resumeUploaded && (
                  <span className="inline-flex items-center rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Ready
                  </span>
                )}
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                resumeLabOpen && 'rotate-180'
              )} />
            </button>
            {resumeLabOpen && (
              <div className="border-t border-white/[0.05] px-5 py-4">
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

          <JobCarousel
            jobs={recommendedJobs}
            isLoading={recommendedLoading}
            onJobClick={openDetails}
            isJobSaved={isJobSaved}
            onToggleSaved={toggleSaved}
          />

          {isMobile ? (
            <JobCardStack
              jobs={jobs}
              index={swipeIndex}
              onAdvance={() => setSwipeIndex((i) => i + 1)}
              onSave={toggleSaved}
              onToggleSaved={toggleSaved}
              onDismiss={() => {/* dismiss = just advance */}}
              onDetails={openDetails}
              isJobSaved={isJobSaved}
              onOptimizeRole={handleOptimizeForRole}
              resumeReady={resumeUploaded}
              isFetchingNextPage={isFetchingNextPage || isLoading}
            />
          ) : (
            <section className="w-full rounded-[1.7rem] border border-white/[0.06] bg-card/80 p-4 shadow-xl shadow-black/25 backdrop-blur sm:p-5">
              <div className="space-y-6">
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
                              ↓
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
