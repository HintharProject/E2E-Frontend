"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  fetchSavedSessions,
  fetchSavedSession,
  createSavedSession,
  updateSavedSession,
  deleteSavedSession,
  addSavedSessionItem,
  removeSavedSessionItem,
  fetchStudyPlans,
  fetchStudyPlan,
  createStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  addStudyPlanItem,
  removeStudyPlanItem,
} from "@/services/collections-service";
import type { SaveTargetPayload, SavedSession, StudyPlan } from "@/types";

function getAuthTokenWithDevFallback(token: string | null): string | null {
  if (process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true" && typeof window !== "undefined") {
    const devToken = localStorage.getItem("dev_token");
    if (devToken) return devToken;
  }
  return token;
}

function isClientAuthenticated(isSignedIn: boolean | undefined): boolean {
  if (isSignedIn) return true;
  if (process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true" && typeof window !== "undefined") {
    return Boolean(localStorage.getItem("dev_token"));
  }
  return false;
}

// ============================================================================
// Saved Sessions Hooks
// ============================================================================

export function useSavedSessions() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["saved-sessions"],
    queryFn: async () => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return fetchSavedSessions(token);
    },
    enabled: isClientAuthenticated(isSignedIn),
    staleTime: 60 * 1000,
  });
}

export function useSavedSession(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["saved-session", id],
    queryFn: async () => {
      const token = getAuthTokenWithDevFallback(await getToken());
      return fetchSavedSession(id, token);
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateSavedSession() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: { title: string; is_public?: boolean }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return createSavedSession(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
    },
  });
}

export function useUpdateSavedSession() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; is_public?: boolean };
    }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return updateSavedSession(id, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["saved-session", variables.id] });
    },
  });
}

export function useDeleteSavedSession() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return deleteSavedSession(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
    },
  });
}

export function useAddSessionItem() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      sessionId,
      target,
    }: {
      sessionId: string;
      target: SaveTargetPayload;
    }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return addSavedSessionItem(sessionId, target, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["saved-session", variables.sessionId] });
    },
  });
}

export function useRemoveSessionItem() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      sessionId,
      itemId,
    }: {
      sessionId: string;
      itemId: string;
    }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return removeSavedSessionItem(sessionId, itemId, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saved-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["saved-session", variables.sessionId] });
    },
  });
}

// Backwards-compatible alias for existing imports
export function useAddSavedSessionItem() {
  const addMutation = useAddSessionItem();

  return {
    ...addMutation,
    mutateAsync: async ({
      sessionId,
      postId,
      lessonId,
      problemId,
      solutionId,
      resourceId,
    }: {
      sessionId: string;
      postId?: string;
      lessonId?: string;
      problemId?: string;
      solutionId?: string;
      resourceId?: string;
    }) => {
      const target: SaveTargetPayload = {};
      if (postId) target.post = postId;
      if (lessonId) target.lesson = lessonId;
      if (problemId) target.problem = problemId;
      if (solutionId) target.solution = solutionId;
      if (resourceId) target.resource = resourceId;
      return addMutation.mutateAsync({ sessionId, target });
    },
  };
}

// ============================================================================
// Study Plans Hooks
// ============================================================================

export function useStudyPlans() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["study-plans"],
    queryFn: async () => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return fetchStudyPlans(token);
    },
    enabled: isClientAuthenticated(isSignedIn),
    staleTime: 60 * 1000,
  });
}

export function useStudyPlan(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["study-plan", id],
    queryFn: async () => {
      const token = getAuthTokenWithDevFallback(await getToken());
      return fetchStudyPlan(id, token);
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateStudyPlan() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: { title: string; is_public?: boolean }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return createStudyPlan(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    },
  });
}

export function useUpdateStudyPlan() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; is_public?: boolean };
    }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return updateStudyPlan(id, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["study-plan", variables.id] });
    },
  });
}

export function useDeleteStudyPlan() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return deleteStudyPlan(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    },
  });
}

export function useAddStudyPlanItem() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      planId,
      lessonId,
      target,
    }: {
      planId: string;
      lessonId?: string;
      target?: SaveTargetPayload;
    }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      const payload: SaveTargetPayload = target || (lessonId ? { lesson: lessonId } : {});
      return addStudyPlanItem(planId, payload, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["study-plan", variables.planId] });
    },
  });
}

export function useRemoveStudyPlanItem() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      planId,
      itemId,
    }: {
      planId: string;
      itemId: string;
    }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return removeStudyPlanItem(planId, itemId, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["study-plan", variables.planId] });
    },
  });
}
