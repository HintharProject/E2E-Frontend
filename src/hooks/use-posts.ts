"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { PaginatedResponse, Post } from "@/types";

interface PostQueryParams {
  subject?: string;
  level?: string;
  search?: string;
  type?: string;
  tags?: string;
}

export function useInfinitePosts(params: PostQueryParams = {}) {
  const { getToken } = useAuth();

  return useInfiniteQuery({
    queryKey: ["posts", params],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const queryStr = buildQueryString({ ...params, page: pageParam });
      return apiFetch<PaginatedResponse<Post>>(`/posts/${queryStr}`, token);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.meta.next) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

export function usePost(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return apiFetch<Post>(`/posts/${id}/`, token);
    },
    enabled: !!id,
  });
}
