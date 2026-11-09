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
      className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-full"
    >
      <Badge
        variant="outline"
        className={cn(
          "font-mono transition-colors cursor-pointer select-none",
          "hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
          size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
          className
        )}
      >
        #{cleanName}
      </Badge>
    </Link>
  );
}

