"use client";

import React, { createContext, useContext, useState } from "react";
import { CommentSortMode } from "@/types";

export type { CommentSortMode };

interface CommentSortContextValue {
  sort: CommentSortMode;
  setSort: (mode: CommentSortMode) => void;
}

const CommentSortContext = createContext<CommentSortContextValue>({
  sort: "popular",
  setSort: () => {},
});

export function CommentSortProvider({
  children,
  initialSort = "popular",
}: {
  children: React.ReactNode;
  initialSort?: CommentSortMode;
}) {
  const [sort, setSort] = useState<CommentSortMode>(initialSort);

  return (
    <CommentSortContext.Provider value={{ sort, setSort }}>
      {children}
    </CommentSortContext.Provider>
  );
}

export function useCommentSort() {
  return useContext(CommentSortContext);
}
