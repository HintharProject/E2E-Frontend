"use client";

import React from "react";
import { ConfidenceBand } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HelpCircle, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";

export function deriveConfidenceBand(score: number): ConfidenceBand {
  if (score <= 0) return "unanswered";
  if (score < 50) return "developing";
  if (score < 80) return "likely_solved";
  return "high";
}

export interface ConfidenceBadgeProps {
  confidence: number;
  band?: ConfidenceBand;
  size?: "sm" | "md";
  showTooltip?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  band,
  size = "md",
  showTooltip = true,
  className,
}: ConfidenceBadgeProps) {
  const c = Math.max(0, Math.min(100, Math.round(confidence ?? 0)));
  const resolvedBand = band ?? deriveConfidenceBand(c);

  const tooltip = showTooltip
    ? `Confidence (${c}%) reflects top solution scores, peer & author validation, and thread stability since the last solution update.`
    : undefined;

  const config: Record<
    ConfidenceBand,
    {
      label: string;
      shortLabel: string;
      variant: "outline" | "warning";
      toneClass: string;
      Icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    unanswered: {
      label: "Needs Solution",
      shortLabel: "Needs Solution",
      variant: "outline",
      toneClass: "text-muted-foreground border-border bg-card",
      Icon: HelpCircle,
    },
    developing: {
      label: `${c}% · Developing`,
      shortLabel: `${c}% Developing`,
      variant: "warning",
      toneClass:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      Icon: TrendingUp,
    },
    likely_solved: {
      label: `${c}% · Likely Solved`,
      shortLabel: `${c}% Likely Solved`,
      variant: "outline",
      toneClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
      Icon: Sparkles,
    },
    high: {
      label: `${c}% · High Confidence`,
      shortLabel: `${c}% High Confidence`,
      variant: "outline",
      toneClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      Icon: ShieldCheck,
    },
  };

  const { label, shortLabel, variant, toneClass, Icon } = config[resolvedBand];

  return (
    <Badge
      variant={variant}
      title={tooltip}
      className={cn(
        "font-medium tabular-nums gap-1 text-xs",
        size === "sm" ? "px-2 h-5" : "px-2.5 h-6",
        toneClass,
        className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span>{size === "sm" ? shortLabel : label}</span>
    </Badge>
  );
}

