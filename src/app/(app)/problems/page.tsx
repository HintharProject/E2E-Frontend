"use client";

import { Suspense, useTransition } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { useProblems } from "@/hooks/use-problems";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { MobileFilterToggle } from "@/components/layout/mobile-filter-toggle";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";
import { ContentSortToggle } from "@/components/ui/content-sort-toggle";
import { parseFilterList } from "@/lib/filter-params";
import type { ContentSortMode, TimeframeFilter } from "@/types";

function ProblemsFeed() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));
  const status = searchParams.get("status") || "";
  const currentSort = (searchParams.get("sort") as ContentSortMode) || "default";
  const currentTimeframe = (searchParams.get("timeframe") as TimeframeFilter) || "all";

  const handleSortChange = (newSort: ContentSortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "default") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      window.history.replaceState(null, "", newUrl);
    });
  };

  const handleTimeframeChange = (newTf: TimeframeFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTf === "all") {
      params.delete("timeframe");
    } else {
      params.set("timeframe", newTf);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      window.history.replaceState(null, "", newUrl);
    });
  };

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
      <div className="mb-4 flex items-center justify-between pb-1">
        <ContentSortToggle
          sort={currentSort}
          timeframe={currentTimeframe}
          onSortChange={handleSortChange}
          onTimeframeChange={handleTimeframeChange}
        />
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>
          <div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>
          <div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>
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
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading more..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </TopmostScrollRefresh>
  );
}

export default function ProblemsPage() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <Suspense fallback={<div className="hidden lg:block lg:w-64 shrink-0" />}>
        <FilterSidebar hideTags showProblemStatus />
      </Suspense>
      <div className="min-w-0 flex-1">
        <Suspense fallback={<div className="h-40 rounded-2xl bg-card border border-border animate-pulse" />}>
          <ProblemsFeed />
        </Suspense>
      </div>
    </div>
  );
}
