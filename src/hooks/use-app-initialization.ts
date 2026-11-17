"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useUIStore } from "@/lib/store/ui-store";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { fetchCurrentUser } from "@/services/user-service";

export function useAppInitialization() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  
  const isAppInitialized = useUIStore((state) => state.isAppInitialized);
  const setAppInitialized = useUIStore((state) => state.setAppInitialized);
  
  const initStarted = useRef(false);

  useEffect(() => {
    if (isAppInitialized) return;

    // Failsafe timeout: Never let the splash screen hang longer than 1.5s
    const failsafeTimer = setTimeout(() => {
      setAppInitialized(true);
    }, 1500);

    if (!isLoaded) return () => clearTimeout(failsafeTimer);

    const currentUserKey = isSignedIn ? "signed_in" : "guest";

    if (typeof window !== "undefined") {
      const sessionInitialized = sessionStorage.getItem("e2e_session_initialized") === "true";
      const lastSessionUser = sessionStorage.getItem("e2e_session_user");

      if (sessionInitialized && lastSessionUser === currentUserKey) {
        setAppInitialized(true);
        return () => clearTimeout(failsafeTimer);
      }
    }

    if (initStarted.current) return () => clearTimeout(failsafeTimer);
    initStarted.current = true;

    async function initializeApp() {
      try {
        const token = isSignedIn ? await getToken() : null;

        if (isSignedIn && token) {
          await queryClient.prefetchQuery({
            queryKey: ["currentUser", token],
            queryFn: () => fetchCurrentUser(token),
            staleTime: 5 * 60 * 1000,
          }).catch(() => null);

          await queryClient.prefetchQuery({
            queryKey: ["saved-sessions"],
            queryFn: () => apiFetch(`/saved-sessions/`, token),
            staleTime: 5 * 60 * 1000,
          }).catch(() => null);
        }

        await queryClient.prefetchInfiniteQuery({
          queryKey: ["posts", {}, isSignedIn ? "auth" : "guest", "v2"],
          queryFn: async ({ pageParam }) => {
            const queryStr = buildQueryString({
              cursor: pageParam,
              limit: 12,
              expand: "author_details,subject_details,level_details,tags_data",
            });
            return apiFetch(`/posts/${queryStr}`, token || undefined);
          },
          initialPageParam: undefined as string | undefined,
        }).catch(() => null);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("e2e_session_initialized", "true");
          sessionStorage.setItem("e2e_session_user", currentUserKey);
        }
        setAppInitialized(true);
        clearTimeout(failsafeTimer);
      }
    }

    initializeApp();

    return () => clearTimeout(failsafeTimer);
  }, [isLoaded, isSignedIn, getToken, queryClient, isAppInitialized, setAppInitialized]);

  return { isAppInitialized };
}
