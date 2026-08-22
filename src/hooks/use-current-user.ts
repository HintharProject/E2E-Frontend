"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { AppUser } from "@/types/user";
import { fetchCurrentUser } from "@/services/user-service";

/**
 * TanStack Query hook for the currently authenticated user.
 *
 * Fetches from `GET /users/me/` using the Clerk session token.
 * The query is only enabled once a valid token is available.
 *
 * Cold-start handling:
 * - The API client has a 60s timeout.
 * - The query retries twice with backoff.
 * - Consumers should show a skeleton while `isLoading` is true.
 */
export function useCurrentUser() {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<AppUser>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token available");
      return fetchCurrentUser(token);
    },
    enabled: isSignedIn === true,
    staleTime: 5 * 60 * 1000, // User profile rarely changes mid-session
    retry: 2,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
