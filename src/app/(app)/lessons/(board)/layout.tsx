import { Suspense } from "react";
import { HorizontalFilterBar } from "@/components/layout/horizontal-filter-bar";
import { LessonsTabs } from "@/components/features/lessons/lessons-tabs";

export default function LessonsBoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <LessonsTabs />
      <Suspense fallback={<div className="h-12 rounded-xl bg-card border border-border animate-pulse" />}>
        <HorizontalFilterBar showSort />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
