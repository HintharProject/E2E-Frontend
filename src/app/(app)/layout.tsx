import { Suspense } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { PageSkeleton } from "@/components/layout/page-skeleton";

import { AppInitializer } from "@/components/providers/app-initializer";

/**
 * Layout for all authenticated app routes under the (app) route group.
 *
 * Structure:
 *   AppProviders (QueryClientProvider)
 *     → AppInitializer (blocks until essential data is fetched)
 *     → AppHeader (sticky nav with role-filtered links)
 *     → <main> with Suspense boundary and PageSkeleton fallback
 *     → AppFooter
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppInitializer>
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
        <AppFooter />
      </AppInitializer>
    </AppProviders>
  );
}
