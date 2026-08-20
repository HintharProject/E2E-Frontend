"use client";

import { useAuthSource } from "@/components/user-provider";

export function ApiStatusBanner() {
  const source = useAuthSource();

  if (source !== "clerk-fallback") {
    return null;
  }

  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">
      Backend API is unreachable — you are signed in via Clerk only (default
      Student role). Forum/lesson content may still use mock data. Check{" "}
      <code className="rounded bg-white/60 px-1">NEXT_PUBLIC_API_BASE_URL</code>{" "}
      or wait for Render to wake up, then refresh.
    </div>
  );
}
