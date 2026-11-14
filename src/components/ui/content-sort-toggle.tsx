"use client";

import React from "react";
import { Sparkles, Flame, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentSortMode, TimeframeFilter } from "@/types";

interface ContentSortToggleProps {
  sort: ContentSortMode;
  timeframe?: TimeframeFilter;
  onSortChange: (sort: ContentSortMode) => void;
  onTimeframeChange?: (timeframe: TimeframeFilter) => void;
  className?: string;
}

const PRIMARY_OPTIONS: { id: ContentSortMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "default", label: "Default", icon: Sparkles },
  { id: "popular", label: "Popular", icon: Flame },
  { id: "newest", label: "Newest", icon: Clock },
];

const TIMEFRAME_OPTIONS: { id: TimeframeFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

export function ContentSortToggle({
  sort,
  timeframe = "all",
  onSortChange,
  onTimeframeChange,
  className,
}: ContentSortToggleProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Primary Sort Toggle */}
      <div className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-muted/60 p-1">
        {PRIMARY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = sort === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSortChange(opt.id)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 min-h-[44px] md:min-h-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                isActive
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Timeframe Sub-Toggle (visible only when sort === 'popular') */}
      {sort === "popular" && onTimeframeChange && (
        <div className="inline-flex items-center gap-0.5 rounded-xl border border-border/70 bg-muted/30 p-1 animate-in fade-in zoom-in-95 duration-150">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 text-xs uppercase font-bold tracking-wider text-muted-foreground">
            <Calendar className="size-3" aria-hidden="true" /> Time:
          </span>
          {TIMEFRAME_OPTIONS.map((tf) => {
            const isActive = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => onTimeframeChange(tf.id)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center justify-center min-h-[44px] md:min-h-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  isActive
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                )}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

