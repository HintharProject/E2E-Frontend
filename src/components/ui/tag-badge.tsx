"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
  const cleanName = (name || "").replace(/^#/, "").trim().toLowerCase();

  if (!cleanName) return null;

  return (
    <Link
      href={`/tags/${encodeURIComponent(cleanName)}`}
      onClick={(e) => {
        // Prevent triggering parent card navigation (e.g., BaseFeedCard, PostCard)
        e.stopPropagation();
      }}
      title={`Explore all contents tagged #${cleanName}`}
      className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Badge
        variant="outline"
        className={cn(
          "border-border bg-secondary/70 font-mono font-medium text-muted-foreground transition-colors cursor-pointer select-none",
          "hover:border-primary/35 hover:bg-accent hover:text-accent-foreground",
          size === "sm" ? "h-5 px-2 py-0.5 text-xs" : "h-6 px-2.5 py-1 text-xs",
          className
        )}
      >
        #{cleanName}
      </Badge>
    </Link>
  );
}
