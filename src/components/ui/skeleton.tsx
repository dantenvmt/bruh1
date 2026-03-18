// NextUI Skeleton — drop-in replacement for shadcn Skeleton
import { Skeleton as NextSkeleton } from '@nextui-org/react'
import { cn } from '@/lib/utils'

function Skeleton({ className }: { className?: string }) {
  return (
    <NextSkeleton className={cn('rounded-lg', className)}>
      <div className="h-full w-full" />
    </NextSkeleton>
  )
}

export { Skeleton }
