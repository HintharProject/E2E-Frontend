import { Suspense } from "react";
import { LessonCard } from "@/components/features/content-cards";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { parseFilterList } from "@/lib/filter-params";
import { lessons, type Lesson } from "@/lib/mock-data";
import Link from "next/link";

function filterLessons(
  all: Lesson[],
  filters: {
    subjects: string[];
    levels: string[];
    tagIds: string[];
  }
): Lesson[] {
  return all.filter((l) => {
    if (l.state !== "PUBLISHED") return false;
    if (
      filters.subjects.length > 0 &&
      !filters.subjects.includes(l.subjectId)
    ) {
      return false;
    }
    if (filters.levels.length > 0 && !filters.levels.includes(l.levelId)) {
      return false;
    }
    if (
      filters.tagIds.length > 0 &&
      !filters.tagIds.some((id) => l.tagIds.includes(id))
    ) {
      return false;
    }
    return true;
  });
}

export default async function LessonsBoardPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const tagIds = parseFilterList(searchParams?.tags);

  const filtered = filterLessons(lessons, { subjects, levels, tagIds });
  const followed = filtered.filter((l) => l.followedAuthor);
  const other = filtered.filter((l) => !l.followedAuthor);
  const hasActiveFilters =
    subjects.length > 0 || levels.length > 0 || tagIds.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Lessons"
        description="Followed creators first, then the rest of the board. Filter by subject, level, and tags."
        actions={
          <Button nativeButton={false} render={<Link href="/lessons/new" />}>New lesson</Button>
        }
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar />
        </Suspense>
        <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              title={
                hasActiveFilters ? "No matching lessons" : "No published lessons"
              }
              description={
                hasActiveFilters
                  ? "Try clearing filters or picking different Subject, Level, or Tag."
                  : "Creators have not published lessons yet."
              }
            />
          ) : (
            <>
              <h2 className="mb-3 font-display text-xl text-ink">
                From creators you follow
              </h2>
              {followed.length === 0 ? (
                <p className="mb-10 text-sm text-ink-muted">
                  No followed-creator lessons match these filters.
                </p>
              ) : (
                <div className="mb-10 grid gap-4 md:grid-cols-2">
                  {followed.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              )}

              <h2 className="mb-3 font-display text-xl text-ink">More lessons</h2>
              {other.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No other lessons match these filters.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {other.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
