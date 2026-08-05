import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-muted shimmer', className)}
      {...props}
    />
  );
}

function NewsCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function BriefingSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid md:grid-cols-2 gap-2 pt-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export { Skeleton, NewsCardSkeleton, BriefingSkeleton, ProfileSkeleton };
