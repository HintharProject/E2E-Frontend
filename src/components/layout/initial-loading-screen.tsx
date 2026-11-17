"use client";

import { memo, useEffect, useState } from "react";
import { useUIStore } from "@/lib/store/ui-store";

/**
 * Isolated GPU-composited circular spinner so parent state updates
 * never interrupt or reset its animation timeline.
 */
const CircularLoader = memo(function CircularLoader() {
  return (
    <div className="relative flex size-11 shrink-0 items-center justify-center" aria-hidden="true">
      <svg
        viewBox="0 0 40 40"
        className="size-11 animate-loader-spin text-primary"
        fill="none"
        focusable="false"
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3.25"
          className="opacity-20"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeDasharray="72 101"
        />
      </svg>
    </div>
  );
});

function LoadingOverlay() {
  const initializationMessage = useUIStore((state) => state.initializationMessage);
  const [isExtendedWait, setIsExtendedWait] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsExtendedWait(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const statusText = isExtendedWait
    ? "Still loading — thanks for your patience."
    : initializationMessage;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] isolate flex flex-col items-center justify-center bg-background"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            E2E
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Education to Everyone
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <CircularLoader />
          <p className="flex min-h-10 items-center justify-center text-sm font-medium text-muted-foreground">
            {statusText}
          </p>
          <div
            role="progressbar"
            aria-label="Loading progress"
            className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full w-1/2 rounded-full bg-primary/75 animate-cold-start-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function InitialLoadingScreen() {
  const isAppInitialized = useUIStore((state) => state.isAppInitialized);

  if (isAppInitialized) {
    return null;
  }

  return <LoadingOverlay />;
}
