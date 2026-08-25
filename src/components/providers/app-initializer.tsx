"use client";

import { useAppInitialization } from "@/hooks/use-app-initialization";
import { InitialLoadingScreen } from "@/components/layout/initial-loading-screen";

/**
 * Client component to handle global app initialization fetching and display the loading screen.
 * It wraps the children, blocking rendering until initialization completes.
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAppInitialized } = useAppInitialization();

  return (
    <>
      <InitialLoadingScreen />
      {/* Hide the main content visually if not initialized to prevent flashes, 
          but allow React to start rendering it if possible, though it's better to block.
          Actually, blocking it ensures we don't trigger cascading fetches before the batch is ready. */}
      {isAppInitialized && children}
    </>
  );
}
