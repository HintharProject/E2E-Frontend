"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { ProblemCardSkeleton } from "@/components/features/skeletons";
import { ColdStartNotice } from "@/components/layout/cold-start-notice";
import { useProblems } from "@/hooks/use-problems";
import { HorizontalFilterBar } from "@/components/layout/horizontal-filter-bar";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";
import { parseFilterList } from "@/lib/filter-params";
import type { ContentSortMode, TimeframeFilter } from "@/types";

function ProblemsFeed() {
  const searchParams = useSearchParams();

  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));
  const status = searchParams.get("status") || "";
  const currentSort = (searchParams.get("sort") as ContentSortMode) || "default";
  const currentTimeframe = (searchParams.get("timeframe") as TimeframeFilter) || "all";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useProblems({
    subject: subjects.length > 0 ? subjects[0] : "",
    level: levels.length > 0 ? levels[0] : "",
    status: status,
    sort: currentSort,
    timeframe: currentTimeframe,
  });

  const problems = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <TopmostScrollRefresh
      onRefresh={() => refetch()}
      isRefreshing={isRefetching}
      label="problems"
    >
      {isLoading ? (
        <div className="space-y-4">
          <ColdStartNotice delayMs={3000} />
          <ProblemCardSkeleton />
          <ProblemCardSkeleton />
          <ProblemCardSkeleton />
        </div>
      ) : isError ? (
        <EmptyState
          title="Failed to load problems"
          description="We ran into an issue retrieving the data. Please try again."
        />
      ) : problems.length === 0 ? (
        <EmptyState
          title="No problems found"
          description="Try adjusting your filters or be the first to post a problem."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-h-[44px] md:min-h-0"
              >
                {isFetchingNextPage ? "Loading more..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </TopmostScrollRefresh>
  );
}

export default function ProblemsPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<div className="h-12 rounded-xl bg-card border border-border animate-pulse" />}>
        <HorizontalFilterBar hideTags showProblemStatus showSort />
      </Suspense>
      <div className="min-w-0 flex-1">
        <Suspense
          fallback={
            <div className="space-y-4">
              <ProblemCardSkeleton />
              <ProblemCardSkeleton />
              <ProblemCardSkeleton />
            </div>
          }
        >
          <ProblemsFeed />
        </Suspense>
      </div>
    </div>
  );
}
