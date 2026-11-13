"use client";

import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColdStartNoticeProps {
  /** Milliseconds before showing the Render cold-start wake-up message. */
  delayMs?: number;
  className?: string;
}

/**
 * Contextual feedback banner shown when an initial query exceeds 3 seconds
 * (e.g., Render free-tier 30-50s server wake-up).
 */
export function ColdStartNotice({ delayMs = 3000, className }: ColdStartNoticeProps) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (delayMs <= 0) return;
    const timer = setTimeout(() => setIsSlow(true), delayMs);
    return () => {
      clearTimeout(timer);
      setIsSlow(false);
    };
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
        <Server className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Waking up the server (this may take up to 30 seconds on cold start)...
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Connecting to server"
        aria-valuetext="Waking up server"
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full w-1/2 rounded-full bg-primary/70 animate-cold-start-bar" />
      </div>
    </div>
  );
}

