"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { PaginatedResponse, Post } from "@/types";

interface PostQueryParams {
  subject?: string;
  level?: string;
  search?: string;
  type?: string;
  tags?: string;
  feed?: 'main' | 'announcement' | 'creator';
  authorId?: string;
}

export function useInfinitePosts(params: PostQueryParams = {}) {
  const { getToken } = useAuth();

  return useInfiniteQuery({
    queryKey: ["posts", params, "v2"],
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const backendParams = {
        search: params.search,
        subject_id: params.subject,
        level_id: params.level,
        post_type: params.type,
        tags: params.tags,
        feed: params.feed,
        author_id: params.authorId,
        cursor: pageParam,
        limit: pageParam ? 6 : 12,
        expand: "author_details,subject_details,level_details,tags_data",
      };

      const queryStr = buildQueryString(backendParams);
      return apiFetch<PaginatedResponse<Post>>(`/posts/${queryStr}`, token);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.next) {
        try {
          const url = new URL(lastPage.meta.next);
          return url.searchParams.get("cursor") || undefined;
        } catch {
          // If for some reason it's a relative URL
          const match = lastPage.meta.next.match(/[?&]cursor=([^&]+)/);
          return match ? match[1] : undefined;
        }
      }
      return undefined;
    },
    initialPageParam: undefined as string | undefined,
  });
}

export function usePost(id: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["post", id, "v2"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return apiFetch<Post>(`/posts/${id}/?expand=author_details,subject_details,level_details,tags_data`, token);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    // Seed with data already in the forum feed cache so navigation is instant
    initialData: () => {
      const allPostsQueries = queryClient.getQueriesData<{ pages: { data: Post[] }[] }>({
        queryKey: ["posts"],
      });
      for (const [, data] of allPostsQueries) {
        if (!data?.pages) continue;
        for (const page of data.pages) {
          const found = page.data?.find((p) => p.id === id);
          if (found) return found;
        }
      }
      return undefined;
    },
  });
}
