"use client";

import { useInfiniteQuery, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { PaginatedResponse, Lesson } from "@/types";

interface LessonQueryParams {
  subject?: string;
  level?: string;
  search?: string;
  authorId?: string;
  state?: string;
  tags?: string;
}

export function useInfiniteLessons(params: LessonQueryParams = {}) {
  const { getToken } = useAuth();

  return useInfiniteQuery({
    queryKey: ["lessons", params, "v2"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const backendParams = {
        search: params.search,
        subject_id: params.subject,
        level_id: params.level,
        state: params.state,
        tags: params.tags,
        author_id: params.authorId,
        page: pageParam,
        expand: "author_details,attachments",
      };

      const queryStr = buildQueryString(backendParams);
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
    queryKey: ["lesson", id, "v2"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return apiFetch<Lesson>(`/lessons/${id}/?expand=author_details,attachments`, token);
    },
    enabled: !!id,
  });
}

