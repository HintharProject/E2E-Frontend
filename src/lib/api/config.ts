/** Normalize API base URL to always include /api/v1. */
export function getApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://127.0.0.1:8000/api/v1";

  const withoutTrailing = raw.replace(/\/+$/, "");
  if (withoutTrailing.endsWith("/api/v1")) {
    return withoutTrailing;
  }
  return `${withoutTrailing}/api/v1`;
}

/** 60s timeout for Render free-tier cold starts (frontend_handoff). */
export const API_TIMEOUT_MS = 60_000;
