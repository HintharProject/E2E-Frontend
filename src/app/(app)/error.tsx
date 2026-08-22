"use client";

import { Button } from "@/components/ui/button";

/**
 * Error boundary for the (app) route group.
 * Provides cold-start-aware messaging and retry functionality.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isTimeout =
    error.message?.includes("timeout") ||
    error.message?.includes("cold start") ||
    error.message?.includes("took too long");

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-heading text-2xl text-foreground">
        {isTimeout ? "Server is waking up" : "Something went wrong"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {isTimeout
          ? "The backend on Render may take up to a minute to respond after idle time. Please wait and try again."
          : error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <a
          href="/forum"
          className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-secondary px-2 text-xs/relaxed font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Go to Forum
        </a>
      </div>
    </div>
  );
}
