"use client";

import { useAppInitialization } from "@/hooks/use-app-initialization";
import { InitialLoadingScreen } from "@/components/layout/initial-loading-screen";

/**
 * Client component to handle global app initialization fetching and display the loading screen.
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  useAppInitialization();

  return (
    <>
      <InitialLoadingScreen />
      {children}
    </>
  );
}
