import { Briefcase } from 'lucide-react';

import type { Job } from '@/api/types';
import { JobCard } from './JobCard';
import { JobSkeleton } from './JobSkeleton';

interface JobGridProps {
  jobs: Job[];
  isLoading?: boolean;
  onJobClick?: (job: Job) => void;
  isJobSaved?: (job: Job) => boolean;
  onToggleSaved?: (job: Job) => void;
  onOptimizeRole?: (job: Job) => void;
  resumeReady?: boolean;
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))',
  gap: '1.25rem',
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
      <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-white/10 bg-black/10 px-4 py-20">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <div className="relative mb-6 rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-8 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <Briefcase className="h-16 w-16 text-muted-foreground/70" />
          </div>
        </div>
        <h3 className="mb-3 font-display text-3xl text-center text-foreground">No jobs found</h3>
        <p className="max-w-md text-center leading-relaxed text-white/55">
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
