"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { useInfiniteLessons } from "@/hooks/use-lessons";
import { useLevels, useSubjects, useTags } from "@/hooks/use-metadata";
import { LessonCard } from "./content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LessonCardSkeleton } from "./skeletons";
import { ColdStartNotice } from "@/components/layout/cold-start-notice";
import { TopmostScrollRefresh } from "@/components/ui/topmost-scroll-refresh";
import { ContentSortToggle } from "@/components/ui/content-sort-toggle";
import { parseFilterList } from "@/lib/filter-params";
import { cn } from "@/lib/utils";
import type { ContentSortMode, Lesson, TimeframeFilter } from "@/types";

interface SubjectShelfGroup {
  id: string;
  name: string;
  code?: string;
  lessons: Lesson[];
}

const MANAGE_STATES: { value: "PUBLISHED" | "DRAFT" | "ARCHIVED"; label: string }[] = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
];

export function LessonsFeed({
  subjects = [],
  levels = [],
  tagIds = [],
  authorId,
  state,
  onlyMine = false,
  hideSort = false,
}: {
  subjects?: string[];
  levels?: string[];
  tagIds?: string[];
  authorId?: string;
  state?: string;
  onlyMine?: boolean;
  hideSort?: boolean;
}) {
  const { user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const { data: allLevels = [], isLoading: levelsLoading } = useLevels();
  const { data: allSubjects = [] } = useSubjects();
  const { data: allTags = [] } = useTags();

  const urlSubjects = parseFilterList(searchParams.get("subject"));
  const urlLevels = parseFilterList(searchParams.get("level"));
  const urlTags = parseFilterList(searchParams.get("tags"));

  const effectiveSubjects = urlSubjects.length > 0 ? urlSubjects : subjects;
  const effectiveLevels = urlLevels.length > 0 ? urlLevels : levels;
  const effectiveTags = urlTags.length > 0 ? urlTags : tagIds;
  const effectiveState = onlyMine ? searchParams.get("state") || state || "PUBLISHED" : state;
  const effectiveAuthorId = onlyMine ? user?.id : authorId;

  const currentSort = (searchParams.get("sort") as ContentSortMode) || "default";
  const currentTimeframe = (searchParams.get("timeframe") as TimeframeFilter) || "all";

  const isShelfMode =
    effectiveSubjects.length === 0 && effectiveTags.length === 0 && !onlyMine;

  const sortedLevels = useMemo(
    () =>
      [...allLevels].sort(
        (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name)
      ),
    [allLevels]
  );

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

  const handleLevelSelect = (levelId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!levelId || (effectiveLevels.length === 1 && effectiveLevels[0] === levelId)) {
      params.delete("level");
    } else {
      params.set("level", levelId);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleViewSubject = (subjectId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subject", subjectId);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleBackToShelves = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("subject");
    params.delete("tags");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleManageStateSelect = (nextState: "PUBLISHED" | "DRAFT" | "ARCHIVED") => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextState === "PUBLISHED") {
      params.delete("state");
    } else {
      params.set("state", nextState);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  // Prefetch Draft and Archived if we are looking at My Lessons (Published)
  useEffect(() => {
    if (onlyMine && effectiveState === "PUBLISHED" && effectiveAuthorId) {
      const prefetchStates = async () => {
        const token = await getToken();
        if (!token) return;

        const statesToPrefetch = ["DRAFT", "ARCHIVED"];

        statesToPrefetch.forEach((prefetchState) => {
          queryClient.prefetchInfiniteQuery({
            queryKey: [
              "lessons",
              {
                subject: effectiveSubjects.join(","),
                level: effectiveLevels.join(","),
                tags: effectiveTags.join(","),
                authorId: effectiveAuthorId,
                state: prefetchState,
              },
            ],
            initialPageParam: 1,
            queryFn: ({ pageParam = 1 }) => {
              const queryStr = buildQueryString({
                subject_id: effectiveSubjects.join(","),
                level_id: effectiveLevels.join(","),
                tags: effectiveTags.join(","),
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
    effectiveState,
    effectiveAuthorId,
    effectiveSubjects,
    effectiveLevels,
    effectiveTags,
    queryClient,
    getToken,
  ]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch, isRefetching } =
    useInfiniteLessons({
      subject: effectiveSubjects.join(","),
      level: effectiveLevels.join(","),
      tags: effectiveTags.join(","),
      authorId: effectiveAuthorId,
      state: effectiveState,
      sort: currentSort,
      timeframe: currentTimeframe,
    });

  const lessons = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  // Group lessons by subject for Mode A (Categorized Subject Shelves)
  const subjectShelves = useMemo<SubjectShelfGroup[]>(() => {
    if (!isShelfMode || lessons.length === 0) return [];

    const subjectLookup = new Map(allSubjects.map((s) => [s.id, s]));
    const groups = new Map<string, SubjectShelfGroup>();

    for (const lesson of lessons) {
      const subId = lesson.subject_details?.id || lesson.subject || "__general__";
      const matchedSubject =
        lesson.subject_details || (subId !== "__general__" ? subjectLookup.get(subId) : undefined);

      const existing = groups.get(subId);
      if (existing) {
        existing.lessons.push(lesson);
      } else {
        groups.set(subId, {
          id: subId,
          name: matchedSubject?.name || "General Courseware",
          code: matchedSubject?.code,
          lessons: [lesson],
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.id === "__general__") return 1;
      if (b.id === "__general__") return -1;
      return a.name.localeCompare(b.name);
    });
  }, [isShelfMode, lessons, allSubjects]);

  // Active drill-down heading label for Mode B
  const drillDownContext = useMemo(() => {
    const activeSubjects = effectiveSubjects
      .map((id) => allSubjects.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const activeTags = effectiveTags
      .map((id) => allTags.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t));

    if (activeSubjects.length === 1) {
      const s = activeSubjects[0];
      return {
        title: s.name,
        code: s.code,
        subtitle: activeTags.length > 0 ? `Filtered by ${activeTags.map((t) => `#${t.name}`).join(", ")}` : null,
      };
    }
    if (activeSubjects.length > 1) {
      return {
        title: activeSubjects.map((s) => s.name).join(" · "),
        code: undefined,
        subtitle: activeTags.length > 0 ? `Filtered by ${activeTags.map((t) => `#${t.name}`).join(", ")}` : null,
      };
    }
    if (activeTags.length > 0) {
      return {
        title: activeTags.map((t) => `#${t.name}`).join(" "),
        code: undefined,
        subtitle: "Tag-filtered lessons",
      };
    }
    return {
      title: "Filtered Lessons",
      code: undefined,
      subtitle: null,
    };
  }, [effectiveSubjects, effectiveTags, allSubjects, allTags]);

  const hasActiveFilters =
    effectiveSubjects.length > 0 ||
    effectiveLevels.length > 0 ||
    effectiveTags.length > 0 ||
    Boolean(effectiveState) ||
    onlyMine;

  const renderLevelPillSwitcher = () => {
    if (onlyMine) return null;

    return (
      <div
        role="group"
        aria-label="Filter lessons by academic level"
        className="mb-6 flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={() => handleLevelSelect(null)}
          aria-pressed={effectiveLevels.length === 0}
          className={cn(
            "inline-flex min-h-[44px] sm:min-h-[34px] items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            effectiveLevels.length === 0
              ? "border-primary bg-primary text-primary-foreground shadow-2xs"
              : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground"
          )}
        >
          All Levels
        </button>

        {levelsLoading ? (
          <>
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </>
        ) : (
          sortedLevels.map((lvl) => {
            const isSelected =
              effectiveLevels.length === 1 && effectiveLevels[0] === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleLevelSelect(lvl.id)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex min-h-[44px] sm:min-h-[34px] items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                    : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground"
                )}
              >
                {lvl.name}
              </button>
            );
          })
        )}
      </div>
    );
  };

  const renderManageStateSwitcher = () => {
    if (!onlyMine) return null;

    return (
      <div
        role="group"
        aria-label="Filter your lessons by status"
        className="mb-6 flex flex-wrap items-center gap-2"
      >
        {MANAGE_STATES.map((opt) => {
          const isSelected = (effectiveState || "PUBLISHED").toUpperCase() === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleManageStateSelect(opt.value)}
              aria-pressed={isSelected}
              className={cn(
                "inline-flex min-h-[44px] sm:min-h-[34px] items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                  : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  };

  if (status === "pending" || (onlyMine && userLoading)) {
    return (
      <div className="space-y-6">
        <ColdStartNotice delayMs={3000} />
        {renderLevelPillSwitcher()}
        {renderManageStateSwitcher()}
        <div className="space-y-8" aria-hidden="true">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <LessonCardSkeleton />
              <LessonCardSkeleton />
              <LessonCardSkeleton />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <LessonCardSkeleton />
              <LessonCardSkeleton />
              <LessonCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-5">
        {renderLevelPillSwitcher()}
        {renderManageStateSwitcher()}
        <EmptyState
          title="Error loading lessons"
          description="Could not load the lessons catalog. Please try again."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="space-y-5">
        {renderLevelPillSwitcher()}
        {renderManageStateSwitcher()}
        <EmptyState
          icon={BookOpen}
          title={hasActiveFilters ? "No matching lessons" : "No published lessons"}
          description={
            onlyMine
              ? `You don't have any ${(effectiveState || "PUBLISHED").toLowerCase()} lessons matching these filters.`
              : hasActiveFilters
                ? "Try clearing filters or switching back to all subject shelves."
                : "Creators have not published lessons yet."
          }
          action={
            !onlyMine && (effectiveSubjects.length > 0 || effectiveTags.length > 0) ? (
              <Button variant="secondary" onClick={handleBackToShelves} className="gap-1.5">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to All Subject Shelves
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <TopmostScrollRefresh
      onRefresh={() => refetch()}
      isRefreshing={isRefetching}
      label="lessons"
    >
      {!hideSort && (
        <div className="mb-4 flex items-center justify-between pb-1">
          <ContentSortToggle
            sort={currentSort}
            timeframe={currentTimeframe}
            onSortChange={handleSortChange}
            onTimeframeChange={handleTimeframeChange}
          />
        </div>
      )}

      {isShelfMode ? (
        /* ================================================================= */
        /* MODE A: Categorized Subject Shelves                               */
        /* ================================================================= */
        <div>
          {renderLevelPillSwitcher()}

          <div className="space-y-10">
            {subjectShelves.map((shelf) => {
              const previewLessons = shelf.lessons.slice(0, 3);
              const totalLoaded = shelf.lessons.length;
              const hasMoreInShelf = totalLoaded > 3 || hasNextPage;

              return (
                <section
                  key={shelf.id}
                  aria-labelledby={`shelf-heading-${shelf.id}`}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-2.5">
                    <div className="flex flex-wrap items-baseline gap-2.5 min-w-0">
                      <h2
                        id={`shelf-heading-${shelf.id}`}
                        className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
                      >
                        {shelf.name}
                      </h2>
                      {shelf.code && (
                        <span className="font-mono text-xs font-medium text-muted-foreground">
                          ({shelf.code})
                        </span>
                      )}
                      <Badge variant="outline" className="font-mono text-xs tabular-nums">
                        {totalLoaded}
                        {hasNextPage ? "+" : ""} {totalLoaded === 1 ? "lesson" : "lessons"}
                      </Badge>
                    </div>

                    {shelf.id !== "__general__" && (
                      <button
                        type="button"
                        onClick={() => handleViewSubject(shelf.id)}
                        className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span>View all in {shelf.name}</span>
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {previewLessons.map((lesson) => (
                      <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-h-[44px] md:min-h-0"
              >
                {isFetchingNextPage ? "Loading more shelves..." : "Load more lessons & shelves"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ================================================================= */
        /* MODE B: Subject / Tag / Manage Drill-Down                         */
        /* ================================================================= */
        <div>
          {renderManageStateSwitcher()}

          {!onlyMine && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-2xs">
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                    {drillDownContext.title}
                  </h2>
                  {drillDownContext.code && (
                    <span className="font-mono text-xs text-muted-foreground">
                      ({drillDownContext.code})
                    </span>
                  )}
                  <Badge variant="outline" className="font-mono text-xs tabular-nums">
                    {lessons.length}
                    {hasNextPage ? "+" : ""} {lessons.length === 1 ? "lesson" : "lessons"}
                  </Badge>
                </div>
                {drillDownContext.subtitle && (
                  <p className="text-xs text-muted-foreground">{drillDownContext.subtitle}</p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBackToShelves}
                className="gap-1.5 shrink-0 min-h-[44px] sm:min-h-[34px]"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <span>Back to All Subject Shelves</span>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
