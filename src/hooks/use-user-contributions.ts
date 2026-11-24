"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { resolveClientAuth } from "@/lib/client-auth";
import type { PaginatedResponse, Solution } from "@/types";

/**
 * Fetches solutions authored by a specific user in a single paginated query.
 */
export function useUserContributions(userId: string) {
  const { getToken, isSignedIn } = useAuth();
  const { isAuthed, getOptionalToken } = resolveClientAuth(isSignedIn, getToken);

  return useQuery<Solution[]>({
    queryKey: ["contributions", userId, isAuthed ? "auth" : "guest"],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const token = await getOptionalToken();
      const qs = buildQueryString({
        author: userId,
        sort: "newest",
        expand: "attachments,author_details,problem_details",
      });
      const res = await apiFetch<PaginatedResponse<Solution>>(`/solutions/${qs}`, token || undefined);
      const solutions = Array.isArray(res) ? res : (res.data ?? []);
      return solutions.map((sol) => ({
        ...sol,
        problem_title: sol.problem_title ?? sol.problem_details?.title,
      }));
    },
  });
}
