"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, buildQueryString } from "@/services/api-client";
import type { PaginatedResponse, Problem, Solution } from "@/types";

/**
 * Contributions are solutions authored by a user.
 * The backend has no author-filtered solutions list, so we collect
 * solutions from recent problems and keep those written by `userId`.
 */
export function useUserContributions(userId: string) {
  const { getToken } = useAuth();

  return useQuery<Solution[]>({
    queryKey: ["contributions", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");

      const problemsPage = await apiFetch<PaginatedResponse<Problem>>(
        `/problems/${buildQueryString({
          page: 1,
          expand: "author_details,subject_details,level_details",
        })}`,
        token
      );

      const problems = problemsPage.data ?? [];
      const contributions: Solution[] = [];

      await Promise.all(
        problems.map(async (problem) => {
          if (!problem.solution_count) return;
          try {
            const solutionsPage = await apiFetch<PaginatedResponse<Solution>>(
              `/problems/${problem.id}/solutions/${buildQueryString({
                page: 1,
                expand: "attachments,author_details",
              })}`,
              token
            );
            const solutions = Array.isArray(solutionsPage)
              ? solutionsPage
              : (solutionsPage.data ?? []);
            for (const solution of solutions) {
              if (solution.author === userId) {
                contributions.push({
                  ...solution,
                  problem_title: problem.title,
                  problem_details: problem,
                });
              }
            }
          } catch {
            // Gracefully ignore individual problem solution fetch failures
          }
        })
      );

      return contributions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}
