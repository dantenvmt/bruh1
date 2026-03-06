import { Briefcase } from 'lucide-react';
import { JobCard } from './JobCard';
import { JobSkeleton } from './JobSkeleton';
import type { Job } from '@/api/types';

interface JobGridProps {
  jobs: Job[];
  isLoading?: boolean;
  onJobClick?: (job: Job) => void;
  isJobSaved?: (job: Job) => boolean;
  onToggleSaved?: (job: Job) => void;
  onOptimizeRole?: (job: Job) => void;
  resumeReady?: boolean;
}

export function JobGrid({
  jobs,
  isLoading,
  onJobClick,
  isJobSaved,
  onToggleSaved,
  onOptimizeRole,
  resumeReady = false,
}: JobGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <JobSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
          <div className="relative rounded-3xl border border-border/60 bg-gradient-to-br from-muted/70 to-background/70 p-8 mb-6 shadow-xl shadow-black/25">
            <Briefcase className="w-16 h-16 text-muted-foreground/70" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-3 text-center">No jobs found</h3>
        <p className="text-muted-foreground text-center max-w-md leading-relaxed">
          Try adjusting your filters or search terms to find more opportunities.
        </p>
      </div>
    );
  }

  // Job grid
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onClick={onJobClick}
          saved={isJobSaved?.(job) ?? false}
          onToggleSaved={onToggleSaved}
          onOptimizeRole={onOptimizeRole}
          resumeReady={resumeReady}
        />
      ))}
    </div>
  );
}
