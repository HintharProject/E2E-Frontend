"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { AppUser } from "@/types/user";
import { fetchCurrentUser } from "@/services/user-service";
import { useState, useEffect } from "react";
import { getValidDevToken } from "@/lib/dev-auth";

/**
 * TanStack Query hook for the currently authenticated user.
 *
 * Fetches from `GET /users/me/` using the session token / dev token.
 */
export function useCurrentUser() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [devToken, setDevToken] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const raw = localStorage.getItem("dev_token");
    setDevToken(getValidDevToken(raw));
  }, []);

  const query = useQuery<AppUser>({
    queryKey: ["currentUser", devToken],
    queryFn: async () => {
      const token = await getToken();
      const valid = getValidDevToken(token || devToken);
      return fetchCurrentUser(valid);
    },
    enabled: isSignedIn === true || !!devToken,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    user: query.data ?? null,
    isLoading: !isLoaded || query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
