import { Suspense } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { AppFooter } from "@/components/layout/app-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { AppInitializer } from "@/components/providers/app-initializer";
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
          <CommandPalette />
          <div className="flex min-h-dvh w-full bg-background">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
              <AppTopBar />
              <main
                id="main-content"
                className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 md:pb-8 sm:px-6 lg:px-8"
              >
                <Suspense fallback={<PageSkeleton />}>
                  {children}
                </Suspense>
              </main>
              <AppFooter />
            </div>
          </div>
          <MobileBottomNav />
        </RoleGuard>
      </AppInitializer>
    </AppProviders>
  );
}
