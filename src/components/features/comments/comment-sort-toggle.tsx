"use client";

import React from "react";
import { ThumbsUp, Clock } from "lucide-react";
import { SortToggle, SortToggleOption } from "@/components/ui/sort-toggle";
import { useCommentSort, CommentSortMode } from "./comment-sort-context";

const COMMENT_SORT_OPTIONS: readonly SortToggleOption<CommentSortMode>[] = [
  { id: "popular", label: "Popular", icon: ThumbsUp, title: "Sort by Popular" },
  { id: "newest", label: "Newest", icon: Clock, title: "Sort by Newest" },
];

export function CommentSortToggle({ className }: { className?: string }) {
  const { sort, setSort } = useCommentSort();

  return (
    <SortToggle
      aria-label="Sort comments"
      value={sort}
      onChange={setSort}
      options={COMMENT_SORT_OPTIONS}
      className={className}
    />
  );
}
