import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placeholder for the AppHeader while user data is loading.
 * Mirrors the header's visual structure with pulsing blocks.
 */
export function AppHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        {/* Top row: Logo + search + avatar */}
        <div className="flex items-center gap-4">
          {/* Logo placeholder */}
          <Skeleton className="h-8 w-14 rounded" />

          {/* Search bar placeholder (desktop) */}
          <Skeleton className="hidden h-9 flex-1 rounded-full md:block" />

          {/* Avatar + badge placeholder */}
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>

        {/* Navigation pills placeholder */}
        <nav className="flex gap-1 pb-1">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </nav>

        {/* Mobile search placeholder */}
        <Skeleton className="h-9 w-full rounded-full md:hidden" />
      </div>
    </header>
  );
}
