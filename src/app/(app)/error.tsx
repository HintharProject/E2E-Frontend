"use client";

import {
  isApiColdStartError,
  isApiTimeoutError,
} from "@/lib/api/errors";
import { Button } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isTimeout = isApiTimeoutError(error);
  const isColdStart = isApiColdStartError(error);

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-2xl text-ink">
        {isTimeout || isColdStart
          ? "Server is waking up"
          : "Something went wrong"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        {isTimeout || isColdStart
          ? "The backend on Render may take up to a minute to respond after idle time. Please wait and try again."
          : error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6 flex gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button href="/forum" variant="secondary">
          Go to Forum
        </Button>
      </div>
    </div>
  );
}
