import { Suspense } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { AppInitializer } from "@/components/providers/app-initializer";
import { GlobalFAB } from "@/components/ui/fab";
import { RoleGuard } from "@/components/providers/role-guard";
import { CommandPalette } from "@/components/features/search/command-palette";

/**
 * Layout for all authenticated app routes under the (app) route group.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppInitializer>
        <RoleGuard>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-modal focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Skip to main content
          </a>
          <AppHeader />
          <CommandPalette />
          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 py-6 sm:px-6">
            <Suspense fallback={<PageSkeleton />}>
              {children}
            </Suspense>
          </main>
          <GlobalFAB />
          <AppFooter />
        </RoleGuard>
      </AppInitializer>
    </AppProviders>
  );
}
