import { Skeleton } from '@/components/ui/skeleton';

export function JobSkeleton() {
  return (
    <div className="flex h-[430px] flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-white/[0.055] p-5 animate-pulse backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      </div>

      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      <div className="space-y-3 rounded-[1.35rem] border border-white/10 bg-black/10 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
    </div>
  );
}
