"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/services/api-client";
import { LandingHeader } from "./landing-header";
import { LandingTour } from "./landing-tour";
import { LandingPreview } from "./landing-preview";
import { LandingFeatures } from "./landing-features";
import type { Lesson, Problem, Resource, Subject } from "@/types";

export interface LandingPageProps {
  initialProblems: Problem[];
  initialLessons: Lesson[];
  initialPapers: Resource[];
  initialSubjects: Subject[];
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown; results?: unknown };
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.results)) return record.results as T[];
  }
  return [];
}

export function LandingPage({
  initialProblems,
  initialLessons,
  initialPapers,
  initialSubjects,
}: LandingPageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: recentProblems } = useQuery<Problem[]>({
    queryKey: ["landing-problems"],
    queryFn: async () => {
      const res = await apiFetch<unknown>("/problems/?page_size=4&expand=subject_details,level_details");
      return unwrapList<Problem>(res).slice(0, 4);
    },
    initialData: initialProblems.length > 0 ? initialProblems : undefined,
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentLessons } = useQuery<Lesson[]>({
    queryKey: ["landing-lessons"],
    queryFn: async () => {
      const res = await apiFetch<unknown>("/lessons/?page_size=4");
      return unwrapList<Lesson>(res).slice(0, 4);
    },
    initialData: initialLessons.length > 0 ? initialLessons : undefined,
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentPapers } = useQuery<Resource[]>({
    queryKey: ["landing-papers"],
    queryFn: async () => {
      const res = await apiFetch<unknown>("/resources/files/?resource_type=PAST_PAPER&page_size=4");
      return unwrapList<Resource>(res).slice(0, 4);
    },
    initialData: initialPapers.length > 0 ? initialPapers : undefined,
    staleTime: 2 * 60 * 1000,
  });

  const problems = (recentProblems && recentProblems.length > 0 ? recentProblems : initialProblems).slice(0, 4);
  const lessons = (recentLessons && recentLessons.length > 0 ? recentLessons : initialLessons).slice(0, 4);
  const papers = (recentPapers && recentPapers.length > 0 ? recentPapers : initialPapers).slice(0, 4);
  const quickSubjects = initialSubjects.slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <LandingHeader />

      <main id="main-content" className="flex-1">
        {/* Hero & Feature Switcher */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] text-foreground max-w-4xl">
              Solve tough problems together, and share lessons that last.
            </h1>

            <div className="mt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[65ch]">
                Post questions and compare worked solutions in Solve!, publish and browse structured Lessons with files and videos, and pair them with Exams &amp; Resources and Forum discussions.
              </p>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/sign-up"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "default",
                    className: "min-h-[44px] px-5 text-sm font-semibold gap-2 shadow-sm",
                  })}
                >
                  <span>Start Solving</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/resources"
                  className={buttonVariants({
                    variant: "outline",
                    className: "min-h-[44px] px-5 text-sm font-medium bg-card",
                  })}
                >
                  Browse Resources
                </Link>
              </div>
            </div>

            {/* Unified Search */}
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Search problems, lessons, papers, and discussions"
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
                  placeholder="Search problems, lessons, papers..."
                  aria-label="Search problems, lessons, papers"
                  className="h-11 pl-10 bg-card border-border text-sm"
                />
              </div>
              <Button type="submit" variant="secondary" className="h-11 px-5 text-sm font-semibold shrink-0">
                Search
              </Button>
            </form>

            {quickSubjects.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Subjects:</span>
                {quickSubjects.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/search?subject=${encodeURIComponent(sub.id)}`}
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

            <LandingTour />
          </div>
        </section>

        {/* Real Solve! Problems & Lessons Preview */}
        <LandingPreview problems={problems} lessons={lessons} papers={papers} />

        {/* Features Directory */}
        <LandingFeatures />

        {/* Closing CTA */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
              Ask a problem, upload a lesson, or jump into a study thread.
            </h2>

            <p className="mx-auto max-w-[60ch] text-sm sm:text-base text-muted-foreground leading-relaxed">
              Create an account to post questions in Solve!, publish Lessons, save Study Plans and Saved Sessions, and join Forum discussions.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/sign-up"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "default",
                  className: "min-h-[44px] px-6 text-sm font-semibold gap-2 shadow-sm",
                })}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                <span>Create Account</span>
              </Link>
              <Link
                href="/problems"
                className={buttonVariants({
                  variant: "outline",
                  className: "min-h-[44px] px-6 text-sm font-medium bg-card",
                })}
              >
                Browse Solve!
              </Link>
            </div>
          </div>
        </section>
      </main>

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
            <Link href="/lessons" className="hover:text-foreground transition-colors py-1">
              Lessons
            </Link>
            <Link href="/resources" className="hover:text-foreground transition-colors py-1">
              Exams &amp; Resources
            </Link>
            <Link href="/forum" className="hover:text-foreground transition-colors py-1">
              Forum
            </Link>
            <Link href="/sign-in" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors py-1">
              Log in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
