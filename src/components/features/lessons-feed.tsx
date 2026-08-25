"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { useInfiniteLessons } from "@/hooks/use-lessons";
import { LessonCard } from "./content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LessonCardSkeleton } from "./skeletons";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";

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
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const effectiveAuthorId = onlyMine ? user?.id : authorId;

  // Prefetch Draft and Archived if we are looking at My Lessons (Published)
  useEffect(() => {
    if (onlyMine && state === "PUBLISHED" && effectiveAuthorId) {
      const prefetchStates = async () => {
        const token = await getToken();
        if (!token) return;

        const statesToPrefetch = ["DRAFT", "ARCHIVED"];

        statesToPrefetch.forEach((prefetchState) => {
          queryClient.prefetchInfiniteQuery({
            queryKey: [
              "lessons",
              {
                subject: subjects.join(","),
                level: levels.join(","),
                tags: tagIds.join(","),
                authorId: effectiveAuthorId,
                state: prefetchState,
              },
            ],
            initialPageParam: 1,
            queryFn: ({ pageParam = 1 }) => {
              const queryStr = buildQueryString({
                subject_id: subjects.join(","),
                level_id: levels.join(","),
                tags: tagIds.join(","),
                author_id: effectiveAuthorId,
                state: prefetchState,
                page: pageParam,
              });
              return apiFetch(`/lessons/${queryStr}`, token);
            },
          });
        });
      };
      prefetchStates();
    }
  }, [
    onlyMine,
    state,
    effectiveAuthorId,
    subjects,
    levels,
    tagIds,
    queryClient,
    getToken,
  ]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch, isRefetching } =
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
        <LessonCardSkeleton />
        <LessonCardSkeleton />
        <LessonCardSkeleton />
        <LessonCardSkeleton />
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
    <TopmostScrollRefresh
      onRefresh={() => refetch()}
      isRefreshing={isRefetching}
      label="lessons"
    >
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
    </TopmostScrollRefresh>
  );
}
