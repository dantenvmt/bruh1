import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Chip } from '@nextui-org/react';

import type { Job } from '@/api/types';
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

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Saved jobs are stored locally in your browser.
          </div>
          <Button
            variant="bordered"
            size="sm"
            onPress={onClearAll}
            isDisabled={jobs.length === 0}
            className="border-white/20 text-foreground hover:border-white/40"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="space-y-3 overflow-auto pr-1 max-h-[78vh]">
          {jobs.length === 0 ? (
            <div className="rounded-md border border-white/10 p-4 text-sm text-muted-foreground">
              No saved jobs yet. Swipe right or bookmark a job to save it.
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.dedupe_key}
                className="rounded-md border border-white/10 p-3 hover:bg-white/5 transition-colors"
              >
                <button
                  className="block w-full text-left"
                  onClick={() => onSelectJob(job)}
                >
                  <div className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">
                    {job.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {job.company || 'Unknown company'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.remote && (
                      <Chip
                        variant="flat"
                        size="sm"
                        classNames={{ base: "bg-white/5 border border-white/10 text-foreground" }}
                      >
                        Remote
                      </Chip>
                    )}
                    {job.location && (
                      <Chip
                        variant="flat"
                        size="sm"
                        classNames={{ base: "bg-white/5 border border-white/10 text-foreground max-w-full" }}
                      >
                        <span className="truncate">{job.location}</span>
                      </Chip>
                    )}
                  </div>
                </button>

                <div className="mt-3 flex justify-end">
                  <Button
                    variant="light"
                    size="sm"
                    onPress={() => onRemove(job.dedupe_key ?? job.id)}
                    aria-label="Remove saved job"
                    className="text-muted-foreground hover:text-foreground"
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
