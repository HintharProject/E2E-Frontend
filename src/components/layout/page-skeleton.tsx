import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page skeleton used as Suspense fallback and loading.tsx content.
 * Mimics a card-based page layout with contextual cold-start messaging.
 *
 * Per UI_MIGRATION_SPECS.md §6:
 * "Include small contextual text (e.g., 'Waking up server...')"
 */
export function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-12">
      {/* Cold-start message */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          Waking up server…
        </p>
      </div>

      {/* Content placeholder cards */}
      <div className="w-full max-w-3xl space-y-4">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Card skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
