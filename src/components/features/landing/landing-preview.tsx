"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Lightbulb, Paperclip, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GatedLink } from "@/components/features/auth/gated-link";
import { stripHtml } from "@/components/ui/base-card";
import type { Lesson, Problem, Resource } from "@/types";

interface LandingPreviewProps {
  problems: Problem[];
  lessons: Lesson[];
  papers: Resource[];
}

export function LandingPreview({ problems, lessons, papers }: LandingPreviewProps) {
  return (
    <section id="explore" className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Recent Solve! problems and Lessons
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              See what learners are solving and sharing across the platform right now.
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
              Solve! Problems
            </Link>
            <Link
              href="/lessons"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "min-h-[44px] md:min-h-[38px] px-4 font-semibold bg-card",
              })}
            >
              All Lessons
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Column 1: Solve! Problems */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" aria-hidden="true" />
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Solve! Problems
                </h3>
              </div>
              <span className="font-mono text-xs text-muted-foreground">7-slot pool</span>
            </div>

            {problems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Browse open questions and worked solutions on the Solve! board.
                </p>
                <Link
                  href="/problems"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "min-h-[40px] gap-1.5 font-semibold",
                  })}
                >
                  <span>Browse Solve!</span>
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
                        <span className="font-mono tabular-nums text-xs font-semibold text-muted-foreground">
                          {poolCount}/7 solutions
                        </span>
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
              <span>Ask a problem or browse active threads</span>
              <Link
                href="/problems"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <span>Browse Solve!</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Column 2: Lessons */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" aria-hidden="true" />
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Lessons
                </h3>
              </div>
              <span className="font-mono text-xs text-muted-foreground">Creator guides</span>
            </div>

            {lessons.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Browse lessons by subject or upload your own study notes and attachments.
                </p>
                <Link
                  href="/lessons"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "min-h-[40px] gap-1.5 font-semibold",
                  })}
                >
                  <span>Browse Lessons</span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {lessons.map((lesson) => {
                  const snippet = stripHtml(lesson.body || "");
                  const attachmentCount = lesson.attachments?.length ?? 0;
                  return (
                    <article key={lesson.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {lesson.subject_details?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {lesson.subject_details.name}
                            </Badge>
                          )}
                          {lesson.level_details?.name && (
                            <span className="text-xs text-muted-foreground">
                              {lesson.level_details.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {attachmentCount > 0 && (
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                              <Paperclip className="size-3" aria-hidden="true" />
                              {attachmentCount}
                            </span>
                          )}
                          {lesson.embedded_video_url && (
                            <span className="inline-flex items-center gap-1">
                              <Video className="size-3" aria-hidden="true" />
                              Video
                            </span>
                          )}
                        </div>
                      </div>

                      <GatedLink
                        href={`/lessons/${lesson.id}`}
                        actionLabel="read this full lesson"
                        className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        <h4 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {lesson.title}
                        </h4>
                        {snippet && (
                          <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {snippet}
                          </p>
                        )}
                      </GatedLink>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Notes, PDFs, slides, and video guides</span>
              <Link
                href="/lessons"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <span>Browse Lessons</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Supporting Strip: Exams & Resources */}
        <div className="rounded-2xl border border-border bg-card px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                Exams &amp; Resources
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {papers.length > 0
                  ? `${papers.length}+ recent past papers and textbooks ready for split-screen Train! practice.`
                  : "Browse past papers and textbooks and practice side by side in Train!."}
              </p>
            </div>
          </div>

          <Link
            href="/resources"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "min-h-[40px] md:min-h-[36px] shrink-0 gap-1.5 font-semibold",
            })}
          >
            <span>Browse Resources</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

