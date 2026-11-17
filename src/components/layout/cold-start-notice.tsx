"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColdStartNoticeProps {
  /** Milliseconds before showing the slow-load feedback banner. */
  delayMs?: number;
  className?: string;
}

/**
 * Contextual feedback banner shown when an initial query exceeds 3 seconds.
 */
export function ColdStartNotice({ delayMs = 3000, className }: ColdStartNoticeProps) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (delayMs <= 0) return;
    const timer = setTimeout(() => setIsSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (delayMs > 0 && !isSlow) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "w-full rounded-xl border border-border bg-card px-4 py-3 shadow-card animate-in fade-in duration-200",
        className
      )}
    >
      <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
        <Loader2 className="size-4 shrink-0 animate-loader-spin text-primary" aria-hidden="true" />
        <span>
          Still loading data — this may take a moment.
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Loading progress"
        aria-valuetext="Loading data"
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full w-1/2 rounded-full bg-primary/70 animate-cold-start-bar" />
      </div>
    </div>
  );
}

