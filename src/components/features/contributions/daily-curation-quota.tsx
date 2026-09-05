"use client";

import React, { useState, useEffect } from "react";
import { CurationQuota } from "@/types/contribution";
import { cn } from "@/lib/utils";
import { Zap, Clock, Info } from "lucide-react";

export interface DailyCurationQuotaWidgetProps {
  quota?: CurationQuota | null;
  className?: string;
}

export function DailyCurationQuotaWidget({
  quota,
  className,
}: DailyCurationQuotaWidgetProps) {
  const dailyCap = quota?.daily_cap ?? 5;
  const earnedToday = Math.min(dailyCap, Math.max(0, quota?.points_earned_today ?? 0));
  const remainingToday = Math.max(0, dailyCap - earnedToday);

  // Live countdown to 00:00:00 UTC
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      const nextUtcMidnight = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0,
          0
        )
      );
      const diffMs = nextUtcMidnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("00h 00m");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`);
    }

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card p-4 shadow-2xs space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="size-4" />
          </div>
          <div>
            <h4 className="font-heading text-sm font-semibold text-ink">Daily Curation Rewards</h4>
            <p className="text-[11px] text-ink-muted">Vote on peer solutions & problems</p>
          </div>
        </div>

        {/* Live Reset Timer */}
        <div className="flex items-center gap-1 text-[11px] text-ink-muted font-mono bg-muted px-2 py-0.5 rounded-md">
          <Clock className="size-3 text-muted-foreground" />
          <span>Resets in {timeLeft || "00h 00m"}</span>
        </div>
      </div>

      {/* 5-Pip Tracker Container */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: dailyCap }).map((_, index) => {
            const isEarned = index < earnedToday;
            return (
              <div
                key={index}
                title={isEarned ? "Curation Point Claimed (+1 pt)" : "Quota Available"}
                className={cn(
                  "size-4 rounded-full transition-all duration-300",
                  isEarned
                    ? "bg-emerald-500 shadow-xs shadow-emerald-500/50 scale-105"
                    : "bg-muted border border-line"
                )}
              />
            );
          })}
        </div>

        <div className="text-xs font-semibold tabular-nums text-ink">
          <span className="text-emerald-600 dark:text-emerald-400">{earnedToday}</span> / {dailyCap}{" "}
          <span className="text-ink-muted font-normal">pts today</span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="flex items-start gap-1.5 text-[11px] text-ink-muted bg-muted/50 p-2 rounded-lg">
        <Info className="size-3.5 shrink-0 mt-0.5 text-ink-muted" />
        <span>
          Earn +1 Contribution Point per peer item voted on (max 5/day). Sybil duplicate votes do not grant curation points.
        </span>
      </div>
    </div>
  );
}
