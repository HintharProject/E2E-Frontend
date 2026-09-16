"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

export default function TrainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log error to monitoring service
    console.error("Train! Workspace Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen p-6 bg-background text-center space-y-4 select-none">
      <div className="size-14 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive">
        <AlertTriangle className="size-7" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h2 className="text-xl font-bold text-ink">Unable to Load Practice Workspace</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {error.message ||
            "An unexpected error occurred while initializing the practice environment. Please retry or return to the paper catalog."}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-1.5 font-semibold text-xs border-line hover:bg-muted"
        >
          <RotateCcw className="size-3.5" />
          <span>Retry Loading</span>
        </Button>

        <Link
          href="/resources"
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "gap-1.5 font-semibold text-xs bg-primary text-primary-foreground",
          })}
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Resources</span>
        </Link>
      </div>
    </div>
  );
}
