import { QueryClient, Query } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Cache Manager for React Query
// Enforces strict item limits for lists and detail views to prevent memory bloat.
// ---------------------------------------------------------------------------

const MAX_LIST_QUERIES = 35;
const MAX_DETAIL_QUERIES = 10;

export function setupCacheManager(queryClient: QueryClient) {
  const queryCache = queryClient.getQueryCache();

  // We subscribe to the cache directly to monitor when new queries are added or updated.
  queryCache.subscribe((event) => {
    // Only process when a new query is added or updated (successful fetch)
    if (event.type !== "added" && event.type !== "updated") {
      return;
    }

    const allQueries = queryCache.getAll();
    
    // Categorize queries based on their query keys
    const listQueries: Query[] = [];
    const detailQueries: Query[] = [];

    allQueries.forEach((query) => {
      const key = query.queryKey[0];
      if (key === "posts" || key === "lessons") {
        listQueries.push(query);
      } else if (key === "post" || key === "lesson") {
        detailQueries.push(query);
      }
    });

    // Enforce List Limit
    if (listQueries.length > MAX_LIST_QUERIES) {
      // Sort by dataUpdatedAt (oldest first)
      listQueries.sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt);
      const toRemove = listQueries.length - MAX_LIST_QUERIES;
      for (let i = 0; i < toRemove; i++) {
        queryClient.removeQueries({ queryKey: listQueries[i].queryKey, exact: true });
      }
    }

    // Enforce Detail Limit
    if (detailQueries.length > MAX_DETAIL_QUERIES) {
      // Sort by dataUpdatedAt (oldest first)
      detailQueries.sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt);
      const toRemove = detailQueries.length - MAX_DETAIL_QUERIES;
      for (let i = 0; i < toRemove; i++) {
        queryClient.removeQueries({ queryKey: detailQueries[i].queryKey, exact: true });
      }
    }
  });
}
