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
  const { getToken, isSignedIn } = useAuth();
  
  return useQuery({
    queryKey: ["tags", isSignedIn ? "auth" : "guest"],
    queryFn: async () => {
      const token = isSignedIn ? await getToken().catch(() => null) : null;
      try {
        const res = await apiFetch<Tag[]>("/tags/", token || undefined);
        return res;
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour — almost never changes
    gcTime: 1000 * 60 * 60 * 2,
  });
}
