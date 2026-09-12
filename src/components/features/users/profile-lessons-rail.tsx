"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useInfiniteLessons } from "@/hooks/use-lessons";
import { LessonCardSkeleton } from "@/components/features/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { Lesson } from "@/types";

const PREVIEW_COUNT = 4;

function LessonTile({ lesson }: { lesson: Lesson }) {
  return (
    <article className="rounded-2xl border border-line bg-card p-4 transition hover:border-brand/35">
      <Link href={`/lessons/${lesson.id}`} className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{lesson.subject_details?.name ?? "Lesson"}</Badge>
          <span className="text-[11px] text-ink-muted">{formatDate(lesson.created_at)}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 font-heading text-base font-semibold text-ink">
          {lesson.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-ink-muted">
          {lesson.body.replace(/<[^>]*>?/gm, "")}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {lesson.level_details ? (
            <Badge variant="secondary">{lesson.level_details.name}</Badge>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export function ProfileLessonsRail({ userId }: { userId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteLessons({ authorId: userId, state: "PUBLISHED" });

  if (status === "pending") {
    return (
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-ink">Lessons</h2>
        <div className="mt-4 flex gap-4 overflow-hidden">
          <LessonCardSkeleton />
          <LessonCardSkeleton />
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-ink">Lessons</h2>
        <EmptyState
          title="Could not load lessons"
          description="Try refreshing the profile in a moment."
        />
      </section>
    );
  }

  const lessons = data.pages.flatMap((page) => page.data);
  const visible = expanded ? lessons : lessons.slice(0, PREVIEW_COUNT);
  const canSeeMore = lessons.length > PREVIEW_COUNT || hasNextPage;

  const handleToggle = async () => {
    if (!expanded) {
      setExpanded(true);
      // Load remaining pages so the grid can fill out
      let more = hasNextPage;
      while (more) {
        const result = await fetchNextPage();
        more = Boolean(result.hasNextPage);
      }
      return;
    }
    setExpanded(false);
  };

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-ink">Lessons</h2>
          <p className="text-sm text-ink-muted">
            {lessons.length === 0
              ? "No published lessons yet"
              : `${lessons.length} published lesson${lessons.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {canSeeMore && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 cursor-pointer"
            onClick={handleToggle}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage
              ? "Loading..."
              : expanded
                ? "Show less"
                : "See more..."}
            {expanded ? (
              <ChevronUp className="ml-1 size-4" />
            ) : (
              <ChevronDown className="ml-1 size-4" />
            )}
          </Button>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No lessons published"
            description="Published lessons from this creator will appear in a horizontal row here."
          />
        </div>
      ) : (
        <div
          className={cn(
            "mt-4 gap-4",
            expanded
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              : "flex overflow-x-auto pb-2 custom-scrollbar"
          )}
        >
          {visible.map((lesson) =>
            expanded ? (
              <LessonTile key={lesson.id} lesson={lesson} />
            ) : (
              <div key={lesson.id} className="w-[18rem] shrink-0">
                <LessonTile lesson={lesson} />
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
