"use client";

import React from "react";
import { ThumbsUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommentSort, CommentSortMode } from "./comment-sort-context";

export function CommentSortToggle({ className }: { className?: string }) {
  const { sort, setSort } = useCommentSort();

  const options: {
    id: CommentSortMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "popular", label: "Popular", icon: ThumbsUp },
    { id: "newest", label: "Newest", icon: Clock },
  ];

  return (
    <div
      role="group"
      aria-label="Sort comments"
      className={cn("cm-sort-group", className)}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = sort === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSort(opt.id)}
            data-active={isActive ? "true" : "false"}
            aria-pressed={isActive}
            className="cm-sort-btn"
            title={`Sort by ${opt.label}`}
          >
            <Icon className="cm-sort-icon size-3.5" aria-hidden="true" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
