import { Suspense } from "react";
import { LessonsTabs } from "@/components/features/lessons/lessons-tabs";
import { LessonsHeader } from "@/components/features/lessons/lessons-header";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { LessonsMobileFilterToggle } from "@/components/features/lessons/lessons-mobile-filter";

export default function LessonsBoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-3 sm:px-6">
      <LessonsHeader />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          {/* Note: FilterSidebar is hidden on mobile; LessonsMobileFilterToggle handles mobile. */}
          <FilterSidebar />
        </Suspense>
        <div className="min-w-0 flex-1 lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:custom-scrollbar lg:pr-2">
          {children}
        </div>
      </div>
    </div>
  );
}
