import { Skeleton } from "@/components/ui/skeleton";
import { ColdStartNotice } from "@/components/layout/cold-start-notice";
import { PostCardSkeleton } from "@/components/features/skeletons";

/**
 * Full-page skeleton used as Suspense fallback and loading.tsx content.
 * Matches PostCard / BaseFeedCard dimensions to eliminate CLS and surfaces
 * contextual Render cold-start feedback after 3 seconds.
 */
export function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-4">
      <div className="w-full max-w-3xl space-y-4">
        <ColdStartNotice delayMs={3000} />

        {/* Page header skeleton */}
        <div className="space-y-2 pb-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        {/* Dimension-matched card skeletons */}
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}
