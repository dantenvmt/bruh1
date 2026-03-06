import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

import type { Job } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface SavedJobsSheetProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onRemove: (dedupeKey: string) => void;
  onClearAll: () => void;
  trigger: ReactNode;
}

export function SavedJobsSheet({
  jobs,
  onSelectJob,
  onRemove,
  onClearAll,
  trigger,
}: SavedJobsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Saved Jobs ({jobs.length})</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Saved jobs are stored locally in your browser.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={jobs.length === 0}
          >
            <Trash2 />
            Clear
          </Button>
        </div>

        <div className="mt-6 space-y-3 overflow-auto pr-1 max-h-[78vh]">
          {jobs.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No saved jobs yet. Swipe right or bookmark a job to save it.
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.dedupe_key}
                className="rounded-md border p-3 hover:bg-accent/50 transition-colors"
              >
                <button
                  className="block w-full text-left"
                  onClick={() => onSelectJob(job)}
                >
                  <div className="text-sm font-semibold leading-snug line-clamp-2">
                    {job.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {job.company || 'Unknown company'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.source && <Badge variant="outline">via {job.source}</Badge>}
                    {job.remote && <Badge variant="secondary">Remote</Badge>}
                    {job.location && (
                      <Badge variant="secondary" className="max-w-full truncate">
                        {job.location}
                      </Badge>
                    )}
                  </div>
                </button>

                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(job.dedupe_key ?? job.id)}
                    aria-label="Remove saved job"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
