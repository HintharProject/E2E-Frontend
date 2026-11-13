import { LessonCardSkeleton } from "@/components/features/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LessonsBoardLoading() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex gap-4 border-b border-border pb-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LessonCardSkeleton />
          <LessonCardSkeleton />
          <LessonCardSkeleton />
        </div>
      </div>
    </div>
  );
}
