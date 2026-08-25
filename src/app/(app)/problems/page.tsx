"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Virtuoso } from "react-virtuoso";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { useProblems } from "@/hooks/use-problems";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { MobileFilterToggle } from "@/components/layout/mobile-filter-toggle";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";
import { parseFilterList } from "@/lib/filter-params";

function ProblemsFeed() {
  const searchParams = useSearchParams();
  const subjects = parseFilterList(searchParams.get("subject"));
  const levels = parseFilterList(searchParams.get("level"));
  const status = searchParams.get("status") || "";

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
    subject: subjects.length > 0 ? subjects[0] : "", // useProblems hook might need updating if it supports multiple, assuming single for now
    level: levels.length > 0 ? levels[0] : "",
    status: status,
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
        <Virtuoso
          useWindowScroll
          data={problems}
          endReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          components={{
            Footer: () => (
              isFetchingNextPage ? (
                <div className="py-4 text-center text-sm text-ink-muted">Loading more...</div>
              ) : null
            )
          }}
          itemContent={(index, problem) => (
            <div className="pb-4">
              <ProblemCard problem={problem} />
            </div>
          )}
        />
      )}
    </TopmostScrollRefresh>
  );
}

export default function ProblemsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Mobile-only sticky filter bar */}
      <div className="relative">
        <div className="sticky top-[57px] z-30 -mx-4 mb-6 flex items-center justify-end gap-2 border-b border-line bg-background/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
          <Suspense fallback={null}>
            <MobileFilterToggle hideTags showProblemStatus />
          </Suspense>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar hideTags showProblemStatus />
        </Suspense>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>}>
            <ProblemsFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
