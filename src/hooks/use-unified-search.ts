"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { unifiedSearch } from "@/services/search-service";
import { SearchCategoryFilter, UnifiedSearchResponse } from "@/types";

export interface UseUnifiedSearchOptions {
  query: string;
  limit?: number;
  type?: SearchCategoryFilter;
  subject?: string;
  level?: string;
  sort?: "relevance" | "popular" | "newest";
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * Hook for debouncing any value.
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Unified Search hook across Posts, Problems, Lessons, and Past Papers.
 * Includes 250ms debouncing and 30s cache staleTime.
 */
export function useUnifiedSearch({
  query,
  limit = 4,
  type = "all",
  subject,
  level,
  sort = "relevance",
  debounceMs = 250,
  enabled = true,
}: UseUnifiedSearchOptions) {
  const { getToken } = useAuth();
  const debouncedQuery = useDebounce(query, debounceMs);
  const trimmed = debouncedQuery.trim();
  const isQueryValid = trimmed.length >= 2;

  const queryResult = useQuery<UnifiedSearchResponse>({
    queryKey: ["unified-search", { q: trimmed, limit, type, subject, level, sort }],
    queryFn: async () => {
      const token = await getToken();
      return unifiedSearch(
        {
          q: trimmed,
          limit,
          type,
          subject,
          level,
          sort,
        },
        token
      );
    },
    enabled: enabled && isQueryValid,
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  return {
    ...queryResult,
    debouncedQuery,
    isQueryValid,
  };
}
