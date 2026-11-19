"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Columns2,
  FileText,
  Lightbulb,
  MessageSquare,
  Paperclip,
  PenLine,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GatedLink } from "@/components/features/auth/gated-link";
import { cn } from "@/lib/utils";

type FeatureKey = "solve" | "lessons" | "resources" | "discussions";

const TOUR_TABS: {
  key: FeatureKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "solve", label: "Solve!", icon: Lightbulb },
  { key: "lessons", label: "Lessons", icon: BookOpen },
  { key: "resources", label: "Exams & Resources", icon: Columns2 },
  { key: "discussions", label: "Discussions", icon: MessageSquare },
];

export function LandingTour() {
  const [activeTab, setActiveTab] = useState<FeatureKey>("solve");
  const [trainPane, setTrainPane] = useState<"qp" | "ms">("qp");

  return (
    <div className="mt-10 rounded-t-2xl border border-b-0 border-border bg-card shadow-card overflow-hidden">
      {/* Feature Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/45 px-4 sm:px-6 py-3">
        <div
          role="tablist"
          aria-label="Platform feature preview"
          className="flex flex-wrap items-center gap-1.5"
        >
          {TOUR_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
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
      </div>

      {/* Feature Preview Content */}
      <div className="p-5 sm:p-8 lg:p-10">
        {activeTab === "solve" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/30 bg-accent text-primary">
                  Solve! Problems
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Peer confidence scoring
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Post a tough question and compare worked peer solutions
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
                Upload a photo of a homework question or link a past paper directly. Unlimited worked solutions rank by community votes and surface a continuous resolution confidence score.
              </p>

              <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Sample Problem · Physics</span>
                  <span className="font-mono tabular-nums text-primary font-semibold">4 worked solutions</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Finding acceleration and tension on an inclined pulley system
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Includes problem image, subject tag, and peer-reviewed steps ranked by contributor votes.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-border bg-background p-5 sm:p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="font-semibold text-foreground">RESOLUTION CONFIDENCE</span>
                  <span className="font-semibold text-primary">86% · High</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/70" aria-hidden="true">
                  <div className="h-full w-[86%] rounded-full bg-primary" />
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask a problem yourself or browse open questions across subjects and exam levels.
              </p>

              <div className="space-y-2 pt-2 border-t border-border">
                <Link
                  href="/problems"
                  className={buttonVariants({
                    variant: "default",
                    size: "sm",
                    className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-semibold",
                  })}
                >
                  <span>Browse Solve! Problems</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <GatedLink
                  href="/problems/new"
                  actionLabel="ask a problem in Solve!"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-medium",
                  })}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <PenLine className="size-3.5 text-primary" aria-hidden="true" />
                    <span>Ask a Problem</span>
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </GatedLink>
              </div>
            </div>
          </div>
        )}

        {activeTab === "lessons" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/30 bg-accent text-primary">
                  Lessons
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Notes, slides &amp; videos
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Upload structured lessons with notes, files, and videos
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
                Write clear topic guides, attach PDFs, slides, or worksheets, and embed YouTube walkthroughs—organized cleanly by subject and level without course-enrollment clutter.
              </p>

              <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Sample Lesson · Mathematics</span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-primary">
                    <Paperclip className="size-3" aria-hidden="true" />
                    <span>2 files</span>
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Integration by Parts — Step-by-Step Guide &amp; Practice Sheet
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Includes summary notes, downloadable PDF worksheet, and embedded walkthrough video.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-border bg-background p-5 sm:p-6 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">Built for quick publishing</div>
                <p className="leading-relaxed">
                  Attach up to 5 files (PDF, DOCX, PPTX, ZIP, or images), link a video, and save lessons to Study Plans.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Link
                  href="/lessons"
                  className={buttonVariants({
                    variant: "default",
                    size: "sm",
                    className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-semibold",
                  })}
                >
                  <span>Browse Lessons</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <GatedLink
                  href="/lessons/new"
                  actionLabel="upload a lesson"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-medium",
                  })}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <PenLine className="size-3.5 text-primary" aria-hidden="true" />
                    <span>Write a Lesson</span>
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </GatedLink>
              </div>
            </div>
          </div>
        )}

        {activeTab === "resources" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/30 bg-accent text-primary">
                  Exams &amp; Resources
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Train! split-screen
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Past papers and textbooks paired with split-screen Train!
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
                Filter past papers and textbooks by subject and level. Open Question Papers beside Mark Schemes in Train! with an exam timer, and jump straight to Solve! when stuck.
              </p>

              <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2.5">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {trainPane === "qp" ? "QUESTION PAPER (QP)" : "MARK SCHEME (MS)"}
                  </span>
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
                    <button
                      type="button"
                      onClick={() => setTrainPane("qp")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                        trainPane === "qp"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      QP View
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrainPane("ms")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                        trainPane === "ms"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      MS View
                    </button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {trainPane === "qp"
                    ? "Sample Question Paper pane: read exam questions cleanly with synced page navigation and session timer."
                    : "Sample Mark Scheme pane: check official marking points right beside the question without switching tabs."}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-border bg-background p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="size-4 text-primary" aria-hidden="true" />
                <span>Past Papers &amp; Textbooks</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Organized by syllabus, year, and session so you can open or download papers in seconds.
              </p>
              <div className="pt-2 border-t border-border">
                <Link
                  href="/resources"
                  className={buttonVariants({
                    variant: "default",
                    size: "sm",
                    className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-semibold",
                  })}
                >
                  <span>Browse Resources</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "discussions" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/30 bg-accent text-primary">
                  Discussions
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Forum · 30-day threads
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Ask quick study questions and share notes in the Forum
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
                Start focused Question, Sharing, or Announcement threads with nested replies and subject tags. Active threads stay fresh with a 30-day lifecycle.
              </p>

              <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Sample Thread · Chemistry</span>
                  <Badge variant="secondary" className="text-xs">
                    Sharing
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Summary checklist for organic reaction mechanisms before finals
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Peers reply with tips, common pitfalls, and links to related lessons.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-border bg-background p-5 sm:p-6 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">Clean academic discussions</div>
                <p className="leading-relaxed">
                  Filter by subject, level, or post type, and save useful threads into Saved Sessions.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Link
                  href="/forum"
                  className={buttonVariants({
                    variant: "default",
                    size: "sm",
                    className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-semibold",
                  })}
                >
                  <span>Open Forum</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <GatedLink
                  href="/posts/new"
                  actionLabel="create a forum post"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full min-h-[44px] md:min-h-[38px] justify-between font-medium",
                  })}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <PenLine className="size-3.5 text-primary" aria-hidden="true" />
                    <span>New Post</span>
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </GatedLink>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

