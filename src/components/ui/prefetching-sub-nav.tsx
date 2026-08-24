"use client";

import { useQueryClient } from "@tanstack/react-query";
import { SubNav } from "./sub-nav";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";

interface PrefetchingSubNavProps {
  items: { href: string; label: string; active?: boolean }[];
  mobileExtra?: React.ReactNode;
}

export function PrefetchingSubNav({ items, mobileExtra }: PrefetchingSubNavProps) {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  const handlePrefetch = async (href: string) => {
    if (!isSignedIn) return; // Only logged in users prefetch (can optimize later)
    
    try {
      const token = await getToken();
      if (!token) return;

      if (href === "/forum/announcements") {
        queryClient.prefetchInfiniteQuery({
          queryKey: ["posts", { feed: "announcement" }],
          queryFn: async ({ pageParam = 1 }) => {
            const queryStr = buildQueryString({ feed: "announcement", page: pageParam });
            return apiFetch(`/posts/${queryStr}`, token);
          },
          initialPageParam: 1,
        });
      } else if (href === "/forum/creators") {
        queryClient.prefetchInfiniteQuery({
          queryKey: ["posts", { feed: "creator" }],
          queryFn: async ({ pageParam = 1 }) => {
            const queryStr = buildQueryString({ feed: "creator", page: pageParam });
            return apiFetch(`/posts/${queryStr}`, token);
          },
          initialPageParam: 1,
        });
      } else if (href === "/lessons/manage") {
        // Pre-fetch manage tab lessons (assuming state=draft or something similar is needed, 
        // or just general lessons for the author. Let's prefetch the base lessons feed for now)
        // Also pre-fetch new lesson schema if we had one
        queryClient.prefetchInfiniteQuery({
          queryKey: ["lessons", {}],
          queryFn: async ({ pageParam = 1 }) => {
            const queryStr = buildQueryString({ page: pageParam });
            return apiFetch(`/lessons/${queryStr}`, token);
          },
          initialPageParam: 1,
        });
      }
    } catch (e) {
      console.error("Failed to prefetch", e);
    }
  };

  const itemsWithPrefetch = items.map((item) => ({
    ...item,
    onPrefetch: () => handlePrefetch(item.href),
  }));

  return <SubNav items={itemsWithPrefetch} mobileExtra={mobileExtra} />;
}
