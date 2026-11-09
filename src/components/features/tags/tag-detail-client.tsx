"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Share2,
  FileText,
  HelpCircle,
  BookOpen,
  Tag as TagIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PostCard, LessonCard } from "@/components/features/content-cards";
import { ProblemCard } from "@/components/features/problems/problem-card";
import { useTagContent } from "@/hooks/use-tag-content";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Post, Problem, Lesson } from "@/types";

/**
 * RECYCLED COMPONENT PATTERN:
 * Source: src/app/(app)/saved-sessions/[id]/page.tsx
 * Recycled features:
 * 1. Category Tab state machine ("all" | "post" | "problem" | "lesson")
 * 2. Visual Tab bar with item count indicators and active brand styling
 * 3. Unified content card wrapper with contextual content-type badge header
 * 4. EmptyState fallback layout
 * 5. Breadcrumb and clipboard share actions
 */

// Recycled from SavedSessionDetailPage: Category filter tabs
type CategoryTab = "all" | "post" | "problem" | "lesson";

interface TagDetailClientProps {
  tagName: string;
}

export function TagDetailClient({ tagName }: TagDetailClientProps) {
  const cleanTag = (tagName || "").replace(/^#/, "").trim().toLowerCase();
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");

  const {
    tagMeta,
    posts,
    problems,
    lessons,
    isLoading,
    isError,
  } = useTagContent(cleanTag);

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    toast.success("Copied tag link!");
  };

  // Recycled item normalization and chronological sort from SavedSessionDetailPage
  const allItems = useMemo(() => {
    const combined: Array<{
      id: string;
      type: "post" | "problem" | "lesson";
      created_at: string;
      post?: Post;
      problem?: Problem;
      lesson?: Lesson;
    }> = [
      ...posts.map((p) => ({ id: p.id, type: "post" as const, created_at: p.created_at, post: p })),
      ...problems.map((pr) => ({ id: pr.id, type: "problem" as const, created_at: pr.created_at, problem: pr })),
      ...lessons.map((l) => ({ id: l.id, type: "lesson" as const, created_at: l.created_at, lesson: l })),
    ];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, problems, lessons]);

  const totalCount = allItems.length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-ink">Failed to load tag contents</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Could not retrieve items tagged with #{cleanTag}. Please try again later.
        </p>
        <Button variant="outline" className="mt-6" nativeButton={false} render={<Link href="/forum" />}>
          Back to Discussions
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/forum"
          className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to explore
        </Link>
      </div>

      {/* Recycled Header Container from saved-sessions/[id]/page.tsx */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <TagIcon className="h-5 w-5" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink truncate">
                #{cleanTag}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>Topic Tag</span>
              <span>·</span>
              <span>{totalCount} {totalCount === 1 ? "item" : "items"} total</span>
              <span>·</span>
              <span className="text-brand font-medium">
                {posts.length} discussions · {problems.length} problems · {lessons.length} lessons
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs"
              title="Copy link to this tag"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Recycled Category Tabs Bar from saved-sessions/[id]/page.tsx */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
            activeTab === "all"
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
          )}
        >
          All ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("post")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
            activeTab === "post"
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
          )}
        >
          <FileText className="h-3 w-3" />
          Discussions ({posts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("problem")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
            activeTab === "problem"
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
          )}
        >
          <HelpCircle className="h-3 w-3" />
          Problems ({problems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lesson")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
            activeTab === "lesson"
              ? "bg-brand text-white shadow-xs"
              : "bg-muted/50 text-ink-muted hover:bg-muted hover:text-ink"
          )}
        >
          <BookOpen className="h-3 w-3" />
          Lessons ({lessons.length})
        </button>
      </div>

      {/* Recycled Content Viewport & Card Shell from saved-sessions/[id]/page.tsx */}
      {totalCount === 0 ? (
        <EmptyState
          title={`No contents found for #${cleanTag}`}
          description="Be the first to tag a discussion post, problem, or lesson with this topic."
        />
      ) : activeTab === "all" ? (
        <div className="space-y-4">
          {allItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="group relative rounded-2xl border border-line bg-card p-1 shadow-sm transition hover:border-brand/40"
            >
              {/* Recycled contextual badge headers from saved-sessions/[id]/page.tsx */}
              {item.post && (
                <div className="p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-brand bg-brand/5 border-brand/20">
                      Discussion Post
                    </Badge>
                    <span className="text-[11px] text-ink-muted">
                      Posted {formatDate(item.post.created_at)}
                    </span>
                  </div>
                  <PostCard post={item.post} />
                </div>
              )}

              {item.problem && (
                <div className="p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800">
                      Problem
                    </Badge>
                    <span className="text-[11px] text-ink-muted">
                      Asked {formatDate(item.problem.created_at)}
                    </span>
                  </div>
                  <ProblemCard problem={item.problem} />
                </div>
              )}

              {item.lesson && (
                <div className="p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                      Lesson
                    </Badge>
                    <span className="text-[11px] text-ink-muted">
                      Published {formatDate(item.lesson.created_at)}
                    </span>
                  </div>
                  <LessonCard lesson={item.lesson} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : activeTab === "post" ? (
        posts.length === 0 ? (
          <EmptyState title="No discussions in this category" description="Switch tabs or explore other topics." />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : activeTab === "problem" ? (
        problems.length === 0 ? (
          <EmptyState title="No problems in this category" description="Switch tabs or explore other topics." />
        ) : (
          <div className="space-y-4">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        )
      ) : activeTab === "lesson" ? (
        lessons.length === 0 ? (
          <EmptyState title="No lessons in this category" description="Switch tabs or explore other topics." />
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

