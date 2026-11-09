"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import type { Post, Problem, Lesson } from "@/types";

export interface TagContentMeta {
  id?: string;
  name: string;
  post_count?: number;
  lesson_count?: number;
  problem_count?: number;
  total_count?: number;
}

/**
 * Custom hook to fetch all platform contents tagged with a specific tag name or UUID.
 * Queries Posts, Problems, and Lessons in parallel with expanded relations, as well
 * as Tag metadata for aggregate count metrics.
 */
export function useTagContent(tagName: string) {
  const { getToken } = useAuth();
  const cleanName = (tagName || "").replace(/^#/, "").trim().toLowerCase();

  const query = useQuery({
    queryKey: ["tag-content", cleanName],
    queryFn: async () => {
      const token = await getToken();

      const postsQs = buildQueryString({
        tags: cleanName,
        limit: 50,
        expand: "author_details,subject_details,level_details,tags_data",
      });

      const problemsQs = buildQueryString({
        tags: cleanName,
        limit: 50,
        expand: "attachments,author_details,subject_details,level_details,tags_data",
      });

      const lessonsQs = buildQueryString({
        tags: cleanName,
        limit: 50,
        expand: "author_details,subject_details,level_details,tags_data,attachments",
      });

      const [metaRes, postsRes, problemsRes, lessonsRes] = await Promise.all([
        apiFetch<any>(`/tags/?q=${encodeURIComponent(cleanName)}&limit=10`, token).catch(() => []),
        apiFetch<any>(`/posts/${postsQs}`, token).catch(() => ({ data: [] })),
        apiFetch<any>(`/problems/${problemsQs}`, token).catch(() => ({ data: [] })),
        apiFetch<any>(`/lessons/${lessonsQs}`, token).catch(() => ({ data: [] })),
      ]);

      const extractItems = <T>(res: any): T[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.results)) return res.results;
        return [];
      };

      const tagsList: TagContentMeta[] = extractItems<TagContentMeta>(metaRes);
      const exactTag = tagsList.find((t) => t.name.toLowerCase() === cleanName) || {
        name: cleanName,
      };

      const posts: Post[] = extractItems<Post>(postsRes);
      const problems: Problem[] = extractItems<Problem>(problemsRes);
      const lessons: Lesson[] = extractItems<Lesson>(lessonsRes);

      return {
        tagMeta: exactTag,
        posts,
        problems,
        lessons,
      };
    },
    enabled: Boolean(cleanName),
    staleTime: 1000 * 45, // 45 seconds cache
  });

  return {
    tagMeta: query.data?.tagMeta || { name: cleanName },
    posts: query.data?.posts || [],
    problems: query.data?.problems || [],
    lessons: query.data?.lessons || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

