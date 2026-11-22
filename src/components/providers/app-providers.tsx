"use client";

import { SavedCollectionsProvider } from "./saved-collections-provider";

/**
 * Composes all client-side providers needed inside the (app) and (workspace) layouts.
 * (QueryProvider and ThemeProvider are handled at the RootLayout.)
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SavedCollectionsProvider>{children}</SavedCollectionsProvider>;
}
