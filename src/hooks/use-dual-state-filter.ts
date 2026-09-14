"use client";

import { useRef, useMemo } from "react";

export interface DualStateFilterOptions<T> {
  /** The current array of items returned by the server query (or undefined if still loading initial page) */
  items: T[] | undefined;
  /** True when TanStack Query is actively fetching or refetching */
  isFetching: boolean;
  /** Synchronous predicate to filter cached items locally */
  filterPredicate: (item: T) => boolean;
  /** Serialized key of active filters (e.g., JSON or query string) */
  activeFiltersKey: string;
}

export interface DualStateFilterResult<T> {
  /** The items to display (optimistic client slice while loading, authoritative server data once resolved) */
  displayItems: T[];
  /** True when currently displaying optimistic client-filtered data while server fetches */
  isOptimistic: boolean;
  /** True when background server fetch is in flight */
  isServerFetching: boolean;
  /**
   * True when local filter has 0 matches in cache, but the server is still fetching.
   * Consumers should render a skeleton loader instead of a premature "Nothing found" empty state.
   */
  isEmptyPending: boolean;
}

/**
 * useDualStateFilter
 *
 * Implements two-stage optimistic filtering:
 * 1. Stage 1 (Instant Local): When filters change, instantly filter cached memory items so the user
 *    sees matching cards at 0ms latency without jarring whiteouts or layout shifts.
 * 2. Stage 2 (Authoritative Server): Once the server responds, cleanly replace the optimistic list
 *    with the server's authoritative, paginated results.
 */
export function useDualStateFilter<T>({
  items,
  isFetching,
  filterPredicate,
  activeFiltersKey,
}: DualStateFilterOptions<T>): DualStateFilterResult<T> {
  const previousItemsRef = useRef<T[]>([]);
  const resolvedFilterKeyRef = useRef<string>(activeFiltersKey);

  // When server finishes fetching, update our cached baseline
  if (!isFetching && items) {
    previousItemsRef.current = items;
    resolvedFilterKeyRef.current = activeFiltersKey;
  }

  const isFilterStale = activeFiltersKey !== resolvedFilterKeyRef.current;

  return useMemo(() => {
    // If the server query is currently fetching for a new filter state:
    if (isFetching && isFilterStale) {
      const localMatches = previousItemsRef.current.filter(filterPredicate);

      if (localMatches.length > 0) {
        return {
          displayItems: localMatches,
          isOptimistic: true,
          isServerFetching: true,
          isEmptyPending: false,
        };
      }

      // 0 local matches while server is in-flight -> show loading skeleton rather than empty banner
      return {
        displayItems: [],
        isOptimistic: true,
        isServerFetching: true,
        isEmptyPending: true,
      };
    }

    // Server has returned or is current
    const currentItems = items ?? [];
    return {
      displayItems: currentItems,
      isOptimistic: false,
      isServerFetching: isFetching,
      isEmptyPending: false,
    };
  }, [items, isFetching, isFilterStale, filterPredicate]);
}
