import { LessonCardSkeleton } from "@/components/features/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LessonsBoardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="mb-6 flex gap-4 border-b border-line pb-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:w-64 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="min-w-0 flex-1 grid gap-4 md:grid-cols-2">
          <LessonCardSkeleton />
          <LessonCardSkeleton />
          <LessonCardSkeleton />
          <LessonCardSkeleton />
        </div>
      </div>
    </div>
  );
}
