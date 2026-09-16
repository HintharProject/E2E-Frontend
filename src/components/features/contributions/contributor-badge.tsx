"use client";

import * as React from "react";
import { ContributorTier, TIER_CONFIG } from "@/types/contribution";
import { cn } from "@/lib/utils";
import { Shield, Award, Zap, Crown, Sparkles, Info } from "lucide-react";
import { ContributorTierInfoModal } from "./contributor-tier-info-modal";

export interface ContributorBadgeProps {
  tier?: ContributorTier | null;
  points?: number;
  size?: "sm" | "md" | "lg";
  showWeightTooltip?: boolean;
  showIcon?: boolean;
  showInfoIcon?: boolean;
  interactive?: boolean;
  className?: string;
}

const TIER_ICONS = {
  0: Shield,
  1: Award,
  2: Zap,
  3: Crown,
  4: Sparkles,
};

export function ContributorBadge({
  tier = 0,
  points,
  size = "md",
  showWeightTooltip = true,
  showIcon = true,
  showInfoIcon = true,
  interactive = true,
  className,
}: ContributorBadgeProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const safeTier = (tier !== undefined && tier !== null && tier >= 0 && tier <= 4 ? tier : 0) as ContributorTier;
  const config = TIER_CONFIG[safeTier];
  const IconComponent = TIER_ICONS[safeTier];

  const sizeClasses = {
    sm: "h-[18px] px-1.5 text-[10px] gap-1",
    md: "h-[22px] px-2 text-xs gap-1.5",
    lg: "h-7 px-3 text-sm gap-2 font-medium",
  }[size];

  const iconSizes = {
    sm: "size-2.5",
    md: "size-3.5",
    lg: "size-4",
  }[size];

  const infoIconSizes = {
    sm: "size-2.5",
    md: "size-3",
    lg: "size-3.5",
  }[size];

  const tierStyleClasses = {
    0: "border-tier-0/30 bg-tier-0-bg text-tier-0",
    1: "border-tier-1/30 bg-tier-1-bg text-tier-1 font-medium",
    2: "border-tier-2/30 bg-tier-2-bg text-tier-2 font-medium",
    3: "border-tier-3/30 bg-tier-3-bg text-tier-3 font-semibold",
    4: "border-purple-400/40 animate-scholar-shimmer text-white font-bold shadow-sm",
  }[safeTier];

  const tooltipText = showWeightTooltip
    ? `${config.name} (Tier ${safeTier}) · ${config.voteMultiplier}x Dynamic Vote Weight${
        points !== undefined ? ` · ${points.toLocaleString()} pts` : ""
      }${interactive ? " · Click to view tier privileges & points guide" : ""}`
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <span
        title={tooltipText}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? handleClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        className={cn(
          "inline-flex items-center justify-center shrink-0 rounded-full border transition-all select-none",
          interactive
            ? "cursor-pointer hover:shadow-xs hover:brightness-105 active:scale-[0.98] group/contributor-badge"
            : "cursor-default",
          sizeClasses,
          tierStyleClasses,
          className
        )}
      >
        {showIcon && <IconComponent className={cn(iconSizes, "shrink-0")} />}
        <span>{config.name}</span>
        {points !== undefined && size === "lg" && (
          <span className="opacity-80 font-normal">({points.toLocaleString()} pts)</span>
        )}
        {showInfoIcon && (
          <span
            className={cn(
              "inline-flex items-center justify-center transition-all",
              interactive
                ? "opacity-70 group-hover/contributor-badge:opacity-100 group-hover/contributor-badge:scale-110"
                : "opacity-70"
            )}
            aria-hidden="true"
          >
            <Info className={cn(infoIconSizes, "shrink-0")} />
          </span>
        )}
      </span>

      {interactive && (
        <ContributorTierInfoModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialTier={safeTier}
        />
      )}
    </>
  );
}

