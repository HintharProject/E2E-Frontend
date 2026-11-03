import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";

export interface TagSuggestion {
  id: string;
  name: string;
  post_count: number;
  lesson_count: number;
  problem_count: number;
  total_count: number;
}

export function useTagSuggestions(query: string, enabled: boolean = true) {
  const { getToken } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => clearTimeout(handler);
  }, [query]);

  return useQuery<TagSuggestion[]>({
    queryKey: ["tags", "autocomplete", debouncedQuery],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      const res = await apiFetch<TagSuggestion[]>(
        `/tags/?q=${encodeURIComponent(debouncedQuery)}&limit=15`,
        token
      );
      return res;
    },
    enabled: enabled,
    staleTime: 1000 * 30, // 30 seconds
  });
}
