"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { setupCacheManager } from "@/lib/store/cache-manager";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 15 * 60 * 1000, // 15 minutes
          refetchOnWindowFocus: false,
          retry: 1, // Retry once for transient errors
        },
      },
    });
    
    // Initialize our custom cache manager to enforce item limits
    setupCacheManager(client);
    
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
