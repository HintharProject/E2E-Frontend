"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { setupCacheManager } from "@/lib/store/cache-manager";
import { AuthGateProvider } from "@/components/features/auth/auth-gate-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 15 * 60 * 1000, // 15 minutes
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            const status = (error as { status?: number } | null)?.status;
            // Fail fast on 4xx client/auth/not-found errors.
            if (typeof status === "number" && status >= 400 && status < 500) {
              return false;
            }
            // Retry up to 2 times for transient network, timeout (status 0), or 5xx cold-start responses.
            return failureCount < 2;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        },
      },
    });
    
    // Initialize our custom cache manager to enforce item limits
    setupCacheManager(client);
    
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGateProvider>{children}</AuthGateProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
