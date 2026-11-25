"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { getMutationAuthToken, resolveClientAuth } from "@/lib/client-auth";
import {
  ContentSortMode,
  PaginatedResponse,
  Post,
  PostTypeEnum,
  TimeframeFilter,
} from "@/types";

interface PostQueryParams {
  subject?: string;
  level?: string;
  search?: string;
  type?: string;
  tags?: string;
  feed?: "main" | "announcement" | "creator";
  authorId?: string;
  sort?: ContentSortMode;
  timeframe?: TimeframeFilter;
}

export interface UploadedPostAttachmentPayload {
  file_key: string;
  file_name: string;
  public_url?: string;
}

export interface CreatePostPayload {
  post_type: PostTypeEnum;
  title: string;
  body: string;
  subject?: string | null;
  level?: string | null;
  tags?: string[];
  uploaded_attachment?: UploadedPostAttachmentPayload | null;
}

export interface UpdatePostPayload {
  postId: string;
  post_type?: PostTypeEnum;
  title?: string;
  body?: string;
  subject?: string | null;
  level?: string | null;
  tags?: string[];
  uploaded_attachment?: UploadedPostAttachmentPayload | null;
}

export function useInfinitePosts(params: PostQueryParams = {}) {
  const { getToken, isSignedIn } = useAuth();
  const { isAuthed, getOptionalToken } = resolveClientAuth(isSignedIn, getToken);

  return useInfiniteQuery({
    queryKey: ["posts", params, isAuthed ? "auth" : "guest", "v2"],
    queryFn: async ({ pageParam }) => {
      const token = await getOptionalToken();

      const backendParams = {
        search: params.search,
        subject_id: params.subject,
        level_id: params.level,
        post_type: params.type,
        tags: params.tags,
        feed: params.feed,
        author_id: params.authorId,
        sort: params.sort,
        timeframe: params.timeframe,
        cursor: pageParam,
        limit: pageParam ? 6 : 12,
        expand: "author_details,subject_details,level_details,tags_data",
      };

      const queryStr = buildQueryString(backendParams);
      return apiFetch<PaginatedResponse<Post>>(
        `/posts/${queryStr}`,
        token || undefined
      );
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
  const { getToken, isSignedIn } = useAuth();
  const { isAuthed, getOptionalToken } = resolveClientAuth(isSignedIn, getToken);
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["post", id, isAuthed ? "auth" : "guest", "v2"],
    queryFn: async () => {
      const token = await getOptionalToken();
      return apiFetch<Post>(
        `/posts/${id}/?expand=author_details,subject_details,level_details,tags_data`,
        token || undefined
      );
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    // Seed with data already in the forum feed cache so navigation is instant
    initialData: () => {
      const allPostsQueries = queryClient.getQueriesData<{
        pages: { data: Post[] }[];
      }>({
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

export function useCreatePost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const token = await getMutationAuthToken(getToken);
      if (!token) {
        throw new Error("Authentication required. Please sign in and retry.");
      }
      return apiFetch<Post>("/posts/", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (created?.id) {
        queryClient.invalidateQueries({ queryKey: ["post", created.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["tag-content"] });
    },
  });
}

export function useUpdatePost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, ...payload }: UpdatePostPayload) => {
      const token = await getMutationAuthToken(getToken);
      if (!token) {
        throw new Error("Authentication required. Please sign in and retry.");
      }
      return apiFetch<Post>(`/posts/${postId}/`, token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["tag-content"] });
    },
  });
}

export function useRemovePostAttachment() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const token = await getMutationAuthToken(getToken);
      if (!token) {
        throw new Error("Authentication required. Please sign in and retry.");
      }
      return apiFetch<void>(`/posts/${postId}/attachment/remove/`, token, {
        method: "DELETE",
      });
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
