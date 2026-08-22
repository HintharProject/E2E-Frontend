"use client";

import { QueryProvider } from "./query-provider";

/**
 * Composes all client-side providers needed inside the (app) layout.
 * Currently wraps QueryClientProvider. Future providers (e.g. additional
 * Zustand context if needed) can be added here.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
