"use client";

import React, { useState } from "react";
import { useContributionLedger } from "@/hooks/use-contribution";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContributorBadge } from "./contributor-badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, RefreshCw, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";

export interface ContributionLedgerTableProps {
  userId: string;
  className?: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All Events" },
  { value: "SOLUTION_UPVOTE", label: "Solution Upvotes" },
  { value: "SOLUTION_DOWNVOTE", label: "Solution Downvotes" },
  { value: "PROBLEM_SOLVED", label: "Problem Solved Milestone" },
  { value: "PROBLEM_UPVOTE", label: "Problem Upvotes" },
  { value: "CURATION_VOTE", label: "Daily Curation" },
  { value: "ADMIN_ADJUSTMENT", label: "Admin Adjustments" },
];

function getEventBadgeVariant(eventType: string) {
  if (eventType.includes("UPVOTE") || eventType === "PROBLEM_SOLVED" || eventType === "CURATION_VOTE") {
    return "default";
  }
  if (eventType.includes("DOWNVOTE") || eventType.includes("PRUNED")) {
    return "destructive";
  }
  return "outline";
}

export function ContributionLedgerTable({ userId, className }: ContributionLedgerTableProps) {
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const pageSize = 15;

  const { data, isLoading, isError, isFetching, refetch } = useContributionLedger(userId, {
    page,
    page_size: pageSize,
    event_type: eventTypeFilter || undefined,
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_count / pageSize) : 1;

  const getTargetUrl = (target?: { content_type: string; object_id: string } | null) => {
    if (!target) return null;
    if (target.content_type === "solution") {
      return `/problems`; // Or link to problem if problem_id present
    }
    if (target.content_type === "problem") {
      return `/problems/${target.object_id}`;
    }
    if (target.content_type === "post") {
      return `/posts/${target.object_id}`;
    }
    if (target.content_type === "lesson") {
      return `/lessons/${target.object_id}`;
    }
    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="event-filter" className="text-xs font-medium text-ink-muted">
            Filter Event:
          </label>
          <select
            id="event-filter"
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-end sm:self-auto text-xs gap-1.5"
        >
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/50 text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Date & Time</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Points Delta</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
                <th className="px-4 py-3 font-semibold">Content Target</th>
                <th className="px-4 py-3 font-semibold">Peer / Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    Unable to load contribution transaction history.
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    No contribution transactions recorded for this filter.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const targetUrl = getTargetUrl(tx.target_preview);
                  const isPositive = tx.delta > 0;
                  const isNegative = tx.delta < 0;

                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>

                      {/* Event */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getEventBadgeVariant(tx.event_type)} className="text-[10px] h-5">
                          {tx.event_type_display || tx.event_type}
                        </Badge>
                      </td>

                      {/* Delta */}
                      <td className="px-4 py-3 whitespace-nowrap font-heading font-semibold">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1",
                            isPositive && "text-emerald-600 dark:text-emerald-400",
                            isNegative && "text-rose-600 dark:text-rose-400",
                            !isPositive && !isNegative && "text-ink-muted"
                          )}
                        >
                          {isPositive && <ArrowUpRight className="size-3.5" />}
                          {isNegative && <ArrowDownRight className="size-3.5" />}
                          <span>
                            {isPositive ? `+${tx.delta}` : tx.delta} pts
                          </span>
                        </div>
                      </td>

                      {/* Resulting Balance */}
                      <td className="px-4 py-3 font-mono font-medium text-ink tabular-nums whitespace-nowrap">
                        {tx.resulting_balance.toLocaleString()} pts
                      </td>

                      {/* Target Preview */}
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        {tx.target_preview ? (
                          targetUrl ? (
                            <Link
                              href={targetUrl}
                              className="text-brand hover:underline inline-flex items-center gap-1 font-medium truncate"
                              title={tx.target_preview.title || tx.target_preview.body_snippet}
                            >
                              <FileText className="size-3 shrink-0" />
                              <span className="truncate">
                                {tx.target_preview.title || tx.target_preview.body_snippet || "View target"}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-ink-muted truncate">
                              {tx.target_preview.title || tx.target_preview.body_snippet || tx.target_preview.content_type}
                            </span>
                          )
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>

                      {/* Peer / Actor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {tx.actor ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-ink">{tx.actor.display_name}</span>
                            <ContributorBadge tier={tx.actor.contributor_tier} size="sm" showIcon={false} />
                          </div>
                        ) : (
                          <span className="text-ink-muted">System</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.total_count > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-muted/30">
            <span className="text-xs text-ink-muted">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({meta.total_count} total records)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
              >
                <ChevronLeft className="size-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
