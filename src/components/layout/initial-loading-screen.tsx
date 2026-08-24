"use client";

import { useUIStore } from "@/lib/store/ui-store";

export function InitialLoadingScreen() {
  const isAppInitialized = useUIStore((state) => state.isAppInitialized);
  const initializationMessage = useUIStore((state) => state.initializationMessage);

  if (isAppInitialized) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          E2E
        </h1>
        
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {initializationMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
