"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageSquare,
  Lightbulb,
  BookOpen,
  FileText,
  CheckCircle2,
  ThumbsUp,
  X,
  ArrowRight,
  CornerDownLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUnifiedSearch } from "@/hooks/use-unified-search";
import { useUIStore } from "@/lib/store/ui-store";
import {
  SearchCategoryFilter,
  SearchPostItem,
  SearchProblemItem,
  SearchLessonItem,
  SearchResourceItem,
} from "@/types";
import { cn } from "@/lib/utils";

type NavigableItem =
  | { type: "post"; item: SearchPostItem; href: string }
  | { type: "problem"; item: SearchProblemItem; href: string }
  | { type: "lesson"; item: SearchLessonItem; href: string }
  | { type: "resource"; item: SearchResourceItem; href: string }
  | { type: "see_all"; query: string; href: string };

const SUGGESTIONS = [
  "Mechanics",
  "Newton's 2nd Law",
  "Kinematics",
  "Calculus",
  "Organic Chemistry",
  "Past Papers",
];

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, closeCommandPalette, toggleCommandPalette } = useUIStore();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  // Focus input when opened & reset search
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  // Unified search hook
  const { data, isLoading, isFetching } = useUnifiedSearch({
    query,
    limit: 4,
    type: activeCategory,
    enabled: isCommandPaletteOpen,
  });

  const posts = data?.results.posts || [];
  const problems = data?.results.problems || [];
  const lessons = data?.results.lessons || [];
  const resources = data?.results.resources || [];

  // Build flattened list of navigable items for keyboard navigation
  const flatItems: NavigableItem[] = useMemo(() => {
    const items: NavigableItem[] = [];

    if (activeCategory === "all" || activeCategory === "posts") {
      posts.forEach((p) => items.push({ type: "post", item: p, href: `/posts/${p.id}` }));
    }
    if (activeCategory === "all" || activeCategory === "problems") {
      problems.forEach((p) => items.push({ type: "problem", item: p, href: `/problems/${p.id}` }));
    }
    if (activeCategory === "all" || activeCategory === "lessons") {
      lessons.forEach((l) => items.push({ type: "lesson", item: l, href: `/lessons/${l.id}` }));
    }
    if (activeCategory === "all" || activeCategory === "resources") {
      resources.forEach((r) => items.push({ type: "resource", item: r, href: `/train/${r.id}` }));
    }

    if (query.trim().length >= 2) {
      items.push({
        type: "see_all",
        query: query.trim(),
        href: `/search?q=${encodeURIComponent(query.trim())}${
          activeCategory !== "all" ? `&type=${activeCategory}` : ""
        }`,
      });
    }

    return items;
  }, [posts, problems, lessons, resources, query, activeCategory]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  // Auto-scroll selected element into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleSelect = (item: NavigableItem) => {
    closeCommandPalette();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex]);
      } else if (query.trim().length >= 2) {
        closeCommandPalette();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeCommandPalette();
    }
  };

  const totalResults =
    (posts.length || 0) + (problems.length || 0) + (lessons.length || 0) + (resources.length || 0);

  return (
    <Dialog open={isCommandPaletteOpen} onOpenChange={(open) => !open && closeCommandPalette()}>
      <DialogContent
        className="w-full max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border border-line bg-card shadow-2xl rounded-2xl"
        showCloseButton={false}
      >
        <div className="sr-only">
          <DialogTitle>Unified Command Palette</DialogTitle>
          <DialogDescription>Quickly search posts, problems, lessons, and exam papers</DialogDescription>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center border-b border-line px-4 py-3 bg-surface/50">
          <Search className="size-5 text-ink-muted shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search discussions, problems, lessons, past papers..."
            className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink-muted outline-none"
          />

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {(isLoading || isFetching) && (
              <Loader2 className="size-4 animate-spin text-primary" />
            )}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="rounded-md p-1 text-ink-muted hover:text-ink hover:bg-muted transition-colors cursor-pointer"
                title="Clear query"
              >
                <X className="size-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted bg-muted border border-line rounded">
              ESC
            </kbd>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-line/60 bg-surface/30 overflow-x-auto text-xs">
          {(
            [
              { id: "all", label: "All" },
              { id: "posts", label: "Discussions" },
              { id: "problems", label: "Problems" },
              { id: "lessons", label: "Lessons" },
              { id: "resources", label: "Exam Papers" },
            ] as const
          ).map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 font-semibold transition-colors cursor-pointer shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-ink-muted hover:bg-muted hover:text-ink"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results Container */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto max-h-[50vh] p-2 space-y-4 divide-y divide-line/40 focus:outline-none"
        >
          {/* State: Query too short */}
          {query.trim().length < 2 && (
            <div className="py-6 px-4 text-center">
              <div className="mx-auto size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Sparkles className="size-5" />
              </div>
              <h4 className="text-sm font-semibold text-ink">Global Unified Search</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                Type at least 2 characters to search across forum posts, community problems, lessons, and past papers.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-medium text-ink-muted">Suggested:</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      setSelectedIndex(0);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-line bg-surface hover:bg-muted text-ink transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* State: No Results */}
          {query.trim().length >= 2 && !isLoading && totalResults === 0 && (
            <div className="py-8 px-4 text-center">
              <p className="text-sm font-semibold text-ink">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-ink-muted mt-1">
                Try searching for different keywords, syllabus codes (e.g. 9702), or explore the full catalog.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCommandPalette();
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Go to Advanced Search Page <ArrowRight className="size-3.5" />
              </button>
            </div>
          )}

          {/* Section: Discussions */}
          {(activeCategory === "all" || activeCategory === "posts") && posts.length > 0 && (
            <div className="pt-2 first:pt-0">
              <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="size-3.5" /> Discussions ({posts.length})
                </span>
                <span className="text-[10px] font-normal text-ink-muted">Posts</span>
              </div>
              <div className="space-y-1 mt-1">
                {posts.map((post) => {
                  const itemIndex = flatItems.findIndex(
                    (f) => f.type === "post" && (f.item as SearchPostItem).id === post.id
                  );
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={post.id}
                      data-index={itemIndex}
                      onClick={() => handleSelect({ type: "post", item: post, href: `/posts/${post.id}` })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors text-left",
                        isSelected
                          ? "bg-primary/10 text-primary dark:bg-primary/20"
                          : "hover:bg-muted/60 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar className="size-6 shrink-0 border border-line">
                          {post.author?.image_url && <AvatarImage src={post.author.image_url} />}
                          <AvatarFallback className="text-[10px]">
                            {post.author?.display_name?.slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{post.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-0.5">
                            <span>{post.author?.display_name || "Anonymous"}</span>
                            {post.subject && (
                              <span className="truncate max-w-[120px]">
                                • {post.subject.name}
                              </span>
                            )}
                            {post.level && <span>• {post.level.name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px] text-ink-muted">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="size-3" /> {post.vote_score}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3" /> {post.comments_count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Problems */}
          {(activeCategory === "all" || activeCategory === "problems") && problems.length > 0 && (
            <div className="pt-2 first:pt-0">
              <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="size-3.5" /> Problems ({problems.length})
                </span>
                <span className="text-[10px] font-normal text-ink-muted">Solve!</span>
              </div>
              <div className="space-y-1 mt-1">
                {problems.map((problem) => {
                  const itemIndex = flatItems.findIndex(
                    (f) => f.type === "problem" && (f.item as SearchProblemItem).id === problem.id
                  );
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={problem.id}
                      data-index={itemIndex}
                      onClick={() =>
                        handleSelect({ type: "problem", item: problem, href: `/problems/${problem.id}` })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors text-left",
                        isSelected
                          ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 dark:bg-violet-500/20"
                          : "hover:bg-muted/60 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="size-6 rounded-md bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                          <Lightbulb className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium truncate">{problem.title}</p>
                            {problem.is_verified && (
                              <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0"
                              >
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-0.5">
                            {problem.subject && <span>{problem.subject.name}</span>}
                            {problem.level && <span>• {problem.level.name}</span>}
                            <span>• {problem.solutions_count} solutions</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-ink-muted">
                        <ThumbsUp className="size-3" /> {problem.vote_score}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Lessons */}
          {(activeCategory === "all" || activeCategory === "lessons") && lessons.length > 0 && (
            <div className="pt-2 first:pt-0">
              <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="size-3.5" /> Lessons ({lessons.length})
                </span>
                <span className="text-[10px] font-normal text-ink-muted">Study Guides</span>
              </div>
              <div className="space-y-1 mt-1">
                {lessons.map((lesson) => {
                  const itemIndex = flatItems.findIndex(
                    (f) => f.type === "lesson" && (f.item as SearchLessonItem).id === lesson.id
                  );
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={lesson.id}
                      data-index={itemIndex}
                      onClick={() =>
                        handleSelect({ type: "lesson", item: lesson, href: `/lessons/${lesson.id}` })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors text-left",
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/20"
                          : "hover:bg-muted/60 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <BookOpen className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-0.5">
                            <span>By {lesson.author?.display_name || "Educator"}</span>
                            {lesson.subject && <span>• {lesson.subject.name}</span>}
                            {lesson.level && <span>• {lesson.level.name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-ink-muted">
                        <ThumbsUp className="size-3" /> {lesson.vote_score}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Exam Papers */}
          {(activeCategory === "all" || activeCategory === "resources") && resources.length > 0 && (
            <div className="pt-2 first:pt-0">
              <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="size-3.5" /> Exam Papers ({resources.length})
                </span>
                <span className="text-[10px] font-normal text-ink-muted">Train! Archive</span>
              </div>
              <div className="space-y-1 mt-1">
                {resources.map((resource) => {
                  const itemIndex = flatItems.findIndex(
                    (f) => f.type === "resource" && (f.item as SearchResourceItem).id === resource.id
                  );
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={resource.id}
                      data-index={itemIndex}
                      onClick={() =>
                        handleSelect({ type: "resource", item: resource, href: `/train/${resource.id}` })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors text-left",
                        isSelected
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 dark:bg-amber-500/20"
                          : "hover:bg-muted/60 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="size-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <FileText className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{resource.file_name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-0.5">
                            {resource.year && <span>{resource.year}</span>}
                            {resource.session && <span>• {resource.session}</span>}
                            {resource.paper_type && <span>• {resource.paper_type}</span>}
                            {resource.paper_code && <span>• Component {resource.paper_code}</span>}
                            {resource.subject && <span>• {resource.subject.name}</span>}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 shrink-0"
                      >
                        {resource.paper_type || "Paper"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* See All in /search Option */}
          {query.trim().length >= 2 && (
            <div className="pt-2">
              {(() => {
                const seeAllIndex = flatItems.findIndex((f) => f.type === "see_all");
                const isSelected = selectedIndex === seeAllIndex;

                return (
                  <div
                    data-index={seeAllIndex}
                    onClick={() =>
                      handleSelect({
                        type: "see_all",
                        query: query.trim(),
                        href: `/search?q=${encodeURIComponent(query.trim())}${
                          activeCategory !== "all" ? `&type=${activeCategory}` : ""
                        }`,
                      })
                    }
                    onMouseEnter={() => setSelectedIndex(seeAllIndex)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-surface hover:bg-muted text-primary"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Search className="size-3.5" /> See all results for &ldquo;{query}&rdquo; in
                      Advanced Search
                    </span>
                    <ArrowRight className="size-4 shrink-0" />
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer Bar with Keyboard Shortcuts */}
        <div className="flex items-center justify-between border-t border-line px-4 py-2 bg-surface/80 text-[11px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-line text-[10px] font-mono">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-line text-[10px] font-mono">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-line text-[10px] font-mono flex items-center">
                <CornerDownLeft className="size-2.5" />
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-line text-[10px] font-mono">
                ESC
              </kbd>
              Dismiss
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              closeCommandPalette();
              router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
            }}
            className="hover:text-ink transition-colors cursor-pointer font-medium"
          >
            Explore all in /search →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
