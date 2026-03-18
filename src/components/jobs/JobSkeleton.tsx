import { Skeleton } from '@/components/ui/skeleton';

export function JobSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 animate-pulse">
      {/* Logo + company + title */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
      </div>

      {/* Location */}
      <Skeleton className="h-3 w-40" />

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
    </div>
  );
}
