"use client";

import React, { useState, useEffect, useTransition, use } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  MessageSquare,
  Lightbulb,
  BookOpen,
  FileText,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { useUnifiedSearch } from "@/hooks/use-unified-search";
import { useSubjects, useLevels } from "@/hooks/use-metadata";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SearchCategoryFilter,
  SearchPostItem,
  SearchProblemItem,
  SearchLessonItem,
  SearchResourceItem,
} from "@/types";
import { cn } from "@/lib/utils";

const POPULAR_TOPICS = [
  "Newton's 2nd Law",
  "Calculus",
  "Kinematics",
  "Organic Chemistry",
  "Equilibrium",
  "9702 Past Papers",
];

export default function SearchPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = use(props.searchParams);
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const initialQ = (resolvedParams?.q as string) || "";
  const initialType = (resolvedParams?.type as SearchCategoryFilter) || "all";
  const initialSubject = (resolvedParams?.subject as string) || "";
  const initialLevel = (resolvedParams?.level as string) || "";
  const initialSort = (resolvedParams?.sort as "relevance" | "popular" | "newest") || "relevance";

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState<SearchCategoryFilter>(initialType);
  const [subject, setSubject] = useState(initialSubject);
  const [level, setLevel] = useState(initialLevel);
  const [sort, setSort] = useState<"relevance" | "popular" | "newest">(initialSort);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();

  // Unified Search API
  const { data, isLoading, isFetching } = useUnifiedSearch({
    query,
    limit: category === "all" ? 6 : 24,
    type: category,
    subject: subject || undefined,
    level: level || undefined,
    sort,
    debounceMs: 300,
  });

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "all") params.set("type", category);
    if (subject) params.set("subject", subject);
    if (level) params.set("level", level);
    if (sort !== "relevance") params.set("sort", sort);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      window.history.replaceState(null, "", newUrl);
    });
  }, [query, category, subject, level, sort, pathname]);

  const posts = data?.results.posts || [];
  const problems = data?.results.problems || [];
  const lessons = data?.results.lessons || [];
  const resources = data?.results.resources || [];
  const counts = data?.counts || { posts: 0, problems: 0, lessons: 0, resources: 0, total: 0 };

  const hasActiveFacets = Boolean(subject || level || sort !== "relevance");

  const clearFacets = () => {
    setSubject("");
    setLevel("");
    setSort("relevance");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header Banner */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
          <Sparkles className="size-4" /> Global Discovery Portal
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-ink sm:text-4xl tracking-tight">
          Unified Search
        </h1>
        <p className="text-sm text-ink-muted max-w-2xl">
          Search across forum discussions, community past-paper problems in Solve!, structured lessons, and Cambridge/Edexcel past papers in Train!.
        </p>
      </div>

      {/* Prominent Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative mb-6">
        <div className="relative flex items-center shadow-sm rounded-2xl border border-line bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="absolute left-4 size-5 text-ink-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, topics, or syllabi (e.g. Calculus, 9702, Mechanics)..."
            className="w-full h-13 pl-12 pr-28 rounded-2xl bg-transparent text-sm font-medium text-ink placeholder:text-ink-muted outline-none"
          />

          <div className="absolute right-3 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-muted transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              className="rounded-xl px-4 text-xs font-semibold"
            >
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* Category Pills & Mobile Filter Button */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Content", count: counts.total },
            { id: "posts", label: "Discussions", count: counts.posts },
            { id: "problems", label: "Problems", count: counts.problems },
            { id: "lessons", label: "Lessons", count: counts.lessons },
            { id: "resources", label: "Exam Papers", count: counts.resources },
          ].map((tab) => {
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id as SearchCategoryFilter)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-line text-ink-muted hover:text-ink hover:bg-muted"
                )}
              >
                <span>{tab.label}</span>
                {query.trim().length >= 2 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-ink-muted"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Filter Toggle */}
        <button
          type="button"
          onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-card text-xs font-semibold text-ink"
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Filters</span>
          {hasActiveFacets && <span className="size-2 rounded-full bg-primary" />}
        </button>
      </div>

      {/* Main Grid: Filters Sidebar + Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <div
          className={cn(
            "space-y-5 rounded-2xl border border-line bg-card p-4 shadow-2xs md:block",
            showFiltersMobile ? "block" : "hidden md:block"
          )}
        >
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <span className="flex items-center gap-2 text-xs font-bold font-heading text-ink uppercase tracking-wider">
              <Filter className="size-3.5 text-primary" /> Filter Results
            </span>
            {hasActiveFacets && (
              <button
                type="button"
                onClick={clearFacets}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer font-medium"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Academic Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Levels</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Sort Order</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "relevance" | "popular" | "newest")}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="relevance">Best Match (Relevance)</option>
              <option value="popular">Most Popular (Votes)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Quick Help Tip */}
          <div className="rounded-xl bg-muted/60 p-3 text-[11px] text-ink-muted leading-relaxed">
            <p className="font-semibold text-ink mb-1">Search Tip:</p>
            You can search by subject code (e.g. <span className="font-mono text-ink">9702</span> for Physics) or paper component (e.g. <span className="font-mono text-ink">42</span>).
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Real-time Summary Header */}
          {query.trim().length >= 2 && (
            <div className="flex items-center justify-between text-xs text-ink-muted pb-1">
              <span>
                Found <strong className="text-ink font-semibold">{counts.total}</strong> results for &ldquo;{query}&rdquo;
                {isFetching && <span className="ml-2 animate-pulse text-primary font-medium">Updating...</span>}
              </span>
            </div>
          )}

          {/* State: Prompt to search (query < 2 chars) */}
          {query.trim().length < 2 && (
            <div className="rounded-2xl border border-line bg-card p-8 sm:p-12 text-center space-y-6">
              <div className="mx-auto size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="size-7" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-bold font-heading text-ink">
                  Explore Academic Content
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Start typing in the search bar above to look up questions, community problems, lessons, and exam past papers across all curriculums.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Popular Topics
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                  {POPULAR_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setQuery(topic)}
                      className="px-3 py-1.5 rounded-full border border-line bg-surface hover:bg-muted text-xs font-medium text-ink transition-colors cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-line/60 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                <Link
                  href="/forum"
                  className="p-3 rounded-xl border border-line bg-surface hover:border-primary/40 text-center transition-colors"
                >
                  <MessageSquare className="size-4 text-blue-500 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-ink block">Forum</span>
                  <span className="text-[10px] text-ink-muted">Q&A Feed</span>
                </Link>
                <Link
                  href="/problems"
                  className="p-3 rounded-xl border border-line bg-surface hover:border-primary/40 text-center transition-colors"
                >
                  <Lightbulb className="size-4 text-violet-500 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-ink block">Solve!</span>
                  <span className="text-[10px] text-ink-muted">Practice</span>
                </Link>
                <Link
                  href="/lessons"
                  className="p-3 rounded-xl border border-line bg-surface hover:border-primary/40 text-center transition-colors"
                >
                  <BookOpen className="size-4 text-emerald-500 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-ink block">Lessons</span>
                  <span className="text-[10px] text-ink-muted">Guides</span>
                </Link>
                <Link
                  href="/train"
                  className="p-3 rounded-xl border border-line bg-surface hover:border-primary/40 text-center transition-colors"
                >
                  <FileText className="size-4 text-amber-500 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-ink block">Train!</span>
                  <span className="text-[10px] text-ink-muted">Past Papers</span>
                </Link>
              </div>
            </div>
          )}

          {/* State: No Results */}
          {query.trim().length >= 2 && !isLoading && counts.total === 0 && (
            <div className="rounded-2xl border border-line bg-card p-12 text-center space-y-4">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-ink-muted">
                <Search className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold font-heading text-ink">
                  No matching results found
                </h3>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  We couldn&apos;t find anything matching &ldquo;{query}&rdquo;
                  {hasActiveFacets ? " with the current active filters." : "."}
                </p>
              </div>
              {hasActiveFacets && (
                <Button variant="outline" size="sm" onClick={clearFacets} className="rounded-xl text-xs">
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Results: Grouped 'All' View or Single Pillar View */}
          {query.trim().length >= 2 && (
            <div className="space-y-8">
              {/* Pillar 1: Discussions (Posts) */}
              {(category === "all" || category === "posts") && posts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold font-heading text-blue-600 dark:text-blue-400">
                      <MessageSquare className="size-4" /> Discussions ({counts.posts})
                    </h2>
                    {category === "all" && counts.posts > posts.length && (
                      <button
                        type="button"
                        onClick={() => setCategory("posts")}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        View all discussions →
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-card hover:border-primary/50 hover:shadow-xs transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] h-4.5 px-1.5 font-semibold",
                                post.post_type === "QUESTION"
                                  ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                                  : "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                              )}
                            >
                              {post.post_type}
                            </Badge>
                            {post.subject && (
                              <span className="text-[11px] font-medium text-ink-muted">
                                {post.subject.name}
                              </span>
                            )}
                            {post.level && (
                              <span className="text-[11px] text-ink-muted">
                                • {post.level.name}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <Avatar className="size-4 border border-line">
                              {post.author?.image_url && <AvatarImage src={post.author.image_url} />}
                              <AvatarFallback className="text-[8px]">
                                {post.author?.display_name?.slice(0, 2).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{post.author?.display_name || "Community Member"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-ink-muted pt-2 sm:pt-0 border-t sm:border-t-0 border-line/50">
                          <span className="flex items-center gap-1 font-medium">
                            <ThumbsUp className="size-3.5" /> {post.vote_score}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <MessageSquare className="size-3.5" /> {post.comments_count}
                          </span>
                          <ArrowRight className="size-4 text-ink-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden sm:block" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Pillar 2: Problems */}
              {(category === "all" || category === "problems") && problems.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold font-heading text-violet-600 dark:text-violet-400">
                      <Lightbulb className="size-4" /> Problems ({counts.problems})
                    </h2>
                    {category === "all" && counts.problems > problems.length && (
                      <button
                        type="button"
                        onClick={() => setCategory("problems")}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        View all problems →
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {problems.map((prob) => (
                      <Link
                        key={prob.id}
                        href={`/problems/${prob.id}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-card hover:border-violet-500/50 hover:shadow-xs transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4.5 px-1.5 font-semibold border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5"
                            >
                              Solve!
                            </Badge>
                            {prob.is_verified && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4.5 px-1.5 font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 flex items-center gap-1"
                              >
                                <CheckCircle2 className="size-3" /> Solved
                              </Badge>
                            )}
                            {prob.subject && (
                              <span className="text-[11px] font-medium text-ink-muted">
                                {prob.subject.name}
                              </span>
                            )}
                            {prob.level && (
                              <span className="text-[11px] text-ink-muted">
                                • {prob.level.name}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-ink group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                            {prob.title}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <span>Author: {prob.author?.display_name || "Community Member"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-ink-muted pt-2 sm:pt-0 border-t sm:border-t-0 border-line/50">
                          <span className="flex items-center gap-1 font-medium">
                            <ThumbsUp className="size-3.5" /> {prob.vote_score}
                          </span>
                          <span className="font-medium text-ink">
                            {prob.solutions_count} solutions
                          </span>
                          <ArrowRight className="size-4 text-ink-muted group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Pillar 3: Lessons */}
              {(category === "all" || category === "lessons") && lessons.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold font-heading text-emerald-600 dark:text-emerald-400">
                      <BookOpen className="size-4" /> Lessons ({counts.lessons})
                    </h2>
                    {category === "all" && counts.lessons > lessons.length && (
                      <button
                        type="button"
                        onClick={() => setCategory("lessons")}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        View all lessons →
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-card hover:border-emerald-500/50 hover:shadow-xs transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4.5 px-1.5 font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                            >
                              Study Guide
                            </Badge>
                            {lesson.subject && (
                              <span className="text-[11px] font-medium text-ink-muted">
                                {lesson.subject.name}
                              </span>
                            )}
                            {lesson.level && (
                              <span className="text-[11px] text-ink-muted">
                                • {lesson.level.name}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {lesson.title}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <span>By {lesson.author?.display_name || "Educator"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-ink-muted pt-2 sm:pt-0 border-t sm:border-t-0 border-line/50">
                          <span className="flex items-center gap-1 font-medium">
                            <ThumbsUp className="size-3.5" /> {lesson.vote_score}
                          </span>
                          <ArrowRight className="size-4 text-ink-muted group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Pillar 4: Exam Papers */}
              {(category === "all" || category === "resources") && resources.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold font-heading text-amber-600 dark:text-amber-400">
                      <FileText className="size-4" /> Exam Papers & Mark Schemes ({counts.resources})
                    </h2>
                    {category === "all" && counts.resources > resources.length && (
                      <button
                        type="button"
                        onClick={() => setCategory("resources")}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        View all exam papers →
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {resources.map((res) => (
                      <Link
                        key={res.id}
                        href={`/train/${res.id}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-line bg-card hover:border-amber-500/50 hover:shadow-xs transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4.5 px-1.5 font-semibold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                            >
                              {res.paper_type === "QP"
                                ? "Question Paper"
                                : res.paper_type === "MS"
                                ? "Mark Scheme"
                                : res.paper_type || "Exam Paper"}
                            </Badge>
                            {res.year && (
                              <span className="text-[11px] font-semibold text-ink">
                                {res.year}
                              </span>
                            )}
                            {res.session && (
                              <span className="text-[11px] text-ink-muted">
                                • {res.session}
                              </span>
                            )}
                            {res.paper_code && (
                              <span className="text-[11px] text-ink-muted">
                                • Variant {res.paper_code}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-ink group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 font-mono text-xs">
                            {res.file_name}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            {res.subject && <span>{res.subject.name}</span>}
                            {res.level && <span>• {res.level.name}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-ink-muted pt-2 sm:pt-0 border-t sm:border-t-0 border-line/50">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:underline">
                            Open in Train!
                          </span>
                          <ArrowRight className="size-4 text-ink-muted group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
