"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Columns2,
  ExternalLink,
  FileText,
  Lightbulb,
  Lock,
  LogIn,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  UserPlus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathRenderer } from "@/components/ui/math-renderer";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import { apiFetch } from "@/services/api-client";
import { stripHtml } from "@/components/ui/base-card";
import { cn } from "@/lib/utils";
import type { Problem, Resource, Subject } from "@/types";

export interface LandingPageProps {
  initialProblems: Problem[];
  initialPapers: Resource[];
  initialSubjects: Subject[];
}

type TourTabKey = "train" | "solve" | "courseware";

const TOUR_TABS: { key: TourTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "train", label: "Train! QP + MS", icon: Columns2 },
  { key: "solve", label: "Solve! Consensus Pool", icon: Lightbulb },
  { key: "courseware", label: "Lessons & Forum", icon: BookOpen },
];

const PUBLIC_BOUNDARY_ROWS = [
  {
    area: "Resources & Train!",
    href: "/resources",
    ctaLabel: "Open Papers",
    publicAccess:
      "Browse past papers & textbooks, preview or download PDFs, and practice in split-pane Train! with synchronized QP + MS and built-in timer.",
    memberAccess:
      "Saving papers to Saved Sessions / Study Plans, checking Solve! solution matches, and posting paper walkthroughs.",
    gatedAction: "save past papers or ask Solve! questions",
  },
  {
    area: "Solve!",
    href: "/problems",
    ctaLabel: "Browse Problems",
    publicAccess:
      "Read every problem prompt, syllabus tag, math notation, and cited past-paper reference across the archive.",
    memberAccess:
      "Viewing the 7-slot community solution pool, reading author-endorsed answers, voting, commenting, and asking new questions.",
    gatedAction: "inspect peer solutions in Solve!",
  },
  {
    area: "Lessons",
    href: "/lessons",
    ctaLabel: "View Catalog",
    publicAccess:
      "Scan the subject-organized courseware shelf, syllabus tags, video/attachment indicators, and excerpts.",
    memberAccess:
      "Opening full step-by-step lesson pages, viewing attachments, upvoting, saving to Study Plans, and authoring lessons.",
    gatedAction: "read full step-by-step lessons",
  },
  {
    area: "Forum",
    href: "/forum",
    ctaLabel: "Read Threads",
    publicAccess:
      "Browse live 30-day Q&A discussions, academic notes, institutional notices, and the top 3 comments on any thread.",
    memberAccess:
      "Expanding remaining replies and deeper discussion comments, posting threads, replying, voting, and saving posts.",
    gatedAction: "join Forum threads and view all replies",
  },
];

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown; results?: unknown };
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.results)) return record.results as T[];
  }
  return [];
}

function SevenSlotPreviewBar({ filled = 3 }: { filled?: number }) {
  const safe = Math.max(0, Math.min(7, filled));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono tabular-nums">
        <span className="font-semibold text-foreground">ACTIVE POOL CAPACITY</span>
        <span className="font-semibold text-primary">{safe} / 7 SLOTS</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 h-2">
        {Array.from({ length: 7 }).map((_, idx) => (
          <span
            key={idx}
            className={cn(
              "rounded-sm transition-colors",
              idx < safe ? "bg-primary" : "bg-muted border border-border/70"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function LandingPage({
  initialProblems,
  initialPapers,
  initialSubjects,
}: LandingPageProps) {
  const router = useRouter();
  const { openAuthGate } = useAuthGate();

  const [isDarkSurface, setIsDarkSurface] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTour, setActiveTour] = useState<TourTabKey>("train");
  const [trainPreviewPane, setTrainPreviewPane] = useState<"qp" | "ms">("qp");

  const { data: liveProblems } = useQuery<Problem[]>({
    queryKey: ["landing-public-problems"],
    queryFn: async () => {
      const res = await apiFetch<unknown>("/problems/?page_size=4&expand=subject_details,level_details");
      return unwrapList<Problem>(res).slice(0, 4);
    },
    initialData: initialProblems.length > 0 ? initialProblems : undefined,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: livePapers } = useQuery<Resource[]>({
    queryKey: ["landing-public-papers"],
    queryFn: async () => {
      const res = await apiFetch<unknown>("/resources/files/?resource_type=PAST_PAPER&page_size=4");
      return unwrapList<Resource>(res).slice(0, 4);
    },
    initialData: initialPapers.length > 0 ? initialPapers : undefined,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const problems = (liveProblems && liveProblems.length > 0 ? liveProblems : initialProblems).slice(0, 4);
  const papers = (livePapers && livePapers.length > 0 ? livePapers : initialPapers).slice(0, 4);
  const quickSubjects = initialSubjects.slice(0, 6);

  const handleArchiveSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      router.push("/resources");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground",
        isDarkSurface ? "dark" : "landing-archival-light"
      )}
    >
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="inline-flex items-center justify-center rounded-md border border-primary/25 bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                E2E
              </span>
              <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
                Hinthar Education
              </span>
            </Link>
          </div>

          <nav
            aria-label="Public workspace routes"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground"
          >
            <Link href="/problems" className="hover:text-foreground transition-colors py-1">
              Solve!
            </Link>
            <Link href="/resources" className="hover:text-foreground transition-colors py-1">
              Resources &amp; Train!
            </Link>
            <Link href="/lessons" className="hover:text-foreground transition-colors py-1">
              Lessons
            </Link>
            <Link href="/forum" className="hover:text-foreground transition-colors py-1">
              Forum
            </Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkSurface((prev) => !prev)}
              aria-label={isDarkSurface ? "Switch to Warm Archival Paper light mode" : "Switch to Deep Library Obsidian dark mode"}
              title={isDarkSurface ? "Warm Archival Paper (Light)" : "Deep Library Obsidian (Dark)"}
              className="size-11 md:size-9 text-muted-foreground hover:text-foreground"
            >
              {isDarkSurface ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </Button>

            <Link
              href="/sign-in"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "hidden sm:inline-flex min-h-[40px] md:min-h-[38px] px-4 text-sm font-medium",
              })}
            >
              Log in
            </Link>

            <Link
              href="/sign-up"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "min-h-[44px] md:min-h-[38px] px-3.5 sm:px-4 text-sm font-semibold shadow-sm",
              })}
            >
              Sign up free
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="size-11 md:hidden text-foreground"
            >
              {mobileMenuOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-card px-4 py-4 space-y-2 md:hidden">
            <nav aria-label="Mobile public navigation" className="grid grid-cols-2 gap-2">
              <Link
                href="/problems"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
              >
                Solve!
              </Link>
              <Link
                href="/resources"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
              >
                Resources &amp; Train!
              </Link>
              <Link
                href="/lessons"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
              >
                Lessons
              </Link>
              <Link
                href="/forum"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
              >
                Forum
              </Link>
            </nav>
            <div className="pt-2 flex gap-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className={buttonVariants({
                  variant: "outline",
                  className: "flex-1 min-h-[44px] justify-center font-semibold",
                })}
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className={buttonVariants({
                  variant: "default",
                  className: "flex-1 min-h-[44px] justify-center font-semibold",
                })}
              >
                Sign up free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {/* Hero Band + Wide Product Tour Frame */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] text-foreground max-w-4xl">
              Every past paper paired with the peers who solved it.
            </h1>

            <div className="mt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[65ch]">
                Practice Question Papers beside Mark Schemes in Train!, trace stuck questions directly into Solve!, and browse real lessons and open papers before creating an account.
              </p>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/sign-up"
                  className={buttonVariants({
                    variant: "default",
                    className: "min-h-[44px] px-5 text-sm font-semibold gap-2 shadow-sm",
                  })}
                >
                  <span>Start Solving Free</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href="#public-archive"
                  className={buttonVariants({
                    variant: "outline",
                    className: "min-h-[44px] px-5 text-sm font-medium bg-card",
                  })}
                >
                  Browse Public Archive
                </a>
              </div>
            </div>

            {/* Real Working Action: Search the Public Archive */}
            <form
              onSubmit={handleArchiveSearch}
              role="search"
              aria-label="Search past papers, problems, lessons, and threads"
              className="mt-8 flex flex-col sm:flex-row gap-2.5 max-w-2xl"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search syllabus codes (e.g. 9709, 9702), topics, or paper filenames..."
                  aria-label="Search syllabus codes, topics, or paper filenames"
                  className="h-11 pl-10 bg-card border-border text-sm"
                />
              </div>
              <Button type="submit" variant="secondary" className="h-11 px-5 text-sm font-semibold shrink-0">
                Search Archive
              </Button>
            </form>

            {quickSubjects.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Subjects in archive:</span>
                {quickSubjects.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/resources?subject=${encodeURIComponent(sub.id)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {sub.code && (
                      <span className="font-mono text-xs text-primary font-semibold">
                        {sub.code}
                      </span>
                    )}
                    <span>{sub.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Wide Product Tour Frame */}
            <div className="mt-10 rounded-t-2xl border border-b-0 border-border bg-card shadow-card overflow-hidden">
              {/* Tour Tab Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/45 px-4 sm:px-6 py-3">
                <div role="tablist" aria-label="Platform workspace preview" className="flex flex-wrap items-center gap-1.5">
                  {TOUR_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTour === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveTour(tab.key)}
                        className={cn(
                          "inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                  KaTeX math · EN &amp; မြန်မာစာ bilingual ready
                </span>
              </div>

              {/* Tour Panel Content (Flat Hairline Layout — No Nested Cards) */}
              <div className="p-5 sm:p-8 lg:p-10">
                {activeTour === "train" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono tabular-nums text-xs border-primary/30 bg-accent text-primary">
                          9709 · MAY/JUNE · PAPER 32 · Q7
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Public Split-Screen Workspace
                        </Badge>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                        Paired Question Papers &amp; Mark Schemes without losing your place
                      </h2>

                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
                        Open any past paper publicly in Train! with Left Question Paper and Right Mark Scheme panes plus an integrated session timer. When a step stalls you, inspect related Solve! questions once signed in.
                      </p>

                      {/* Specimen Toggle & KaTeX Output */}
                      <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2.5">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {trainPreviewPane === "qp" ? "LEFT PANE · QUESTION PAPER (QP)" : "RIGHT PANE · MARK SCHEME (MS)"}
                          </span>
                          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
                            <button
                              type="button"
                              onClick={() => setTrainPreviewPane("qp")}
                              className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                                trainPreviewPane === "qp"
                                  ? "bg-card text-foreground shadow-2xs"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              QP View
                            </button>
                            <button
                              type="button"
                              onClick={() => setTrainPreviewPane("ms")}
                              className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                                trainPreviewPane === "ms"
                                  ? "bg-card text-foreground shadow-2xs"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              MS View
                            </button>
                          </div>
                        </div>

                        {trainPreviewPane === "qp" ? (
                          <div className="space-y-2 text-sm text-foreground">
                            <p className="leading-relaxed">
                              Sketch the locus of points representing complex numbers{" "}
                              <MathRenderer content="$z$" className="inline" /> satisfying the equation below and find the exact greatest value of{" "}
                              <MathRenderer content="$|z|$" className="inline" />:
                            </p>
                            <MathRenderer content="$$|z - 2i| = 2|z + 1|$$" />
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm text-foreground">
                            <p className="leading-relaxed text-muted-foreground">
                              Square moduli and complete the square in Cartesian form (M1 A1):
                            </p>
                            <MathRenderer content="$$\left(x + \frac{4}{3}\right)^2 + \left(y + \frac{2}{3}\right)^2 = \frac{20}{9} \implies |z|_{\max} = \frac{4\sqrt{5}}{3}$$" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-5 rounded-xl border border-border bg-background p-5 sm:p-6 space-y-5">
                      <SevenSlotPreviewBar filled={3} />

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Past Papers, Textbooks, and the Train! split-pane workspace are open right away. Sign up or log in to save papers into Study Sessions or inspect linked Solve! peer solutions.
                      </p>

                      <div className="space-y-2.5 pt-2 border-t border-border">
                        <Link
                          href="/resources"
                          className={buttonVariants({
                            variant: "default",
                            size: "sm",
                            className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-semibold",
                          })}
                        >
                          <span>Open Resources &amp; Train! now</span>
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openAuthGate({
                              actionLabel: "check or ask Solve! questions on this paper",
                              redirectUrl: "/resources",
                            })
                          }
                          className="w-full min-h-[44px] md:min-h-[38px] justify-between font-medium"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Lock className="size-3.5 text-primary" aria-hidden="true" />
                            <span>Check Solve! Solutions</span>
                          </span>
                          <span className="text-xs text-muted-foreground">Sign in</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTour === "solve" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono tabular-nums text-xs border-primary/30 bg-accent text-primary">
                          SOLVE! · 7-SLOT CONSENSUS POOL
                        </Badge>
                        <Badge variant="outline" className="text-xs border-warning/40 bg-warning/10 text-warning">
                          Peer Solutions Locked for Guests
                        </Badge>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                        Focused 7-slot solution pools instead of noisy reply chains
                      </h2>

                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
                        Anyone can read problem prompts, attachments, and tags in Solve!. Members unlock up to 7 curated community solutions per thread, Tier 2+ quality eviction, and author-endorsed Final Consensus locks.
                      </p>

                      <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-2">
                        <div className="text-xs font-mono text-muted-foreground">
                          PUBLIC PROBLEM PROMPT PREVIEW
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          Evaluate the exact trigonometric integral using substitution or identity:
                        </div>
                        <MathRenderer content="$$\int_0^{\pi/4} \tan^2 x \, dx = \left[\tan x - x\right]_0^{\pi/4} = 1 - \frac{\pi}{4}$$" />
                      </div>
                    </div>

                    <div className="lg:col-span-5 rounded-xl border border-border bg-background p-5 sm:p-6 space-y-5">
                      <SevenSlotPreviewBar filled={5} />

                      <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                          <Lock className="size-4 text-primary shrink-0" aria-hidden="true" />
                          <span>Sign up / Log in to see peer solutions</span>
                        </div>
                        <p>
                          Reading submitted solutions, viewing contributor profiles, voting with reputation weight, and posting solutions require a free E2E account.
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-border">
                        <Link
                          href="/problems"
                          className={buttonVariants({
                            variant: "default",
                            size: "sm",
                            className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-semibold",
                          })}
                        >
                          <span>Browse Public Problem List</span>
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openAuthGate({
                              actionLabel: "inspect peer solutions & join Solve!",
                              redirectUrl: "/problems",
                            })
                          }
                          className="w-full min-h-[44px] md:min-h-[38px] justify-between font-medium"
                        >
                          <span>Sign up / Log in to unlock solutions</span>
                          <LogIn className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTour === "courseware" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs border-primary/30 bg-accent text-primary">
                          LESSONS &amp; FORUM · BILINGUAL ARCHIVE
                        </Badge>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                        Creator-led courseware &amp; 30-day Forum Q&amp;A built for Myanmar &amp; English learners
                      </h2>

                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
                        Scan the complete Lessons subject catalog and read Forum threads with their top 3 community comments immediately. Opening full lesson pages or expanding deeper discussion threads prompts Sign up / Log in.
                      </p>

                      <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-2">
                        <div className="text-xs font-mono text-muted-foreground">
                          BILINGUAL SCRIPT &amp; SYMBOLS
                        </div>
                        <p className="text-sm text-foreground leading-[1.75]">
                          သင်္ချာ၊ ရူပဗေဒ နှင့် ဓာတုဗေဒ သင်ခန်းစာများကို{" "}
                          <span className="font-medium text-primary">English + မြန်မာစာ</span>{" "}
                          နှစ်ဘာသာဖြင့် LaTeX သင်္ကေတများ မပျက်စီးဘဲ ဖတ်ရှုလေ့လာနိုင်ပါသည်။
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-5 rounded-xl border border-border bg-background p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                        <span>PUBLIC READ BOUNDARIES</span>
                        <span className="text-primary font-semibold">FREE ACCOUNT TO UNLOCK</span>
                      </div>

                      <ul className="space-y-2.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Browse Lessons subject shelves &amp; tags publicly</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Read Forum posts + top 3 comments without login</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <Lock className="size-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Full lessons, nested replies, voting &amp; saves prompt Sign in</span>
                        </li>
                      </ul>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <Link
                          href="/lessons"
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "min-h-[44px] md:min-h-[38px] justify-center font-semibold",
                          })}
                        >
                          Lessons Catalog
                        </Link>
                        <Link
                          href="/forum"
                          className={buttonVariants({
                            variant: "default",
                            size: "sm",
                            className: "min-h-[44px] md:min-h-[38px] justify-center font-semibold",
                          })}
                        >
                          Open Forum
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Live Public Archive Preview */}
        <section id="public-archive" className="border-b border-border bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                  Open directly from the live archive
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Read real community question prompts and launch Past Papers inside Train! before creating an account. Member actions trigger a quick sign-in prompt.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/problems"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "min-h-[44px] md:min-h-[38px] px-4 font-semibold bg-card",
                  })}
                >
                  All Problems
                </Link>
                <Link
                  href="/resources"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "min-h-[44px] md:min-h-[38px] px-4 font-semibold bg-card",
                  })}
                >
                  All Past Papers
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Column 1: Solve! Public Prompts */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Recent Solve! Questions
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    Prompts open · Solutions gated
                  </span>
                </div>

                {problems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Open the Solve! board to view available questions and subject tags.
                    </p>
                    <Link
                      href="/problems"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "min-h-[40px] gap-1.5 font-semibold",
                      })}
                    >
                      <span>Open Solve! Board</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {problems.map((prob) => {
                      const snippet = stripHtml(prob.body || "");
                      const poolCount = Math.min(prob.solution_count ?? 0, 7);
                      return (
                        <article key={prob.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-xs font-medium border-primary/30 bg-accent text-primary"
                              >
                                {prob.status}
                              </Badge>
                              {prob.subject_details?.name && (
                                <Badge variant="secondary" className="text-xs">
                                  {prob.subject_details.name}
                                </Badge>
                              )}
                              {prob.level_details?.name && (
                                <span className="text-xs text-muted-foreground">
                                  {prob.level_details.name}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openAuthGate({
                                  actionLabel: "view peer solutions for this problem",
                                  redirectUrl: `/problems/${prob.id}`,
                                })
                              }
                              className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                              <Lock className="size-3" aria-hidden="true" />
                              <span>{poolCount}/7 solutions</span>
                            </button>
                          </div>

                          <Link
                            href={`/problems/${prob.id}`}
                            className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          >
                            <h4 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {prob.title}
                            </h4>
                            {snippet && (
                              <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {snippet}
                              </p>
                            )}
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Click any prompt to read full question details</span>
                  <Link
                    href="/problems"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <span>Browse Solve!</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Column 2: Resources & Train! Past Papers */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Past Papers Ready in Train!
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    QP + MS split view open
                  </span>
                </div>

                {papers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Browse Cambridge Past Papers &amp; Textbooks and launch split-pane practice.
                    </p>
                    <Link
                      href="/resources"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "min-h-[40px] gap-1.5 font-semibold",
                      })}
                    >
                      <span>Open Resources Archive</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {papers.map((paper) => {
                      const title = paper.title || paper.file_name || "Exam Paper";
                      return (
                        <div
                          key={paper.id}
                          className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {paper.paper_type && (
                                <Badge variant="outline" className="font-mono text-xs font-semibold">
                                  {paper.paper_type}
                                </Badge>
                              )}
                              {paper.year && (
                                <span className="font-mono tabular-nums text-xs text-muted-foreground">
                                  {paper.year} {paper.session || ""}
                                  {paper.paper_code ? ` · P${paper.paper_code}` : ""}
                                </span>
                              )}
                              {paper.subject_details?.name && (
                                <span className="text-xs font-medium text-foreground">
                                  {paper.subject_details.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-foreground truncate" title={title}>
                              {title}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openAuthGate({
                                  actionLabel: "save papers to your Study Sessions",
                                  redirectUrl: `/train/${paper.id}`,
                                })
                              }
                              className="min-h-[40px] md:min-h-[34px] text-xs font-medium text-muted-foreground"
                            >
                              <Lock className="size-3 mr-1" aria-hidden="true" />
                              Save
                            </Button>
                            <Link
                              href={`/train/${paper.id}`}
                              className={buttonVariants({
                                variant: "secondary",
                                size: "sm",
                                className: "min-h-[40px] md:min-h-[34px] gap-1 text-xs font-semibold",
                              })}
                            >
                              <span>Train!</span>
                              <ExternalLink className="size-3" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Timer &amp; paired Mark Scheme open publicly</span>
                  <Link
                    href="/resources"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <span>Explore Archive</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Transparent Public vs. Member Boundary Directory */}
        <section className="border-b border-border bg-card py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                What stays open, and what unlocks when you sign in
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Explore the archive first with zero paywalls. Creating a free account unlocks community solutions, full courseware, voting, and your personal study library.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background overflow-hidden divide-y divide-border">
              {PUBLIC_BOUNDARY_ROWS.map((row) => (
                <div
                  key={row.area}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 p-5 sm:p-6 items-start"
                >
                  <div className="lg:col-span-3 space-y-2">
                    <h3 className="text-base font-semibold text-foreground">{row.area}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={row.href}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>{row.ctaLabel}</span>
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>Public Access</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {row.publicAccess}
                    </p>
                  </div>

                  <div className="lg:col-span-4 space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Lock className="size-3.5 shrink-0 text-warning" aria-hidden="true" />
                      <span>Sign up / Log in to see more</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {row.memberAccess}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        openAuthGate({
                          actionLabel: row.gatedAction,
                          redirectUrl: row.href,
                        })
                      }
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Sign up or log in &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Invitation */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              <span>Solve! · Train! · Lessons · Forum</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
              Start practicing a past paper or join your peers in Solve!.
            </h2>

            <p className="mx-auto max-w-[60ch] text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every free account unlocks all 7-slot worked solutions, full step-by-step lessons, nested discussion threads, and up to 12 saved study plans and sessions.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/sign-up"
                className={buttonVariants({
                  variant: "default",
                  className: "min-h-[44px] px-6 text-sm font-semibold gap-2 shadow-sm",
                })}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                <span>Create free account</span>
              </Link>
              <Link
                href="/resources"
                className={buttonVariants({
                  variant: "outline",
                  className: "min-h-[44px] px-6 text-sm font-medium bg-card",
                })}
              >
                Explore Public Papers
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Editorial Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-semibold text-foreground">E2E</span>
            <span>·</span>
            <span>Hinthar Education Academic Platform</span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-5">
            <Link href="/problems" className="hover:text-foreground transition-colors py-1">
              Solve!
            </Link>
            <Link href="/resources" className="hover:text-foreground transition-colors py-1">
              Resources &amp; Train!
            </Link>
            <Link href="/lessons" className="hover:text-foreground transition-colors py-1">
              Lessons
            </Link>
            <Link href="/forum" className="hover:text-foreground transition-colors py-1">
              Forum
            </Link>
            <Link href="/sign-in" className="font-semibold text-foreground hover:text-primary transition-colors py-1">
              Log in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
