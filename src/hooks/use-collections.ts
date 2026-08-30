"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { PaginatedResponse } from "@/types";

export interface SavedSession {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  items: any[];
}

export function useSavedSessions() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["collections", "v2"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<PaginatedResponse<SavedSession>>(`/saved-sessions/?expand=items,items.lesson,items.post,items.problem`, token);
    },
  });
}

export function useAddSavedSessionItem() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ sessionId, postId, lessonId }: { sessionId: string; postId?: string; lessonId?: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      const payload: Record<string, string> = {};
      if (postId) payload.post = postId;
      if (lessonId) payload.lesson = lessonId;

      await apiFetch(`/saved-sessions/${sessionId}/items/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
    },
  });
}
