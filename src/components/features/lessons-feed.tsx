"use client";

import { useInfiniteLessons } from "@/hooks/use-lessons";
import { LessonCard } from "./content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export function LessonsFeed({
  subjects = [],
  levels = [],
  tagIds = [],
  authorId,
  state,
  onlyMine = false,
}: {
  subjects?: string[];
  levels?: string[];
  tagIds?: string[];
  authorId?: string;
  state?: string;
  onlyMine?: boolean;
}) {
  const { user, isLoading: userLoading } = useCurrentUser();

  const effectiveAuthorId = onlyMine ? user?.id : authorId;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteLessons({
      subject: subjects.join(","),
      level: levels.join(","),
      tags: tagIds.join(","),
      authorId: effectiveAuthorId,
      state,
    });

  const hasActiveFilters =
    subjects.length > 0 || levels.length > 0 || tagIds.length > 0 || !!state || onlyMine;

  if (status === "pending" || (onlyMine && userLoading)) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-card border border-line" />
        <div className="h-40 animate-pulse rounded-2xl bg-card border border-line" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Error loading lessons"
        description="Could not load the lessons feed. Please try again."
      />
    );
  }

  const lessons = data.pages.flatMap((page) => page.data);

  if (lessons.length === 0) {
    return (
      <EmptyState
        title={hasActiveFilters ? "No matching lessons" : "No published lessons"}
        description={
          hasActiveFilters
            ? "Try clearing filters or picking different Subject, Level, or Tag."
            : "Creators have not published lessons yet."
        }
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
      
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
