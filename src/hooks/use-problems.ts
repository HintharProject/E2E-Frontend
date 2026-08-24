import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { useAuth } from "@clerk/nextjs";
import { Problem, Solution, PaginatedResponse } from "@/types";

export interface ProblemFilters {
  subject?: string;
  level?: string;
  status?: string;
  authorId?: string;
}

export function useProblems(filters: ProblemFilters = {}) {
  const { getToken } = useAuth();
  
  return useInfiniteQuery({
    queryKey: ["problems", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      const qs = buildQueryString({ ...filters, page: pageParam });
      return apiFetch<PaginatedResponse<Problem>>(`/problems/${qs}`, token);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.meta.next ? allPages.length + 1 : undefined;
    },
  });
}

export function useProblem(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["problem", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Problem>(`/problems/${id}/`, token);
    },
    enabled: !!id,
  });
}

export function useSolutions(problemId: string) {
  const { getToken } = useAuth();
  return useInfiniteQuery({
    queryKey: ["solutions", problemId],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      const qs = buildQueryString({ page: pageParam });
      return apiFetch<PaginatedResponse<Solution>>(`/problems/${problemId}/solutions/${qs}`, token);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.meta.next ? allPages.length + 1 : undefined;
    },
    enabled: !!problemId,
  });
}

export function useCreateProblem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; body: string; subject: string; level: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Problem>("/problems/", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
  });
}

export function useCreateSolution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ problemId, body }: { problemId: string; body: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Solution>(`/problems/${problemId}/solutions/`, token, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["solutions", variables.problemId] });
      queryClient.invalidateQueries({ queryKey: ["problem", variables.problemId] });
    },
  });
}

export function useVoteSolution() {
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async ({ solutionId, value }: { solutionId: string; value: 1 | -1 | 0 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/solutions/${solutionId}/vote/`, token, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
    }
  });
}

export function useVoteProblem() {
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async ({ problemId, value }: { problemId: string; value: 1 | -1 | 0 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/problems/${problemId}/vote/`, token, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
    }
  });
}

export function useMarkSolutionStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ solutionId, status }: { solutionId: string; status: "WORKED" | "INCORRECT" }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/solutions/${solutionId}/mark_status/`, token, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["problem"] });
    },
  });
}
