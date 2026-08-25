"use client";

import { ThemeProvider } from "./theme-provider";

/**
 * Composes all client-side providers needed inside the (app) layout.
 * Currently wraps ThemeProvider. (QueryProvider is handled at the RootLayout).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
