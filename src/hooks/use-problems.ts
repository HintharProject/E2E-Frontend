import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildQueryString } from "@/services/api-client";
import { useAuth } from "@clerk/nextjs";
import { Problem, Solution, PaginatedResponse, DeduplicationResponse, PresignedUploadResponse } from "@/types";

export interface ProblemFilters {
  subject?: string;
  level?: string;
  status?: string;
  origin?: string;
  ordering?: string;
  feed_visibility?: string;
  authorId?: string;
  resource?: string;
}

export function usePaperProblems(resourceId?: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["paperProblems", resourceId],
    queryFn: async () => {
      if (!resourceId) return [];
      const token = await getToken();
      const qs = buildQueryString({
        resource: resourceId,
        feed_visibility: "all",
        expand: "attachments,author_details,subject_details,level_details,solutions",
      });
      const res = await apiFetch<PaginatedResponse<Problem>>(`/problems/${qs}`, token);
      return res.data || [];
    },
    enabled: !!resourceId,
  });
}

export function useProblems(filters: ProblemFilters = {}) {
  const { getToken } = useAuth();
  const { authorId, ...apiFilters } = filters;
  
  return useInfiniteQuery({
    queryKey: ["problems", filters, "v2"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      const qs = buildQueryString({ ...apiFilters, page: pageParam, expand: "attachments,author_details,subject_details,level_details,resource" });
      const page = await apiFetch<PaginatedResponse<Problem>>(`/problems/${qs}`, token);
      if (!authorId) return page;
      return {
        ...page,
        data: page.data.filter((problem) => problem.author === authorId),
      };
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
    queryKey: ["problem", id, "v2"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Problem>(`/problems/${id}/?expand=attachments,author_details,subject_details,level_details,resource`, token);
    },
    enabled: !!id,
  });
}

export function useSolution(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["solution", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Solution>(`/solutions/${id}/?expand=attachments,author_details`, token);
    },
    enabled: !!id,
  });
}

export function useSolutions(problemId: string, isActivePool: boolean = true) {
  const { getToken } = useAuth();
  return useInfiniteQuery({
    queryKey: ["solutions", problemId, isActivePool],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      const qs = buildQueryString({
        page: pageParam,
        is_active_pool: isActivePool ? "true" : "false",
        expand: "attachments,author_details",
      });
      return apiFetch<PaginatedResponse<Solution>>(`/problems/${problemId}/solutions/${qs}`, token);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.meta.next ? allPages.length + 1 : undefined;
    },
    enabled: !!problemId,
  });
}

export function useProblemByPaper(resourceId?: string, questionNumber?: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["by-paper", resourceId, questionNumber],
    queryFn: async () => {
      if (!resourceId || !questionNumber?.trim()) return null;
      const token = await getToken();
      const qs = buildQueryString({
        resource: resourceId,
        question: questionNumber.trim(),
      });
      return apiFetch<DeduplicationResponse>(`/problems/by-paper/${qs}`, token);
    },
    enabled: !!resourceId && !!questionNumber && questionNumber.trim().length > 0,
    staleTime: 30 * 1000,
  });
}

export async function generateProblemUploadUrl(
  fileName: string,
  contentType: string,
  uploadType: "problem_attachment" | "solution_attachment",
  token: string | null
): Promise<PresignedUploadResponse> {
  return apiFetch<PresignedUploadResponse>("/problems/generate_upload_url/", token, {
    method: "POST",
    body: JSON.stringify({
      file_name: fileName,
      content_type: contentType,
      upload_type: uploadType,
    }),
  });
}

export interface CreateProblemPayload {
  origin: "USER_UPLOAD" | "PAST_PAPER";
  title?: string;
  body?: string;
  subject?: string;
  level?: string;
  source?: string;
  resource?: string;
  question_number?: string;
  is_feed_visible?: boolean;
  uploaded_attachments?: Array<{ file_key: string; file_name: string }>;
}

export function useCreateProblem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProblemPayload) => {
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

export interface CreateSolutionPayload {
  problemId: string;
  body: string;
  video_url?: string;
  attachments?: Array<{ file_key: string; file_name: string }>;
}

export function useCreateSolution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ problemId, ...payload }: CreateSolutionPayload) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Solution>(`/problems/${problemId}/solutions/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ solutionId, value }: { solutionId: string; value: 1 | -1 | 0 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      if (value === 0) {
        return apiFetch(`/solutions/${solutionId}/vote/`, token, {
          method: "DELETE",
        });
      } else {
        return apiFetch(`/solutions/${solutionId}/vote/`, token, {
          method: "POST",
          body: JSON.stringify({ value }),
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
      queryClient.invalidateQueries({ queryKey: ["problem"] });
    },
  });
}

export function useVoteProblem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ problemId, value }: { problemId: string; value: 1 | -1 | 0 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      if (value === 0) {
        return apiFetch(`/problems/${problemId}/vote/`, token, {
          method: "DELETE",
        });
      } else {
        return apiFetch(`/problems/${problemId}/vote/`, token, {
          method: "POST",
          body: JSON.stringify({ value }),
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["problem"] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["problem"] });
    },
  });
}

export function useDeleteProblem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (problemId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/problems/${problemId}/`, token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
  });
}

export function useDeleteSolution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (solutionId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/solutions/${solutionId}/`, token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
    },
  });
}

