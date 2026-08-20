import "server-only";
import { API_TIMEOUT_MS, getApiBaseUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";

export { ApiError } from "@/lib/api/errors";

type ApiFetchOptions = RequestInit & {
  token?: string | null;
  timeoutMs?: number;
  retries?: number;
};

function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status >= 500 || err.status === 408 || err.code === "TIMEOUT";
  }
  if (err instanceof Error) {
    if (err.name === "AbortError") return true;
    const cause = err.cause as { code?: string } | undefined;
    if (cause?.code === "UND_ERR_CONNECT_TIMEOUT") return true;
    if (err.message.includes("fetch failed")) return true;
  }
  return false;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T>(
  path: string,
  {
    token,
    timeoutMs = API_TIMEOUT_MS,
    retries = 2,
    ...init
  }: ApiFetchOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        let code: string | undefined;
        let message = res.statusText;
        let details: Record<string, string[]> | undefined;

        try {
          const body = (await res.json()) as {
            error?: {
              code?: string;
              message?: string;
              details?: Record<string, string[]>;
            };
            detail?: string;
          };
          code = body.error?.code;
          message = body.error?.message ?? body.detail ?? message;
          details = body.error?.details;
        } catch {
          // non-JSON error body
        }

        const apiErr = new ApiError(message, res.status, code, details);
        if (isRetryable(apiErr) && attempt < retries) {
          lastError = apiErr;
          await wait(3000 * (attempt + 1));
          continue;
        }
        throw apiErr;
      }

      if (res.status === 204) {
        return undefined as T;
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new ApiError(
          "The server is taking too long to respond. It may be waking up on Render — please try again.",
          408,
          "TIMEOUT",
        );
      }
      if (isRetryable(lastError) && attempt < retries) {
        await wait(3000 * (attempt + 1));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

export async function isApiReachable(): Promise<boolean> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/subjects/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
