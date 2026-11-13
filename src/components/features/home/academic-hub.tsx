"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Clock,
  FolderKanban,
  Lightbulb,
  Megaphone,
  PenLine,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ColdStartNotice } from "@/components/layout/cold-start-notice";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { LessonCard } from "@/components/features/content-cards";
import { LessonCardSkeleton } from "@/components/features/skeletons";
import { stripHtml } from "@/components/ui/base-card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProblems } from "@/hooks/use-problems";
import { useInfiniteLessons } from "@/hooks/use-lessons";
import { useStudyPlans, useSavedSessions } from "@/hooks/use-collections";
import { useAnnouncements } from "@/hooks/use-announcements";
import { TIER_CONFIG, type ContributorTier } from "@/types/contribution";
import { isWriteLocked } from "@/types/user";
import { cn, formatDate } from "@/lib/utils";

interface LastTrainPaper {
  id: string;
  title?: string;
  subject?: string;
  level?: string;
}

function SevenSlotMeter({ count }: { count: number }) {
  const safeCount = Math.max(0, Math.min(7, count));
  const isFull = safeCount >= 7;

  return (
    <div
      className="flex items-center gap-2 shrink-0"
      title={`${safeCount} of 7 active solution slots filled`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, idx) => (
          <span
            key={idx}
            className={cn(
              "h-2 w-2 rounded-[2px] transition-colors",
              idx < safeCount
                ? isFull
                  ? "bg-warning"
                  : "bg-primary"
                : "bg-muted border border-border/80"
            )}
          />
        ))}
      </div>
      <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
        {safeCount}/7
      </span>
    </div>
  );
}

function LibrarySlotMeter({
  label,
  count,
  max = 3,
  href,
  icon: Icon,
}: {
  label: string;
  count: number;
  max?: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const filled = Math.max(0, Math.min(max, count));

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {label}
          </div>
          <div className="mt-1 flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: max }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors",
                  i < filled ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground group-hover:text-foreground">
        {count} / {max}
      </span>
    </Link>
  );
}

export function AcademicHub() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [lastTrainPaper, setLastTrainPaper] = useState<LastTrainPaper | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("e2e_last_train_paper");
      if (!raw) return;
      if (raw.startsWith("{")) {
        const parsed = JSON.parse(raw) as LastTrainPaper;
        if (parsed?.id) setLastTrainPaper(parsed);
      } else {
        setLastTrainPaper({ id: raw });
      }
    } catch {
      // Ignore malformed localStorage value
    }
  }, []);

  const {
    data: problemsData,
    isLoading: problemsLoading,
    isError: problemsError,
    refetch: refetchProblems,
  } = useProblems({ status: "OPEN", sort: "default" });

  const {
    data: lessonsData,
    isLoading: lessonsLoading,
    isError: lessonsError,
    refetch: refetchLessons,
  } = useInfiniteLessons({ sort: "newest" });

  const { data: studyPlansData, isLoading: plansLoading } = useStudyPlans();
  const { data: savedSessionsData, isLoading: sessionsLoading } = useSavedSessions();
  const {
    data: announcements = [],
    isLoading: announcementsLoading,
  } = useAnnouncements({ active_only: true });

  const openProblems = useMemo(
    () => (problemsData?.pages?.[0]?.data ?? []).slice(0, 3),
    [problemsData]
  );

  const freshLessons = useMemo(
    () => (lessonsData?.pages?.[0]?.data ?? []).slice(0, 4),
    [lessonsData]
  );

  const studyPlansCount = Array.isArray(studyPlansData)
    ? studyPlansData.length
    : (studyPlansData?.data?.length ?? 0);

  const savedSessionsCount = Array.isArray(savedSessionsData)
    ? savedSessionsData.length
    : (savedSessionsData?.data?.length ?? 0);

  const latestAnnouncements = announcements.slice(0, 2);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  const rawTier = user?.contributor_tier ?? user?.reputation?.contributor_tier ?? 0;
  const safeTier = (rawTier >= 0 && rawTier <= 4 ? rawTier : 0) as ContributorTier;
  const tierConfig = TIER_CONFIG[safeTier];
  const points = user?.contribution_points ?? user?.reputation?.contribution_points ?? 0;
  const voteWeight = user?.dynamic_vote_weight ?? user?.reputation?.dynamic_vote_weight ?? tierConfig.voteMultiplier;
  const writeLocked = user ? isWriteLocked(user.ban_state) : false;

  const showColdStart = userLoading || problemsLoading || lessonsLoading;

  return (
    <div className="w-full space-y-8">
      {showColdStart && <ColdStartNotice delayMs={3000} />}

      {/* Top Editorial Welcome & Status Strip */}
      <section
        aria-label="Academic overview and quick actions"
        className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            {userLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-72 max-w-full" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-balance">
                  {user?.display_name ? `Welcome back, ${user.display_name}` : "Welcome back"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {todayFormatted} · Pick up a past paper, tackle an open bounty, or continue a lesson.
                </p>
              </>
            )}

            {/* Inline Contributor Standing Pill */}
            {userLoading ? (
              <Skeleton className="h-8 w-80 max-w-full rounded-full" />
            ) : user ? (
              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">
                  <ContributorBadge tier={safeTier} points={points} size="sm" />
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {points.toLocaleString()} pts
                  </span>
                  <span className="text-muted-foreground" aria-hidden="true">·</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {voteWeight}× vote weight
                  </span>
                </div>
                <Link
                  href={`/users/${user.id}`}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>View Dossier</span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </div>

          {/* 3 Compact Quick Launch Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:w-auto shrink-0">
            <Link
              href={writeLocked ? "#" : "/problems/new"}
              aria-disabled={writeLocked || undefined}
              onClick={(e) => {
                if (writeLocked) e.preventDefault();
              }}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3.5 py-3 min-h-[52px] transition-colors",
                writeLocked
                  ? "opacity-55 cursor-not-allowed"
                  : "hover:border-primary/45 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lightbulb className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Ask a Problem
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {writeLocked ? "Read-only mode" : "Solve! Bounty"}
                </span>
              </span>
            </Link>

            <Link
              href="/resources"
              className="group flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3.5 py-3 min-h-[52px] transition-colors hover:border-primary/45 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Practice Papers
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  Exams &amp; Train!
                </span>
              </span>
            </Link>

            <Link
              href={writeLocked ? "#" : "/lessons/new"}
              aria-disabled={writeLocked || undefined}
              onClick={(e) => {
                if (writeLocked) e.preventDefault();
              }}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3.5 py-3 min-h-[52px] transition-colors",
                writeLocked
                  ? "opacity-55 cursor-not-allowed"
                  : "hover:border-primary/45 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PenLine className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Write a Lesson
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {writeLocked ? "Read-only mode" : "Courseware"}
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Primary Bento Row (2-Column lg:grid-cols-3 split) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left / Main Column: Open Solve! Bounties + Fresh Lessons */}
        <div className="space-y-8 lg:col-span-2 min-w-0">
          {/* Open Solve! Bounties Preview */}
          <section aria-labelledby="hub-open-problems-heading" className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2
                  id="hub-open-problems-heading"
                  className="font-display text-xl font-semibold tracking-tight text-foreground"
                >
                  Open Solve! Bounties
                </h2>
                <Badge variant="outline" className="font-mono text-xs tabular-nums">
                  7-slot pool
                </Badge>
              </div>
              <Link
                href="/problems?status=OPEN"
                className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>View all in Solve!</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            {problemsLoading ? (
              <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="p-4 space-y-2.5" aria-hidden="true">
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-4/5" />
                  </div>
                ))}
              </div>
            ) : problemsError ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Could not load open Solve! problems.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchProblems()} className="gap-1.5">
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Retry
                </Button>
              </div>
            ) : openProblems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center space-y-3">
                <Lightbulb className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">No open bounties right now</p>
                  <p className="text-xs text-muted-foreground">
                    Post an exam question or photo problem to invite peer solutions.
                  </p>
                </div>
                {!writeLocked && (
                  <Button
                    size="sm"
                    variant="secondary"
                    nativeButton={false}
                    render={<Link href="/problems/new" />}
                  >
                    Ask a Problem
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card shadow-card divide-y divide-border/60 overflow-hidden">
                {openProblems.map((problem) => {
                  const slotCount = problem.solution_count ?? 0;
                  const levelName = problem.level_details?.name;
                  const subjectName = problem.subject_details?.name;
                  const syllabusLabel = [levelName, subjectName].filter(Boolean).join(" · ");

                  return (
                    <Link
                      key={problem.id}
                      href={`/problems/${problem.id}`}
                      className="group flex flex-col gap-2 p-4 transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0 text-xs text-muted-foreground">
                          {syllabusLabel && (
                            <span className="font-medium text-foreground/80 truncate">
                              {syllabusLabel}
                            </span>
                          )}
                          {problem.origin === "PAST_PAPER" && problem.question_number && (
                            <span className="font-mono text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                              {problem.question_number}
                            </span>
                          )}
                        </div>
                        <SevenSlotMeter count={slotCount} />
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-heading text-sm sm:text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {problem.title}
                        </h3>
                        <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-muted-foreground pt-0.5">
                          {(problem.vote_score ?? problem.vote_count ?? 0) >= 0 ? "+" : ""}
                          {problem.vote_score ?? problem.vote_count ?? 0}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Fresh Lessons Shelf */}
          <section aria-labelledby="hub-fresh-lessons-heading" className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-2.5">
              <h2
                id="hub-fresh-lessons-heading"
                className="font-display text-xl font-semibold tracking-tight text-foreground"
              >
                Fresh Lessons
              </h2>
              <Link
                href="/lessons"
                className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>Explore Lesson Shelves</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            {lessonsLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LessonCardSkeleton />
                <LessonCardSkeleton />
              </div>
            ) : lessonsError ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Could not load recent lessons.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchLessons()} className="gap-1.5">
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Retry
                </Button>
              </div>
            ) : freshLessons.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center space-y-3">
                <BookOpen className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">No published lessons yet</p>
                  <p className="text-xs text-muted-foreground">
                    Browse the catalog or share your first structured study guide.
                  </p>
                </div>
                {!writeLocked && (
                  <Button
                    size="sm"
                    variant="secondary"
                    nativeButton={false}
                    render={<Link href="/lessons/new" />}
                  >
                    Write a Lesson
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {freshLessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Rail: Resume Train!, My Library Snapshot & Official Announcements */}
        <aside aria-label="Study shortcuts and notices" className="space-y-5 lg:col-span-1">
          {/* 1. Resume Train! Practice Card */}
          <section
            aria-labelledby="hub-train-resume-heading"
            className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="hub-train-resume-heading"
                className="font-heading text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <Play className="size-4 text-primary" aria-hidden="true" />
                <span>{lastTrainPaper ? "Resume Train! Practice" : "Timed Exam Practice"}</span>
              </h2>
              {lastTrainPaper && (
                <Badge variant="default" className="text-xs">
                  Recent
                </Badge>
              )}
            </div>

            {lastTrainPaper ? (
              <>
                <div className="rounded-lg border border-border/80 bg-muted/35 p-3">
                  <p className="text-xs text-muted-foreground">Continue paper</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground line-clamp-2">
                    {lastTrainPaper.title || "Past Paper Split Session"}
                  </p>
                  {(lastTrainPaper.level || lastTrainPaper.subject) && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {[lastTrainPaper.level, lastTrainPaper.subject].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full justify-between font-semibold"
                    nativeButton={false}
                    render={<Link href={`/train/${lastTrainPaper.id}`} />}
                  >
                    <span>Resume Split Session</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Button>
                  <Link
                    href="/resources"
                    className="text-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    Browse all past papers →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Open any Question Paper alongside its Mark Scheme with a built-in exam countdown timer.
                </p>
                <Button
                  variant="secondary"
                  className="w-full justify-between font-semibold"
                  nativeButton={false}
                  render={<Link href="/resources" />}
                >
                  <span>Pick a Past Paper</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </>
            )}
          </section>

          {/* 2. My Library Snapshot */}
          <section
            aria-labelledby="hub-library-heading"
            className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="hub-library-heading"
                className="font-heading text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                <span>My Library</span>
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                3/3 slots
              </span>
            </div>

            {plansLoading || sessionsLoading ? (
              <div className="space-y-2" aria-hidden="true">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : (
              <div className="space-y-2">
                <LibrarySlotMeter
                  label="Study Plans"
                  count={studyPlansCount}
                  max={3}
                  href="/study-plans"
                  icon={Bookmark}
                />
                <LibrarySlotMeter
                  label="Saved Sessions"
                  count={savedSessionsCount}
                  max={3}
                  href="/saved-sessions"
                  icon={Clock}
                />
              </div>
            )}
          </section>

          {/* 3. Official Announcements */}
          <section
            aria-labelledby="hub-announcements-heading"
            className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="hub-announcements-heading"
                className="font-heading text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <Megaphone className="size-4 text-primary" aria-hidden="true" />
                <span>Official Announcements</span>
              </h2>
              <Link
                href="/forum/announcements"
                className="text-xs font-semibold text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                All →
              </Link>
            </div>

            {announcementsLoading ? (
              <div className="space-y-2.5" aria-hidden="true">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : latestAnnouncements.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No active institutional notices right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-lg border border-border/70 bg-background/50">
                {latestAnnouncements.map((item) => (
                  <Link
                    key={item.id}
                    href={`/forum/announcements#${item.id}`}
                    className="group block p-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {stripHtml(item.body)}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/forum/announcements"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <span>All announcements</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </section>

          {writeLocked && (
            <div
              role="status"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-2.5"
            >
              <ShieldAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Your account is currently in read-only mode ({user?.ban_state}). You can continue studying lessons and past papers.
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
