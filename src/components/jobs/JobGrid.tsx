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

// Fluid grid — columns fill automatically based on available width.
// Each card is at least 270px wide; more columns appear as window grows.
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
  gap: '1rem',
  alignItems: 'start',
} as const;

export function JobGrid({
  jobs,
  isLoading,
  onJobClick,
  isJobSaved,
  onToggleSaved,
  onOptimizeRole,
  resumeReady = false,
}: JobGridProps) {
  if (isLoading) {
    return (
      <div style={gridStyle}>
        {Array.from({ length: 8 }).map((_, index) => (
          <JobSkeleton key={index} />
        ))}
      </div>
    );
  }

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

  return (
    <div style={gridStyle}>
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
