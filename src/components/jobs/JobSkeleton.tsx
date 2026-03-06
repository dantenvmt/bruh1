import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function JobSkeleton() {
  return (
    <Card className="w-full min-h-[30rem] sm:min-h-[32rem] overflow-hidden rounded-3xl border-border/70 bg-card/90 p-3.5 sm:p-4 animate-pulse">
      <div className="flex h-full flex-col gap-3">
        {/* Header: Company and Source */}
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>

        {/* Title */}
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>

        {/* Meta block */}
        <div className="rounded-xl border border-border/60 bg-background/40 p-2.5">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
          </div>
          <div className="mt-2">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Attention tags */}
        <div className="flex max-h-14 flex-wrap gap-1.5 overflow-hidden">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Highlights block */}
        <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
          <Skeleton className="h-3 w-28" />
          <div className="mt-2 space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Skeleton className="mt-1.5 h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </Card>
  );
}
