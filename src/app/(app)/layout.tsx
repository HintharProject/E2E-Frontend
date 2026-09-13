import { Suspense } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { AppInitializer } from "@/components/providers/app-initializer";
import { GlobalFAB } from "@/components/ui/fab";
import { RoleGuard } from "@/components/providers/role-guard";

/**
 * Layout for all authenticated app routes under the (app) route group.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppInitializer>
        <RoleGuard>
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
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
