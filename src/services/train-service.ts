import { apiFetch } from "./api-client";
import {
  PairMsResponse,
  TrainTreeResponse,
  AttemptSummaryResponse,
  AttemptedIdsResponse,
  CreateAttemptPayload,
  PaperAttemptDetail,
  PaperAttemptListResponse,
  GradeBoundary,
  Resource,
} from "@/types";

/**
 * Safely unwrap API payloads when the Django backend nests responses in { data: ... }.
 */
function unwrapData<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * Sub-15ms sibling Mark Scheme lookup for an active Question Paper.
 */
export async function getPairMs(
  resourceId: string,
  token?: string | null
): Promise<PairMsResponse> {
  const res = await apiFetch<unknown>(`/resources/files/${resourceId}/pair-ms/`, token);
  return unwrapData<PairMsResponse>(res);
}

/**
 * Retrieves cached curriculum hierarchy tree for the zero-reload Train! navigation sidebar.
 */
export async function getTrainTree(
  subjectId: string,
  levelId: string,
  token?: string | null
): Promise<TrainTreeResponse> {
  const query = new URLSearchParams({ subject: subjectId, level: levelId }).toString();
  const res = await apiFetch<unknown>(`/resources/files/train-tree/?${query}`, token);
  return unwrapData<TrainTreeResponse>(res);
}

/**
 * Calculates personal best and benchmark practice metrics for a target past paper.
 */
export async function getAttemptSummary(
  resourceId: string,
  token?: string | null
): Promise<AttemptSummaryResponse> {
  const query = new URLSearchParams({ resource: resourceId }).toString();
  const res = await apiFetch<unknown>(`/learning/attempts/summary/?${query}`, token);
  return unwrapData<AttemptSummaryResponse>(res);
}

/**
 * Returns an unpaginated list of past-paper UUIDs the user has attempted within subject/level.
 */
export async function getAttemptedIds(
  subjectId: string,
  levelId?: string | null,
  token?: string | null
): Promise<AttemptedIdsResponse> {
  const params = new URLSearchParams({ subject: subjectId });
  if (levelId) {
    params.set("level", levelId);
  }
  const res = await apiFetch<unknown>(`/learning/attempts/attempted-ids/?${params.toString()}`, token);
  return unwrapData<AttemptedIdsResponse>(res);
}

/**
 * Retrieves paginated list of practice attempts for the authenticated user.
 */
export async function getPaperAttempts(
  resourceId?: string | null,
  token?: string | null
): Promise<PaperAttemptListResponse> {
  const params = resourceId ? `?resource=${encodeURIComponent(resourceId)}` : "";
  const res = await apiFetch<unknown>(`/learning/attempts/${params}`, token);
  return unwrapData<PaperAttemptListResponse>(res);
}

/**
 * Retrieves single attempt detail with question-level breakdown and identified weak topics.
 */
export async function getAttemptDetail(
  attemptId: string,
  token?: string | null
): Promise<PaperAttemptDetail> {
  const res = await apiFetch<unknown>(`/learning/attempts/${attemptId}/`, token);
  return unwrapData<PaperAttemptDetail>(res);
}

/**
 * Atomically records a completed practice attempt and question marks.
 */
export async function createPaperAttempt(
  payload: CreateAttemptPayload,
  token?: string | null
): Promise<PaperAttemptDetail> {
  const res = await apiFetch<unknown>("/learning/attempts/", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return unwrapData<PaperAttemptDetail>(res);
}

/**
 * Retrieves grade boundaries for a subject/level syllabus.
 */
export async function getGradeBoundaries(
  subjectId?: string | null,
  levelId?: string | null,
  token?: string | null
): Promise<GradeBoundary[]> {
  const params = new URLSearchParams();
  if (subjectId) params.set("subject", subjectId);
  if (levelId) params.set("level", levelId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await apiFetch<unknown>(`/resources/grade-boundaries/${qs}`, token);
  return unwrapData<GradeBoundary[]>(res);
}

/**
 * Retrieves full details and fresh pre-signed URLs for a target past paper resource.
 */
export async function getResourceDetail(
  resourceId: string,
  token?: string | null
): Promise<Resource> {
  const res = await apiFetch<unknown>(`/resources/files/${resourceId}/`, token);
  return unwrapData<Resource>(res);
}
