"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import { Subject, Level, Tag, PaginatedResponse } from "@/types";

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      // These endpoints are public, so we don't strictly need a token for GET, but we'll send an empty string
      // so it sends a 'Bearer ' header which backend should ignore for public endpoints.
      const res = await apiFetch<PaginatedResponse<Subject>>("/subjects/", "");
      return res.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useLevels() {
  return useQuery({
    queryKey: ["levels"],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Level>>("/levels/", "");
      return res.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await apiFetch<PaginatedResponse<Tag>>("/tags/", "");
      return res.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
