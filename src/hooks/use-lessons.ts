"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { PaginatedResponse, Lesson } from "@/types";

interface LessonQueryParams {
  subject?: string;
  level?: string;
  search?: string;
  authorId?: string;
}

export function useInfiniteLessons(params: LessonQueryParams = {}) {
  const { getToken } = useAuth();

  return useInfiniteQuery({
    queryKey: ["lessons", params],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const queryStr = buildQueryString({ 
        ...params, 
        author_id: params.authorId,
        page: pageParam 
      });
      return apiFetch<PaginatedResponse<Lesson>>(`/lessons/${queryStr}`, token);
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

export function useLesson(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return apiFetch<Lesson>(`/lessons/${id}/`, token);
    },
    enabled: !!id,
  });
}
