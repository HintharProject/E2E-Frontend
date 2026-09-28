"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { toast } from "sonner";

export type TakedownTargetType = "POST" | "LESSON" | "PROBLEM" | "SOLUTION" | "COMMENT";
export type TakedownAction =
  | "soft_delete"
  | "restore"
  | "hide"
  | "unhide"
  | "lock"
  | "unlock"
  | "delist";

export interface TakedownPayload {
  target_id: string;
  target_type: TakedownTargetType;
  action: TakedownAction;
  reason?: string;
}

export interface TakedownResponse {
  success: boolean;
  message: string;
  action: TakedownAction;
  target_type: TakedownTargetType;
  target_id: string;
}

export function useStaffActions() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const takedownMutation = useMutation({
    mutationFn: async (payload: TakedownPayload): Promise<TakedownResponse> => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized staff session");

      return apiFetch<TakedownResponse>("/moderation/takedown/", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data, variables) => {
      const { target_type, target_id, action } = variables;
      const actionLabels: Record<TakedownAction, string> = {
        soft_delete: "deleted",
        restore: "restored",
        hide: "hidden from students",
        unhide: "unhidden and visible",
        lock: "locked",
        unlock: "unlocked",
        delist: "delisted to draft",
      };

      const readableAction = actionLabels[action] || action;
      toast.success(`${target_type} successfully ${readableAction}.`);

      // Comprehensive Cache Invalidation
      if (target_type === "POST") {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["post", target_id] });
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      } else if (target_type === "PROBLEM") {
        queryClient.invalidateQueries({ queryKey: ["problems"] });
        queryClient.invalidateQueries({ queryKey: ["problem", target_id] });
      } else if (target_type === "SOLUTION") {
        queryClient.invalidateQueries({ queryKey: ["solutions"] });
        queryClient.invalidateQueries({ queryKey: ["solution", target_id] });
        queryClient.invalidateQueries({ queryKey: ["problem"] });
      } else if (target_type === "LESSON") {
        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        queryClient.invalidateQueries({ queryKey: ["lesson", target_id] });
      } else if (target_type === "COMMENT") {
        queryClient.invalidateQueries({ queryKey: ["comments"] });
        queryClient.invalidateQueries({ queryKey: ["post"] });
        queryClient.invalidateQueries({ queryKey: ["solutions"] });
      }

      // Also invalidate moderation queue reports
      queryClient.invalidateQueries({ queryKey: ["moderation"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to execute staff moderation action.";
      toast.error(msg);
    },
  });

  return {
    takedownMutation,
    isPending: takedownMutation.isPending,
  };
}
