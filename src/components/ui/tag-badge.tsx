"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import { cn } from "@/lib/utils";

export interface TagBadgeProps {
  name: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Clickable TagBadge component for interactive micro-taxonomy discovery.
 * Prevents click event propagation so parent card links (e.g. BaseFeedCard) are not triggered.
 * Routes to the unified Tag Hub view at /tags/[name].
 */
export function TagBadge({ name, size = "sm", className }: TagBadgeProps) {
  const { isSignedIn } = useAuthGate();
  const cleanName = (name || "").replace(/^#/, "").trim().toLowerCase();

  if (!cleanName) return null;

  return (
    <Link
      href={`/tags/${encodeURIComponent(cleanName)}`}
      prefetch={isSignedIn ? undefined : false}
      onClick={(e) => {
        // Prevent triggering parent card navigation (e.g., BaseFeedCard, PostCard)
        e.stopPropagation();
      }}
      title={`Explore all contents tagged #${cleanName}`}
      className="group/tag inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 -my-2 sm:my-0 rounded-full outline-none"
    >
      <Badge
        variant="outline"
        className={cn(
          "border-border bg-secondary/70 font-mono font-medium text-muted-foreground transition-colors cursor-pointer select-none",
          "hover:border-primary/35 hover:bg-accent hover:text-accent-foreground",
          "group-focus-visible/tag:ring-2 group-focus-visible/tag:ring-ring group-focus-visible/tag:ring-offset-2 group-focus-visible/tag:ring-offset-background",
          size === "sm" ? "h-5 px-2 py-0.5 text-xs" : "h-6 px-2.5 py-1 text-xs",
          className
        )}
      >
        #{cleanName}
      </Badge>
    </Link>
  );
}
