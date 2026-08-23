import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { useAuth } from "@clerk/nextjs";
import { PaginatedResponse, Comment } from "@/types";

export function useTopLevelComments(postId: string) {
  const { getToken } = useAuth();
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const qs = buildQueryString({ page: pageParam });
      return apiFetch<PaginatedResponse<Comment>>(`/posts/${postId}/comments/${qs}`, token);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.meta?.next) return allPages.length + 1;
      return undefined;
    },
  });
}

export function useReplies(parentId: string) {
  const { getToken } = useAuth();
  return useInfiniteQuery({
    queryKey: ["replies", parentId],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const qs = buildQueryString({ page: pageParam });
      return apiFetch<PaginatedResponse<Comment>>(`/comments/${parentId}/replies/${qs}`, token);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.meta?.next) return allPages.length + 1;
      return undefined;
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, body, parentId }: { postId: string; body: string; parentId?: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      if (!postId) throw new Error("postId is required to create a comment");
      
      const payload: Record<string, any> = { body };
      if (parentId) payload.parent_comment = parentId;

      return apiFetch<Comment>(`/posts/${postId}/comments/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ["replies", variables.parentId] });
      }
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Comment>(`/comments/${commentId}/`, token, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
    },
    onSettled: () => {
      // Invalidate both comments and replies since we don't know the exact parent structure here easily
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      await apiFetch(`/comments/${commentId}/`, token, { method: "DELETE" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
  });
}
