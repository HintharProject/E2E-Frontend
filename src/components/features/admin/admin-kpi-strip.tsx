"use client";

import React from "react";
import Link from "next/link";
import { PlatformSummary } from "./admin-analytics-types";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  BookOpen,
  MessageSquare,
  HelpCircle,
  CheckCheck,
} from "lucide-react";

interface AdminKpiStripProps {
  summary: PlatformSummary;
}

export function AdminKpiStrip({ summary }: AdminKpiStripProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Content Assets */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Total Content Assets
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-3xl font-bold tracking-tight text-foreground">
            {summary.total_assets}
          </span>
          <span className="text-xs text-muted-foreground">created across platform</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-border/60 font-mono tabular-nums">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <BookOpen className="size-3 text-primary" /> {summary.total_lessons} Lessons
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <MessageSquare className="size-3 text-chart-3" /> {summary.total_posts} Posts
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <HelpCircle className="size-3 text-warning" /> {summary.total_problems} Problems
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <CheckCheck className="size-3 text-primary" /> {summary.total_solutions} Solutions
          </span>
        </div>
      </div>

      {/* 2. Mean Solutions / Problem */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Community Response Rate
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-3xl font-bold tracking-tight text-foreground">
            {summary.avg_solutions_per_problem.toFixed(1)}
            <span className="font-sans text-lg font-medium text-muted-foreground"> sols/prob</span>
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {summary.avg_solutions_per_problem >= 2.0
            ? "High community engagement & answer density"
            : summary.avg_solutions_per_problem >= 1.0
            ? "Moderate response rate per problem"
            : "Low response rate — needs teacher intervention"}
        </p>
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <span>Forum Discussion:</span>
          <span className="font-mono tabular-nums font-semibold text-foreground">
            {summary.avg_comments_per_post.toFixed(1)} comments / post
          </span>
        </div>
      </div>

      {/* 3. Problem Solved Rate */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Problem Resolution
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-3xl font-bold tracking-tight text-foreground">
            {summary.problem_solved_rate_pct.toFixed(0)}%
          </span>
          <span className="font-mono tabular-nums text-xs text-muted-foreground">
            ({summary.solved_problems_count} of {summary.total_problems} solved)
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-chart-3 transition-all duration-500"
            style={{ width: `${Math.min(summary.problem_solved_rate_pct, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Resolved challenges</span>
          <span className="font-mono tabular-nums font-medium text-chart-3">
            {summary.total_problems - summary.solved_problems_count} Open
          </span>
        </div>
      </div>

      {/* 4. Action Alerts & Moderation */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Moderation &amp; Action
          </span>
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${
              summary.pending_reports_count > 0 || summary.unanswered_problems_count > 0
                ? "bg-warning/10 text-warning"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <ShieldAlert className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono tabular-nums text-3xl font-bold tracking-tight text-foreground">
            {summary.pending_reports_count}
          </span>
          <span className="text-xs text-muted-foreground">pending reports</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
          {summary.unanswered_problems_count > 0 ? (
            <>
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="font-mono tabular-nums">{summary.unanswered_problems_count} problems have 0 solutions</span>
            </>
          ) : (
            <span className="text-muted-foreground">All active problems have answers</span>
          )}
        </div>
        <div className="mt-3 pt-2 border-t border-border/60">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Review Moderation Queue <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
