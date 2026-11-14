import { LessonCardSkeleton } from "@/components/features/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageLessonsLoading() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LessonCardSkeleton />
        <LessonCardSkeleton />
        <LessonCardSkeleton />
        <LessonCardSkeleton />
        <LessonCardSkeleton />
        <LessonCardSkeleton />
      </div>
    </div>
  );
}
