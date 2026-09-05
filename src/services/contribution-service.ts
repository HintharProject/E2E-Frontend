// src/services/contribution-service.ts

import { apiFetch, buildQueryString } from "@/services/api-client";
import {
  ContributionStats,
  ContributionTransaction,
  VoteMutationResponse,
} from "@/types/contribution";
import { PaginatedResponse } from "@/types";

export type ContentVoteType = "solutions" | "problems" | "posts" | "lessons" | "comments";

export async function castVote(
  contentType: ContentVoteType,
  contentId: string,
  value: 1 | -1,
  token: string | null
): Promise<VoteMutationResponse> {
  return apiFetch<VoteMutationResponse>(`/${contentType}/${contentId}/vote/`, token, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

export async function revokeVote(
  contentType: ContentVoteType,
  contentId: string,
  token: string | null
): Promise<VoteMutationResponse> {
  return apiFetch<VoteMutationResponse>(`/${contentType}/${contentId}/vote/`, token, {
    method: "DELETE",
  });
}

export async function fetchContributionStats(
  userId: string,
  token: string | null
): Promise<ContributionStats> {
  return apiFetch<ContributionStats>(`/users/${userId}/contribution-stats/`, token);
}

export async function fetchContributionLedger(
  userId: string,
  params: {
    page?: number;
    page_size?: number;
    event_type?: string;
    from_date?: string;
    to_date?: string;
  },
  token: string | null
): Promise<PaginatedResponse<ContributionTransaction>> {
  const query = buildQueryString(params);
  return apiFetch<PaginatedResponse<ContributionTransaction>>(
    `/users/${userId}/contributions/ledger/${query}`,
    token
  );
}

export async function acceptSolution(
  problemId: string,
  solutionId: string,
  token: string | null
): Promise<{
  problem_id: string;
  problem_status: "SOLVED";
  accepted_solution_id: string;
  milestone_awarded: boolean;
  milestone_points: number;
  problem_author_balance: number;
}> {
  return apiFetch(`/problems/${problemId}/solutions/${solutionId}/accept/`, token, {
    method: "POST",
  });
}

export async function unacceptSolution(
  problemId: string,
  solutionId: string,
  token: string | null
): Promise<{
  problem_id: string;
  problem_status: "OPEN";
  accepted_solution_id: null;
  milestone_reverted: boolean;
  milestone_points_deducted: number;
  problem_author_balance: number;
}> {
  return apiFetch(`/problems/${problemId}/solutions/${solutionId}/accept/`, token, {
    method: "DELETE",
  });
}

export async function adjustPointsAdmin(
  payload: {
    user_id: string;
    delta: number;
    reason: string;
    notes?: string;
  },
  token: string | null
): Promise<{
  transaction_id: string;
  user_id: string;
  event_type: "ADMIN_ADJUSTMENT";
  delta: number;
  previous_balance: number;
  resulting_balance: number;
  contributor_tier: number;
  reason: string;
}> {
  return apiFetch(`/moderation/adjust-points/`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
