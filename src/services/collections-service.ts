import { apiFetch } from "@/services/api-client";
import type {
  PaginatedResponse,
  SavedSession,
  SavedSessionItem,
  StudyPlan,
  StudyPlanItem,
  SaveTargetPayload,
} from "@/types";

// ============================================================================
// Saved Sessions API
// ============================================================================

export async function fetchSavedSessions(
  token: string
): Promise<PaginatedResponse<SavedSession>> {
  return apiFetch<PaginatedResponse<SavedSession>>(
    "/saved-sessions/?expand=items",
    token
  );
}

export async function fetchSavedSession(
  id: string,
  token?: string | null
): Promise<SavedSession> {
  return apiFetch<SavedSession>(
    `/saved-sessions/${id}/?expand=items`,
    token
  );
}

export async function createSavedSession(
  data: { title: string; is_public?: boolean },
  token: string
): Promise<SavedSession> {
  return apiFetch<SavedSession>("/saved-sessions/", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSavedSession(
  id: string,
  data: { title?: string; is_public?: boolean },
  token: string
): Promise<SavedSession> {
  return apiFetch<SavedSession>(`/saved-sessions/${id}/`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteSavedSession(
  id: string,
  token: string
): Promise<void> {
  return apiFetch<void>(`/saved-sessions/${id}/`, token, {
    method: "DELETE",
  });
}

export async function addSavedSessionItem(
  sessionId: string,
  target: SaveTargetPayload,
  token: string
): Promise<SavedSessionItem> {
  return apiFetch<SavedSessionItem>(
    `/saved-sessions/${sessionId}/items/`,
    token,
    {
      method: "POST",
      body: JSON.stringify(target),
    }
  );
}

export async function removeSavedSessionItem(
  sessionId: string,
  itemId: string,
  token: string
): Promise<void> {
  return apiFetch<void>(
    `/saved-sessions/${sessionId}/items/${itemId}/`,
    token,
    {
      method: "DELETE",
    }
  );
}

// ============================================================================
// Study Plans API
// ============================================================================

export async function fetchStudyPlans(
  token: string
): Promise<PaginatedResponse<StudyPlan>> {
  return apiFetch<PaginatedResponse<StudyPlan>>(
    "/study-plans/?expand=items",
    token
  );
}

export async function fetchStudyPlan(
  id: string,
  token?: string | null
): Promise<StudyPlan> {
  return apiFetch<StudyPlan>(
    `/study-plans/${id}/?expand=items`,
    token
  );
}

export async function createStudyPlan(
  data: { title: string; is_public?: boolean },
  token: string
): Promise<StudyPlan> {
  return apiFetch<StudyPlan>("/study-plans/", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStudyPlan(
  id: string,
  data: { title?: string; is_public?: boolean },
  token: string
): Promise<StudyPlan> {
  return apiFetch<StudyPlan>(`/study-plans/${id}/`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteStudyPlan(
  id: string,
  token: string
): Promise<void> {
  return apiFetch<void>(`/study-plans/${id}/`, token, {
    method: "DELETE",
  });
}

export async function addStudyPlanItem(
  planId: string,
  target: SaveTargetPayload | string,
  token: string
): Promise<StudyPlanItem> {
  const payload = typeof target === "string" ? { lesson: target } : target;
  return apiFetch<StudyPlanItem>(
    `/study-plans/${planId}/items/`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function removeStudyPlanItem(
  planId: string,
  itemId: string,
  token: string
): Promise<void> {
  return apiFetch<void>(
    `/study-plans/${planId}/items/${itemId}/`,
    token,
    {
      method: "DELETE",
    }
  );
}
