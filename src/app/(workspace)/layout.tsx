import React, { Suspense } from "react";
import { AppProviders } from "@/components/providers/app-providers";
import { AppInitializer } from "@/components/providers/app-initializer";
import { RoleGuard } from "@/components/providers/role-guard";
import { PageSkeleton } from "@/components/layout/page-skeleton";

/**
 * Dedicated isolated workspace layout.
 * Occupies 100% of viewport width and height without platform headers/footers.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <AppInitializer>
        <RoleGuard>
          <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground select-none">
            <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
          </div>
        </RoleGuard>
      </AppInitializer>
    </AppProviders>
  );
}
