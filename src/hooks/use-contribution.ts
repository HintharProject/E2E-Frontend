// src/hooks/use-contribution.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  castVote,
  revokeVote,
  fetchContributionStats,
  fetchContributionLedger,
  acceptSolution,
  unacceptSolution,
  adjustPointsAdmin,
  ContentVoteType,
} from "@/services/contribution-service";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useVoteContribution({
  contentType,
  contentId,
  currentScore = 0,
  currentUserVote = 0,
  onOptimisticChange,
}: {
  contentType: ContentVoteType;
  contentId: string;
  currentScore?: number;
  currentUserVote?: 1 | -1 | 0 | null;
  onOptimisticChange?: (newScore: number, newVote: 1 | -1 | 0, voterWeight: number) => void;
}) {
  const { getToken } = useAuth();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Resolve user dynamic vote multiplier W_user (1x to 5x)
  const voterMultiplier =
    user?.dynamic_vote_weight ??
    user?.reputation?.dynamic_vote_weight ??
    (user?.contributor_tier !== undefined ? user.contributor_tier + 1 : 1);

  return useMutation({
    mutationFn: async ({ targetValue }: { targetValue: 1 | -1 | 0 }) => {
      const devToken = typeof window !== "undefined" ? localStorage.getItem("dev_token") : null;
      const token = (await getToken()) || devToken;
      if (!token) throw new Error("Authentication required to vote");

      if (targetValue === 0) {
        return revokeVote(contentType, contentId, token);
      } else {
        return castVote(contentType, contentId, targetValue, token);
      }
    },
    onMutate: async ({ targetValue }) => {
      const prevVote = (currentUserVote ?? 0) as 1 | -1 | 0;
      const prevScore = currentScore;

      // Calculate optimistic score delta
      let optimisticDelta = 0;
      if (targetValue === 0) {
        optimisticDelta = -(prevVote * voterMultiplier);
      } else if (prevVote === 0) {
        optimisticDelta = targetValue * voterMultiplier;
      } else {
        optimisticDelta = (targetValue - prevVote) * voterMultiplier;
      }

      const optimisticScore = prevScore + optimisticDelta;

      if (onOptimisticChange) {
        onOptimisticChange(optimisticScore, targetValue, voterMultiplier);
      }

      return { prevVote, prevScore, optimisticScore, targetValue, voterMultiplier };
    },
    onSuccess: (data) => {
      if (data?.status === "APPLIED" && data?.curation_point_awarded) {
        toast.success(
          `+1 Curation Point earned! (${data.curation_quota_remaining_today ?? 0} remaining today)`,
          { icon: "⚡" }
        );
      }

      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: [contentType] });
      queryClient.invalidateQueries({ queryKey: [contentType, contentId] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["problem"] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["solution"] });
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: (err: any, variables, context) => {
      if (context && onOptimisticChange) {
        onOptimisticChange(context.prevScore, context.prevVote, context.voterMultiplier);
      }
      const errorMessage =
        err?.message || (err?.code === "SELF_VOTE_FORBIDDEN" ? "You cannot vote on your own content." : "Failed to register vote.");
      toast.error(errorMessage);
    },
  });
}

export function useContributionStats(userId: string | undefined | null) {
  const { getToken } = useAuth();
  const devToken = typeof window !== "undefined" ? localStorage.getItem("dev_token") : null;

  return useQuery({
    queryKey: ["contribution-stats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const token = (await getToken()) || devToken;
      return fetchContributionStats(userId, token);
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useContributionLedger(
  userId: string | undefined | null,
  params: {
    page?: number;
    page_size?: number;
    event_type?: string;
    from_date?: string;
    to_date?: string;
  }
) {
  const { getToken } = useAuth();
  const devToken = typeof window !== "undefined" ? localStorage.getItem("dev_token") : null;

  return useQuery({
    queryKey: ["contribution-ledger", userId, params],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const token = (await getToken()) || devToken;
      return fetchContributionLedger(userId, params, token);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useAcceptSolution() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const devToken = typeof window !== "undefined" ? localStorage.getItem("dev_token") : null;

  return useMutation({
    mutationFn: async ({
      problemId,
      solutionId,
      action = "accept",
    }: {
      problemId: string;
      solutionId: string;
      action?: "accept" | "unaccept";
    }) => {
      const token = (await getToken()) || devToken;
      if (!token) throw new Error("Authentication required");

      if (action === "unaccept") {
        return unacceptSolution(problemId, solutionId, token);
      } else {
        return acceptSolution(problemId, solutionId, token);
      }
    },
    onSuccess: (data, variables) => {
      if (variables.action === "unaccept") {
        toast.info("Solution unaccepted. Problem reopened.");
      } else {
        toast.success("🎉 Problem solved! +10 Milestone points awarded.", {
          duration: 4000,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["problem", variables.problemId] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
      queryClient.invalidateQueries({ queryKey: ["solution", variables.solutionId] });
      queryClient.invalidateQueries({ queryKey: ["solutions", variables.problemId] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update solution status.");
    },
  });
}

export function useAdminAdjustPoints() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const devToken = typeof window !== "undefined" ? localStorage.getItem("dev_token") : null;

  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      delta: number;
      reason: string;
      notes?: string;
    }) => {
      const token = (await getToken()) || devToken;
      if (!token) throw new Error("Admin authentication required");
      return adjustPointsAdmin(payload, token);
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Point adjustment recorded: ${variables.delta > 0 ? "+" : ""}${variables.delta} points. New Balance: ${data.resulting_balance}`
      );
      queryClient.invalidateQueries({ queryKey: ["contribution-stats", variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ["contribution-ledger", variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.user_id] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to adjust user points.");
    },
  });
}
