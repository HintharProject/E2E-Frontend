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
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-36 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-36 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">Failed to load tag contents</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not retrieve items tagged with #{cleanTag}. Please try again later.
        </p>
        <Button variant="outline" className="mt-6" nativeButton={false} render={<Link href="/forum" />}>
          Back to Discussions
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/forum"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to explore
        </Link>
      </div>

      {/* Tag Hub Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TagIcon className="h-5 w-5" />
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground truncate">
                #{cleanTag}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Topic Tag</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{totalCount} {totalCount === 1 ? "item" : "items"} total</span>
              <span>·</span>
              <span className="text-primary font-medium font-mono tabular-nums">
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

      {/* Category Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All (<span className="font-mono tabular-nums">{totalCount}</span>)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("post")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
            activeTab === "post"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileText className="h-3 w-3" />
          Discussions (<span className="font-mono tabular-nums">{posts.length}</span>)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("problem")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
            activeTab === "problem"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <HelpCircle className="h-3 w-3" />
          Problems (<span className="font-mono tabular-nums">{problems.length}</span>)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lesson")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer",
            activeTab === "lesson"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <BookOpen className="h-3 w-3" />
          Lessons (<span className="font-mono tabular-nums">{lessons.length}</span>)
        </button>
      </div>

      {/* Content Viewport (flat container, no nested cards) */}
      {totalCount === 0 ? (
        <EmptyState
          title={`No contents found for #${cleanTag}`}
          description="Be the first to tag a discussion post, problem, or lesson with this topic."
        />
      ) : activeTab === "all" ? (
        <div className="space-y-6">
          {allItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className="space-y-2.5">
              {item.post && (
                <>
                  <div className="flex items-center gap-2 px-0.5">
                    <Badge variant="outline" className="text-xs font-medium text-primary bg-primary/10 border-primary/30">
                      Discussion Post
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Posted {formatDate(item.post.created_at)}
                    </span>
                  </div>
                  <PostCard post={item.post} />
                </>
              )}

              {item.problem && (
                <>
                  <div className="flex items-center gap-2 px-0.5">
                    <Badge variant="outline" className="text-xs font-medium text-chart-3 bg-chart-3/10 border-chart-3/30">
                      Problem
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Asked {formatDate(item.problem.created_at)}
                    </span>
                  </div>
                  <ProblemCard problem={item.problem} />
                </>
              )}

              {item.lesson && (
                <>
                  <div className="flex items-center gap-2 px-0.5">
                    <Badge variant="outline" className="text-xs font-medium text-warning bg-warning/10 border-warning/30">
                      Lesson
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Published {formatDate(item.lesson.created_at)}
                    </span>
                  </div>
                  <LessonCard lesson={item.lesson} />
                </>
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

