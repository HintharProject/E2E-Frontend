"use client";

import React from "react";
import { ConfidenceBand } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HelpCircle, Info, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";

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
  interactive?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  band,
  size = "md",
  showTooltip = true,
  interactive = true,
  className,
}: ConfidenceBadgeProps) {
  const c = Math.max(0, Math.min(100, Math.round(confidence ?? 0)));
  const resolvedBand = band ?? deriveConfidenceBand(c);

  const config: Record<
    ConfidenceBand,
    {
      label: string;
      shortLabel: string;
      bandTitle: string;
      variant: "outline" | "warning";
      toneClass: string;
      Icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    unanswered: {
      label: "Needs Solution",
      shortLabel: "Needs Solution",
      bandTitle: "Needs Solution",
      variant: "outline",
      toneClass: "text-muted-foreground border-border bg-card",
      Icon: HelpCircle,
    },
    developing: {
      label: `${c}% · Developing`,
      shortLabel: `${c}% Developing`,
      bandTitle: "Developing",
      variant: "warning",
      toneClass: "bg-warning/10 text-warning border-warning/30",
      Icon: TrendingUp,
    },
    likely_solved: {
      label: `${c}% · Likely Solved`,
      shortLabel: `${c}% Likely Solved`,
      bandTitle: "Likely Solved",
      variant: "outline",
      toneClass: "bg-chart-3/10 text-chart-3 border-chart-3/40",
      Icon: Sparkles,
    },
    high: {
      label: `${c}% · High Confidence`,
      shortLabel: `${c}% High Confidence`,
      bandTitle: "High Confidence",
      variant: "outline",
      toneClass: "bg-primary/10 text-primary border-primary/25",
      Icon: ShieldCheck,
    },
  };

  const { label, shortLabel, bandTitle, variant, toneClass, Icon } = config[resolvedBand];
  const isInteractive = showTooltip && interactive;

  const badge = (
    <Badge
      variant={variant}
      className={cn(
        "font-medium tabular-nums gap-1 text-xs",
        size === "sm" ? "px-2 h-5" : "px-2.5 h-6",
        isInteractive && "cursor-pointer transition-opacity hover:opacity-85",
        toneClass,
        !isInteractive && className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span>{size === "sm" ? shortLabel : label}</span>
      {isInteractive && (
        <Info className="size-3 shrink-0 opacity-75" aria-hidden="true" />
      )}
    </Badge>
  );

  if (!isInteractive) {
    return badge;
  }

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        onClick={(e) => e.stopPropagation()}
        aria-label={`${label}. View how solution confidence is calculated`}
        className={cn(
          "inline-flex items-center min-h-[44px] sm:min-h-0 -my-2.5 sm:my-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
      >
        {badge}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
        className="w-72 p-3.5 text-xs leading-relaxed"
      >
        <p className="font-heading font-semibold text-foreground">
          {resolvedBand === "unanswered" ? (
            "Needs Solution"
          ) : (
            <>
              <span className="font-mono tabular-nums">{c}%</span> · {bandTitle}
            </>
          )}
        </p>
        <p className="mt-1.5 text-muted-foreground">
          {resolvedBand === "unanswered"
            ? "No solution has reached a positive net score yet. Confidence updates as learners submit and validate solutions."
            : "Calculated from top solution scores, peer and author validation, and thread stability since the last solution update."}
        </p>
        <p className="mt-1.5 font-mono tabular-nums text-xs text-muted-foreground">
          Bands: 1–49% Developing · 50–79% Likely Solved · 80–100% High
        </p>
      </PopoverContent>
    </Popover>
  );
}

