import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placeholder for the AppHeader while user data is loading.
 * Mirrors the streamlined single-row header structure to prevent Cumulative Layout Shift (CLS).
 */
export function AppHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Logo + Nav pills placeholder */}
        <div className="flex items-center gap-6">
          <Skeleton className="h-8 w-12 rounded" />
          <div className="hidden md:flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-18 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-22 rounded-md" />
          </div>
        </div>

        {/* Center/Right: Search + Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="hidden md:block h-9 w-44 lg:w-60 rounded-lg" />
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="hidden sm:block h-9 w-28 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </header>
  );
}
