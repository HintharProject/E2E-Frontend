"use client";

import React from "react";
import { ThumbsUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommentSort, CommentSortMode } from "./comment-sort-context";

export function CommentSortToggle({ className }: { className?: string }) {
  const { sort, setSort } = useCommentSort();

  const options: { id: CommentSortMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "popular", label: "Popular", icon: ThumbsUp },
    { id: "newest", label: "Newest", icon: Clock },
  ];

  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg border border-line bg-muted/50 p-0.5", className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = sort === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSort(opt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
              isActive
                ? "bg-card text-ink shadow-2xs font-semibold"
                : "text-ink-muted hover:text-ink hover:bg-card/40"
            )}
            title={`Sort by ${opt.label}`}
          >
            <Icon className={cn("size-3", isActive ? "text-primary" : "text-ink-muted")} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

