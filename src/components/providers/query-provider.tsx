"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

/**
 * TanStack Query provider.
 *
 * - staleTime: 5 minutes — data is considered fresh within the session.
 *   Navigating between pages won't re-fetch data the user has already seen.
 * - gcTime: 15 minutes — keep cached data alive even after components unmount,
 *   so returning to a page always shows instant results while refetching in background.
 * - retry: 2 attempts with exponential backoff.
 * - refetchOnWindowFocus: false — no surprise re-fetches when switching tabs.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // 5 minutes
            gcTime: 15 * 60 * 1000,     // 15 minutes
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
