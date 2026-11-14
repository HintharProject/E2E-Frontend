"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/lib/store/ui-store";

export function InitialLoadingScreen() {
  const isAppInitialized = useUIStore((state) => state.isAppInitialized);
  const initializationMessage = useUIStore((state) => state.initializationMessage);
  const [isColdStartWait, setIsColdStartWait] = useState(false);

  useEffect(() => {
    if (isAppInitialized) return;
    const timer = setTimeout(() => setIsColdStartWait(true), 3000);
    return () => {
      clearTimeout(timer);
      setIsColdStartWait(false);
    };
  }, [isAppInitialized]);

  if (isAppInitialized) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          E2E
        </h1>

        <div className="flex w-full flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-muted-foreground">
            {isColdStartWait
              ? "Waking up the server (this may take up to 30 seconds on cold start)..."
              : initializationMessage}
          </p>
          <div
            role="progressbar"
            aria-label="Initializing application"
            className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full w-1/2 rounded-full bg-primary/75 animate-cold-start-bar" />
          </div>
          <p className="mt-1 text-base font-medium text-foreground">
            Education to Everyone
          </p>
        </div>
      </div>
    </div>
  );
}
