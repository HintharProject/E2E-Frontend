"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { getMutationAuthToken, resolveClientAuth } from "@/lib/client-auth";
import {
  PaginatedResponse,
  Lesson,
  ContentSortMode,
  TimeframeFilter,
} from "@/types";

interface LessonQueryParams {
  subject?: string;
  level?: string;
  search?: string;
  authorId?: string;
  state?: string;
  tags?: string;
  sort?: ContentSortMode;
  timeframe?: TimeframeFilter;
}

export interface UploadedLessonAttachment {
  file_key: string;
  file_name: string;
}

export interface CreateLessonPayload {
  title: string;
  body: string;
  subject: string;
  level: string;
  state: "DRAFT" | "PUBLISHED";
  embedded_video_url?: string | null;
  tags: string[];
  uploaded_attachments?: UploadedLessonAttachment[];
}

export interface UpdateLessonPayload {
  title: string;
  body: string;
  subject: string;
  level: string;
  state: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  embedded_video_url: string | null;
  tags: string[];
  uploaded_attachments?: UploadedLessonAttachment[];
}

export function useInfiniteLessons(params: LessonQueryParams = {}) {
  const { getToken, isSignedIn } = useAuth();
  const { isAuthed, getOptionalToken } = resolveClientAuth(isSignedIn, getToken);

  return useInfiniteQuery({
    queryKey: ["lessons", params, isAuthed ? "auth" : "guest", "v2"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getOptionalToken();

      const backendParams = {
        search: params.search,
        subject_id: params.subject,
        level_id: params.level,
        state: params.state,
        tags: params.tags,
        author_id: params.authorId,
        sort: params.sort,
        timeframe: params.timeframe,
        page: pageParam,
        expand: "author_details,attachments",
      };

      const queryStr = buildQueryString(backendParams);
      return apiFetch<PaginatedResponse<Lesson>>(
        `/lessons/${queryStr}`,
        token || undefined
      );
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
      const token = await getMutationAuthToken(getToken);
      if (!token) throw new Error("Not authenticated");
      return apiFetch<Lesson>(
        `/lessons/${id}/?expand=author_details,attachments`,
        token
      );
    },
    enabled: !!id,
  });
}

export function useCreateLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateLessonPayload) => {
      const token = await getMutationAuthToken(getToken);
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Lesson>("/lessons/", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      if (created?.id) {
        queryClient.invalidateQueries({ queryKey: ["lesson", created.id] });
      }
    },
  });
}

export function useUpdateLesson(lessonId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateLessonPayload) => {
      const token = await getMutationAuthToken(getToken);
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Lesson>(`/lessons/${lessonId}/`, token, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
    },
  });
}

export function useDeleteLessonAttachment(lessonId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const token = await getMutationAuthToken(getToken);
      if (!token) throw new Error("Unauthorized");
      await apiFetch(`/lessons/${lessonId}/attachments/${attachmentId}/`, token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
    },
  });
}

