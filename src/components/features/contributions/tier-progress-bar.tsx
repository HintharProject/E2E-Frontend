"use client";

import React from "react";
import { ContributorTier, TIER_CONFIG, TierProgress } from "@/types/contribution";
import { ContributorBadge } from "./contributor-badge";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, Sparkles, TrendingUp } from "lucide-react";

export interface TierProgressBarProps {
  tier?: ContributorTier | null;
  points?: number;
  tierProgress?: TierProgress | null;
  className?: string;
}

export function TierProgressBar({
  tier = 0,
  points = 0,
  tierProgress,
  className,
}: TierProgressBarProps) {
  const currentTier = (tier !== undefined && tier !== null && tier >= 0 && tier <= 4 ? tier : 0) as ContributorTier;
  const currentConfig = TIER_CONFIG[currentTier];

  const nextTier = (currentTier < 4 ? currentTier + 1 : null) as ContributorTier | null;
  const nextConfig = nextTier !== null ? TIER_CONFIG[nextTier] : null;

  // Fallback calculation if backend progress object is not provided
  const currentTierMin = tierProgress?.current_tier_min ?? currentConfig.minPoints;
  const nextTierThreshold = tierProgress?.next_tier_threshold ?? nextConfig?.minPoints ?? null;

  let progressPercentage = 100;
  let pointsToNext = 0;

  if (nextTierThreshold !== null) {
    const range = nextTierThreshold - currentTierMin;
    const progressIntoTier = Math.max(0, points - currentTierMin);
    progressPercentage = Math.min(100, Math.max(0, Math.round((progressIntoTier / range) * 100)));
    pointsToNext = Math.max(0, nextTierThreshold - points);
  }

  // Hysteresis Demotion Buffer calculations (10 points below threshold)
  const demotionBufferThreshold =
    tierProgress?.demotion_buffer_threshold ?? (currentTier > 0 ? currentTierMin - 10 : 0);
  const pointsAboveDemotion =
    tierProgress?.points_above_demotion ?? Math.max(0, points - demotionBufferThreshold);
  const isInGraceBuffer = currentTier > 0 && points < currentTierMin && points >= demotionBufferThreshold;

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card p-5 shadow-2xs space-y-4",
        className
      )}
    >
      {/* Top Header: Current Tier & Points */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ContributorBadge tier={currentTier} size="lg" showWeightTooltip={false} />
          <div>
            <div className="font-heading text-lg font-bold text-ink">
              {points.toLocaleString()} <span className="text-xs font-normal text-ink-muted">Net Points</span>
            </div>
            <div className="text-xs text-ink-muted">
              {currentConfig.voteMultiplier}x Dynamic Vote Multiplier
            </div>
          </div>
        </div>

        {/* Status Chip */}
        {nextTier !== null ? (
          <div className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-muted px-2.5 py-1 text-xs text-ink-muted">
            <TrendingUp className="size-3.5 text-primary" />
            <span>
              <strong className="text-ink">{pointsToNext.toLocaleString()} pts</strong> to {nextConfig?.name}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Sparkles className="size-3.5" />
            <span>Diamond Scholar · Max Tier</span>
          </div>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-1.5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              currentTier === 4
                ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-scholar-shimmer"
                : "bg-primary"
            )}
            style={{ width: `${currentTier === 4 ? 100 : progressPercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-ink-muted font-mono">
          <span>{currentTierMin} pts ({currentConfig.name})</span>
          {nextTierThreshold !== null ? (
            <span>{nextTierThreshold} pts ({nextConfig?.name})</span>
          ) : (
            <span>2,000+ pts (Top Tier)</span>
          )}
        </div>
      </div>

      {/* Hysteresis Demotion Buffer Transparency Banner */}
      {currentTier > 0 && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
            isInGraceBuffer
              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
          )}
        >
          {isInGraceBuffer ? (
            <>
              <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              <span>
                <strong>Demotion Grace Buffer Active:</strong> Your points ({points}) are currently in the 10-point anti-flickering buffer (Threshold: {demotionBufferThreshold} pts). Maintain active contributions to stay in Tier {currentTier}!
              </span>
            </>
          ) : (
            <>
              <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
              <span>
                <strong>Tier Safe:</strong> {pointsAboveDemotion} pts above demotion threshold ({demotionBufferThreshold} pts buffer).
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
