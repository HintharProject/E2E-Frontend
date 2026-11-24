import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FeedCardSkeletonBodyProps {
  headerBand?: boolean;
  showTags?: boolean;
  showExtraBadges?: boolean;
}

function FeedCardSkeletonBody({
  headerBand = false,
  showTags = true,
  showExtraBadges = false,
}: FeedCardSkeletonBodyProps) {
  return (
    <div className="flex flex-1 min-w-0 flex-col">
      <div
        className={cn(
          "flex items-center justify-between gap-2.5",
          headerBand
            ? "border-b border-border/60 bg-muted/30 px-4 py-2.5"
            : "px-4 pt-3.5"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-36 max-w-full" />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 min-w-0 flex-col justify-between px-4 pb-3.5",
          headerBand ? "pt-3.5" : "pt-2"
        )}
      >
        <div className="min-w-0">
          <Skeleton className="h-5 w-3/4" />
          <div className="mt-1.5 space-y-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>

          {showExtraBadges && (
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}

          {showTags && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/45 pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-14 rounded" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <FeedCardSkeletonBody />
    </article>
  );
}

export function ProblemCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 sm:w-16 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/25 px-3 py-2.5">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex sm:flex-col items-center gap-1">
          <Skeleton className="h-3.5 w-5" />
          <Skeleton className="h-2.5 w-10 hidden sm:block" />
        </div>
      </div>

      <FeedCardSkeletonBody />
    </article>
  );
}

export function SolutionCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 sm:w-16 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/25 px-3 py-2.5">
        <Skeleton className="h-14 w-10 rounded-lg" />
      </div>

      <FeedCardSkeletonBody showTags={false} />
    </article>
  );
}

export function LessonCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <FeedCardSkeletonBody headerBand showExtraBadges />
    </article>
  );
}

export interface DetailedArticleSkeletonProps {
  hasBackLink?: boolean;
  headerTopPadding?: boolean;
  hasMedia?: boolean;
  followUp?: "comments" | "solutions";
}

/**
 * Borderless Detail Read Mode skeleton matching `BaseDetailedCard` + `PageHeader`.
 */
export function DetailedArticleSkeleton({
  hasBackLink = false,
  headerTopPadding = false,
  hasMedia = true,
  followUp = "comments",
}: DetailedArticleSkeletonProps) {
  return (
    <div aria-hidden="true" className="mx-auto max-w-[60rem] space-y-6">
      <div>
        {hasBackLink && <Skeleton className="mb-3 h-4 w-32" />}
        <div className="space-y-2 border-b border-border pb-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>

      <article className="flex flex-col gap-5">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border/60 pb-4",
            headerTopPadding && "pt-3"
          )}
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>

        {hasMedia && <Skeleton className="aspect-video w-full rounded-xl" />}

        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/65 pt-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </article>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        {followUp === "solutions" ? (
          <div className="space-y-4">
            <SolutionCardSkeleton />
            <SolutionCardSkeleton />
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Skeleton className="size-20 shrink-0 rounded-full sm:size-24" />
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-5/6 max-w-md" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-28" />
        <div className="mt-4 flex gap-4 overflow-hidden">
          <Skeleton className="h-44 w-72 shrink-0 rounded-xl" />
          <Skeleton className="h-44 w-72 shrink-0 rounded-xl" />
          <Skeleton className="h-44 w-72 shrink-0 rounded-xl" />
        </div>
      </div>
      <div>
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    </div>
  );
}
