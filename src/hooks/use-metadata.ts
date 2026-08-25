"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { Subject, Level, Tag } from "@/types";

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      // /subjects/ is AllowAny on the backend — no token needed
      const res = await apiFetch<Subject[]>("/subjects/", "");
      return res;
    },
    staleTime: 1000 * 60 * 60, // 1 hour — almost never changes
    gcTime: 1000 * 60 * 60 * 2,
  });
}

export function useLevels() {
  return useQuery({
    queryKey: ["levels"],
    queryFn: async () => {
      // /levels/ is AllowAny on the backend — no token needed
      const res = await apiFetch<Level[]>("/levels/", "");
      return res;
    },
    staleTime: 1000 * 60 * 60, // 1 hour — almost never changes
    gcTime: 1000 * 60 * 60 * 2,
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
    staleTime: 1000 * 60 * 60, // 1 hour — almost never changes
    gcTime: 1000 * 60 * 60 * 2,
  });
}
