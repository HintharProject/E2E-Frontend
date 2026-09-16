"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { AppUser } from "@/types/user";
import { fetchCurrentUser } from "@/services/user-service";
import { useState, useEffect } from "react";

/**
 * TanStack Query hook for the currently authenticated user.
 *
 * Fetches from `GET /users/me/` using the Clerk session token.
 * In development with NEXT_PUBLIC_ALLOW_DEV_LOGIN=true, supports dev_token bypass.
 */
export function useCurrentUser() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [devToken, setDevToken] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true") {
      setDevToken(localStorage.getItem("dev_token"));
    }
  }, []);

  const isDevLoginEnabled = process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true";
  const activeDevToken = isDevLoginEnabled ? devToken : null;

  const query = useQuery<AppUser>({
    queryKey: ["currentUser", activeDevToken],
    queryFn: async () => {
      const token = await getToken();
      const activeToken = token || activeDevToken;
      if (!activeToken) throw new Error("No auth token available");
      return fetchCurrentUser(activeToken);
    },
    enabled: isSignedIn === true || !!activeDevToken,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    user: query.data ?? null,
    isLoading: !isLoaded || query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

