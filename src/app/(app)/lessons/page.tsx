import { Suspense } from "react";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { parseFilterList } from "@/lib/filter-params";
import { LessonsFeed } from "@/components/features/lessons-feed";
import { LessonsTabs } from "@/components/features/lessons/lessons-tabs";
import Link from "next/link";

export default async function LessonsBoardPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const tagIds = parseFilterList(searchParams?.tags);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Lessons"
        description="Explore published lessons. Filter by subject, level, and tags."
      />
      <LessonsTabs />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar />
        </Suspense>
        <div className="min-w-0 flex-1">
          <LessonsFeed 
            subjects={subjects} 
            levels={levels} 
            tagIds={tagIds} 
          />
        </div>
      </div>
    </div>
  );
}
