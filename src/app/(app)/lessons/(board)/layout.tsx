import { Suspense } from "react";
import { FilterSidebar } from "@/components/layout/filter-sidebar";

export default function LessonsBoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <Suspense fallback={<div className="hidden lg:block lg:w-64 shrink-0" />}>
        {/* Note: FilterSidebar is hidden on mobile; LessonsMobileFilterToggle handles mobile. */}
        <FilterSidebar />
      </Suspense>
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
