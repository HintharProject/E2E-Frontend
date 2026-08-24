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
  const setInitializationMessage = useUIStore((state) => state.setInitializationMessage);
  
  const initStarted = useRef(false);

  useEffect(() => {
    // Only run when Clerk auth has loaded (so we definitively know if user is signed in)
    if (!isLoaded || isAppInitialized || initStarted.current) return;
    
    initStarted.current = true;

    async function initializeApp() {
      try {
        setInitializationMessage("Starting up the render backend...");
        const token = isSignedIn ? await getToken() : null;

        // 1. Fetch User Profile & Admin data if logged in
        if (isSignedIn && token) {
          setInitializationMessage("Fetching user profile...");
          const user = await queryClient.fetchQuery({
            queryKey: ["currentUser"],
            queryFn: () => fetchCurrentUser(token),
            staleTime: 5 * 60 * 1000,
          });

          // Fetch collections/study plans
          setInitializationMessage("Loading study plans...");
          await queryClient.prefetchQuery({
            queryKey: ["saved-sessions"],
            queryFn: () => apiFetch(`/saved-sessions/`, token),
            staleTime: 5 * 60 * 1000,
          });

          // If admin, we could fetch admin dashboard data here (example placeholder)
          // if (user.role === 'admin') {
          //   setInitializationMessage("Loading admin panel...");
          //   await queryClient.prefetchQuery({ ... })
          // }
        }

        // 2. Fetch Forum Feed (Main)
        setInitializationMessage("Fetching forum posts...");
        await queryClient.prefetchInfiniteQuery({
          queryKey: ["posts", {}],
          queryFn: async ({ pageParam = 1 }) => {
            const queryStr = buildQueryString({ page: pageParam });
            return apiFetch(`/posts/${queryStr}`, token || undefined);
          },
          initialPageParam: 1,
        });

        // 3. Fetch Lessons Feed
        setInitializationMessage("Fetching lessons...");
        await queryClient.prefetchInfiniteQuery({
          queryKey: ["lessons", {}],
          queryFn: async ({ pageParam = 1 }) => {
            const queryStr = buildQueryString({ page: pageParam });
            return apiFetch(`/lessons/${queryStr}`, token || undefined);
          },
          initialPageParam: 1,
        });

        setInitializationMessage("Finalizing setup...");
        
        // Wait a tiny bit for UI to settle
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setAppInitialized(true);
      }
    }

    initializeApp();
  }, [isLoaded, isSignedIn, getToken, queryClient, isAppInitialized, setAppInitialized, setInitializationMessage]);

  return { isAppInitialized };
}
