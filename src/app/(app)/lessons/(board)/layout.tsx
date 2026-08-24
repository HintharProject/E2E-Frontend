import { Suspense } from "react";
import { LessonsTabs } from "@/components/features/lessons/lessons-tabs";
import { LessonsHeader } from "@/components/features/lessons/lessons-header";
import { FilterSidebar } from "@/components/layout/filter-sidebar";

export default function LessonsBoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <LessonsHeader />
      <LessonsTabs />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          {/* Note: In manage view, we need showStateFilter=true. We can pass it via search parameters or a client component if needed. For now, FilterSidebar can determine it based on pathname inside itself if we refactor it, or we can just always render it and let it hide the state filter if not on manage page. Let's update FilterSidebar to check the pathname for showStateFilter automatically. */}
          <FilterSidebar />
        </Suspense>
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
