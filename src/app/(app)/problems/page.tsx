"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-3 sm:px-6">
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
        <div className="min-w-0 flex-1 lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:custom-scrollbar lg:pr-2">
          <Suspense fallback={<div className="h-40 rounded-2xl bg-card border border-line animate-pulse"></div>}>
            <ProblemsFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
