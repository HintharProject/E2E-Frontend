import { apiFetch } from "./api-client";
import {
  PairMsResponse,
  TrainTreeResponse,
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
