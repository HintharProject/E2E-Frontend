"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { Subject, Level, Tag } from "@/types";

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      // These endpoints are public, so we don't strictly need a token for GET, but we'll send an empty string
      // so it sends a 'Bearer ' header which backend should ignore for public endpoints.
      const res = await apiFetch<Subject[]>("/subjects/", "");
      return res;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useLevels() {
  return useQuery({
    queryKey: ["levels"],
    queryFn: async () => {
      const res = await apiFetch<Level[]>("/levels/", "");
      return res;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useTags() {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return []; // Return empty if not authenticated
      const res = await apiFetch<Tag[]>("/tags/", token);
      return res;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
