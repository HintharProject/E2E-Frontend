"use client";

import React, { useState, useMemo } from "react";
import { Problem, Solution } from "@/types";
import { useSolutions } from "@/hooks/use-problems";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SolutionItem } from "./solution-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Layers, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SolutionPoolContainerProps {
  problem: Problem;
  isAuthor: boolean;
}

export function SolutionPoolContainer({ problem, isAuthor }: SolutionPoolContainerProps) {
  const { user } = useCurrentUser();
  const [showArchived, setShowArchived] = useState(false);

  // Active pool solutions (up to 7)
  const {
    data: activeData,
    isLoading: isActiveLoading,
    fetchNextPage: fetchNextActive,
    hasNextPage: hasNextActive,
    isFetchingNextPage: isFetchingNextActive,
  } = useSolutions(problem.id, true);

  // Archived attempts (demoted by Tier 2+ submissions)
  const {
    data: archivedData,
    isLoading: isArchivedLoading,
  } = useSolutions(problem.id, false);

  const activeSolutions = useMemo(() => {
    return activeData?.pages.flatMap((p) => p.data) ?? [];
  }, [activeData]);

  const archivedSolutions = useMemo(() => {
    return archivedData?.pages.flatMap((p) => p.data) ?? [];
  }, [archivedData]);

  // Find accepted solution if any (displayed as hero banner)
  const acceptedSolution = useMemo(() => {
    return activeSolutions.find((s) => s.is_accepted);
  }, [activeSolutions]);

  const competingSolutions = useMemo(() => {
    if (!acceptedSolution) return activeSolutions;
    return activeSolutions.filter((s) => s.id !== acceptedSolution.id);
  }, [activeSolutions, acceptedSolution]);

  const activeCount = activeSolutions.length;

  // Determine if current user can trigger Tier 2+ eviction when pool is at 7/7
  const contributorTier = user?.contributor_tier ?? 0;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const canEvict = contributorTier >= 2 || isAdmin;

  // Check if active pool is locked (all 7 have positive score or are endorsed)
  const isPoolLocked = useMemo(() => {
    if (activeCount < 7) return false;
    return !activeSolutions.some(
      (s) => !s.is_author_endorsed && !s.is_accepted && (s.vote_score ?? 0) <= 0
    );
  }, [activeCount, activeSolutions]);

  const isClosed = problem.status === "CLOSED";
  const isFinal = problem.status === "FINAL";

  return (
    <div className="space-y-8">
      {/* Pool Header & Visual Capacity Meter */}
      <div className="space-y-3 pb-4 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="size-5 text-primary" />
            <h2 className="font-heading text-2xl font-semibold text-foreground tracking-tight">
              Solutions &amp; Peer Consensus
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={activeCount >= 7 ? "default" : "outline"}
              className={`text-xs px-2.5 py-1 ${
                activeCount >= 7 ? "bg-amber-600 hover:bg-amber-600 text-white" : "border-border text-muted-foreground"
              }`}
            >
              Active Pool: {activeCount} / 7
            </Badge>
          </div>
        </div>

        {/* 7-Slot Visual Capacity Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Capacity Pool: {activeCount} / 7 slots filled
            </span>
            <span className="text-muted-foreground">
              {7 - activeCount > 0 ? `${7 - activeCount} slots remaining` : "Pool at maximum capacity"}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 h-2 w-full">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-full rounded-sm transition-all duration-300",
                  i < activeCount
                    ? activeCount >= 7
                      ? "bg-amber-500"
                      : "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>

          {activeCount >= 7 && (
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-lg mt-2">
              <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-0.5">
                <span className="font-semibold">Tier 2+ Eviction Engine Active:</span>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  The solution pool is currently full. Submissions by Tier 2+ contributors will automatically evict the lowest unendorsed attempt with score ≤ 0 to make room.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {isActiveLoading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
          <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      ) : activeSolutions.length === 0 && archivedSolutions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No solutions posted yet. Be the first to provide step-by-step working!
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Accepted Solution Hero Container */}
          {acceptedSolution && (
            <div>
              <SolutionItem
                solution={acceptedSolution}
                problem={problem}
                isProblemAuthor={isAuthor}
                isAcceptedHero
              />
            </div>
          )}

          {/* 2. Competing Active Solutions */}
          {competingSolutions.length > 0 && (
            <div className="space-y-4">
              {acceptedSolution && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
                  Active Solution Pool ({competingSolutions.length})
                </h3>
              )}

              {competingSolutions.map((sol) => (
                <SolutionItem
                  key={sol.id}
                  solution={sol}
                  problem={problem}
                  isProblemAuthor={isAuthor}
                />
              ))}

              {hasNextActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextActive()}
                  disabled={isFetchingNextActive}
                  className="w-full min-h-[44px] md:min-h-0 text-xs"
                >
                  {isFetchingNextActive ? "Loading more..." : "Load more solutions"}
                </Button>
              )}
            </div>
          )}

          {/* 3. Collapsible Archived Attempts Accordion */}
          {archivedSolutions.length > 0 && (
            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showArchived ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                <span>
                  Archived Attempts ({archivedSolutions.length})
                </span>
                <span className="text-[10px] lowercase font-normal text-muted-foreground opacity-80">
                  (demoted to clear pool capacity)
                </span>
              </button>

              {showArchived && (
                <div className="mt-4 space-y-3">
                  {archivedSolutions.map((sol) => (
                    <SolutionItem
                      key={sol.id}
                      solution={sol}
                      problem={problem}
                      isProblemAuthor={isAuthor}
                      isArchivedAttempt
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
