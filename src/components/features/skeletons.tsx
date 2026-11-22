import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export function PostCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-[18px] w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Skeleton className="h-6 w-3/4" />
        <div className="mt-2 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </CardContent>
      <CardFooter className="justify-between pt-4 mt-1 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </CardFooter>
    </Card>
  );
}

export function ProblemCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex flex-col sm:flex-row rounded-xl border border-border bg-card shadow-card overflow-hidden"
    >
      {/* Left Status & Vote Rail */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:w-20 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/25 px-4 py-2.5 sm:px-2 sm:py-4">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="flex sm:flex-col items-center gap-1">
          <Skeleton className="h-3.5 w-6" />
          <Skeleton className="h-2.5 w-12 hidden sm:block" />
        </div>
      </div>

      {/* Main Challenge Ticket Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-[18px] w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </div>
    </article>
  );
}

export function LessonCardSkeleton() {
  return (
    <Card aria-hidden="true" className="flex h-full flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-start justify-between gap-2.5 space-y-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-[18px] w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          <Skeleton className="h-5 w-4/5" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardContent>
      </div>
      <CardFooter className="justify-between gap-2 pt-3 mt-4 border-t border-border/50">
        <Skeleton className="h-6 w-12 rounded-md" />
        <Skeleton className="size-9 rounded-lg" />
      </CardFooter>
    </Card>
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
