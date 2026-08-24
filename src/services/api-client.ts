import { API_BASE_URL, API_TIMEOUT_MS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Authenticated API Client
// Per AGENTS.md §2: All backend API calls must be defined in src/services/.
// Per AGENTS.md §3: Authorization: Bearer <Clerk_JWT> on every request.
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Authenticated fetch wrapper for the E2E backend API.
 *
 * - Attaches `Authorization: Bearer <token>` header.
 * - Enforces a 60s timeout to handle 30-50s Render cold starts.
 * - Parses standard error format: `{ error: { code, message, details } }`.
 */
export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const url = `${API_BASE_URL}${path}`;
    const headers = new Headers(options?.headers);

    // If body is FormData, fetch will automatically set Content-Type with the correct boundary.
    if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let finalToken = token;
    
    // Dev-only token bypass
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true") {
      const devToken = localStorage.getItem("dev_token");
      if (devToken) {
        finalToken = devToken;
      }
    }

    if (finalToken) {
      headers.set("Authorization", `Bearer ${finalToken}`);
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      let errorBody: {
        error?: { code?: string; message?: string; details?: Record<string, string[]> };
      } = {};
      try {
        errorBody = await response.json();
      } catch {
        // Response body wasn't JSON — fall through to generic error
      }

      throw new ApiError(
        response.status,
        errorBody.error?.code ?? "UNKNOWN_ERROR",
        errorBody.error?.message ?? `Request failed with status ${response.status}`,
        errorBody.error?.details
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const json = await response.json();
    
    // The backend CustomJSONRenderer wraps single objects in `{ "data": ... }`
    // but paginated lists have `{ "data": [...], "meta": {...} }`.
    // We unwrap it globally here for single objects so hooks don't have to deal with it.
    if (json && typeof json === 'object' && 'data' in json && !('meta' in json)) {
      return json.data as T;
    }
    
    return json as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        0,
        "TIMEOUT",
        "The server took too long to respond. It may be waking up from a cold start — please try again in a moment."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Utility to build query strings from an object, filtering out null/undefined.
 */
export function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
