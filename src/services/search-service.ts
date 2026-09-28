import { apiFetch } from "./api-client";
import { UnifiedSearchResponse, SearchCategoryFilter } from "@/types";

export interface UnifiedSearchParams {
  q: string;
  limit?: number;
  type?: SearchCategoryFilter;
  subject?: string;
  level?: string;
  sort?: "relevance" | "popular" | "newest";
}

/**
 * Safely unwrap API payloads when the Django backend nests responses in { data: ... }.
 */
function unwrapData<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * Unified search query across posts, problems, lessons, and past papers.
 */
export async function unifiedSearch(
  params: UnifiedSearchParams,
  token?: string | null
): Promise<UnifiedSearchResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set("q", params.q.trim());

  if (params.limit) {
    queryParams.set("limit", String(params.limit));
  }
  if (params.type && params.type !== "all") {
    queryParams.set("type", params.type);
  }
  if (params.subject) {
    queryParams.set("subject", params.subject);
  }
  if (params.level) {
    queryParams.set("level", params.level);
  }
  if (params.sort && params.sort !== "relevance") {
    queryParams.set("sort", params.sort);
  }

  const res = await apiFetch<unknown>(`/search/?${queryParams.toString()}`, token);
  return unwrapData<UnifiedSearchResponse>(res);
}
