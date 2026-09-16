"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  getPairMs,
  getTrainTree,
  getAttemptSummary,
  getAttemptedIds,
  getPaperAttempts,
  createPaperAttempt,
  getResourceDetail,
} from "@/services/train-service";
import {
  TrainTimerMode,
  CreateAttemptPayload,
} from "@/types";

export function usePairMs(resourceId?: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["pair-ms", resourceId],
    queryFn: async () => {
      if (!resourceId) return null;
      const token = await getToken();
      return getPairMs(resourceId, token);
    },
    enabled: !!resourceId,
    staleTime: 60 * 60 * 1000, // Sibling relations are static, cache for 1 hr
  });
}

export function useTrainTree(subjectId?: string | null, levelId?: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["train-tree", subjectId, levelId],
    queryFn: async () => {
      if (!subjectId || !levelId) return null;
      const token = await getToken();
      return getTrainTree(subjectId, levelId, token);
    },
    enabled: !!subjectId && !!levelId,
    staleTime: 60 * 60 * 1000, // 1 hour cached
  });
}

export function useAttemptSummary(resourceId?: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["attempt-summary", resourceId],
    queryFn: async () => {
      if (!resourceId) return null;
      const token = await getToken();
      if (!token) {
        return {
          resource_id: resourceId,
          total_attempts: 0,
          personal_best: null,
          average_percentage: "0.00",
          latest_attempt: null,
        };
      }
      return getAttemptSummary(resourceId, token);
    },
    enabled: !!resourceId,
    staleTime: 30 * 1000,
  });
}

export function useAttemptedIds(subjectId?: string | null, levelId?: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["attempted-ids", subjectId, levelId],
    queryFn: async () => {
      if (!subjectId) return null;
      const token = await getToken();
      if (!token) {
        return {
          attempted_resource_ids: [],
        };
      }
      return getAttemptedIds(subjectId, levelId, token);
    },
    enabled: !!subjectId,
    staleTime: 60 * 1000,
  });
}

export function usePaperAttempts(resourceId?: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["paper-attempts", resourceId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        return {
          count: 0,
          next: null,
          previous: null,
          results: [],
        };
      }
      return getPaperAttempts(resourceId, token);
    },
    enabled: !!resourceId,
  });
}

export function useTrainResource(resourceId?: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["resource-detail", resourceId],
    queryFn: async () => {
      if (!resourceId) return null;
      const token = await getToken();
      return getResourceDetail(resourceId, token);
    },
    enabled: !!resourceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAttempt() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAttemptPayload) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Please sign in to save your practice attempt.");
      }
      return createPaperAttempt(payload, token);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attempt-summary", variables.resource_id] });
      queryClient.invalidateQueries({ queryKey: ["attempted-ids"] });
      queryClient.invalidateQueries({ queryKey: ["paper-attempts", variables.resource_id] });
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
  });
}

/**
 * Resilient, drift-free Exam Timer Hook.
 * Synchronizes with localStorage and real-world epoch timestamps.
 */
interface StoredTimerData {
  mode: TrainTimerMode;
  targetDurationSeconds: number;
  elapsedSeconds: number;
  isRunning: boolean;
  lastUpdatedEpoch: number;
}

export function useTrainTimer(
  resourceId: string,
  initialDurationSeconds: number = 75 * 60, // Default 75 min (AS Theory)
  initialMode: TrainTimerMode = "COUNTDOWN_EXAM"
) {
  const storageKey = `train_timer_${resourceId}`;

  // Initialize state from localStorage lazily to avoid setState in effect
  const [timerData, setTimerData] = useState<StoredTimerData>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed: StoredTimerData = JSON.parse(raw);
          if (parsed.isRunning && parsed.lastUpdatedEpoch) {
            const deltaSec = Math.floor((Date.now() - parsed.lastUpdatedEpoch) / 1000);
            return {
              ...parsed,
              elapsedSeconds: parsed.elapsedSeconds + Math.max(0, deltaSec),
            };
          }
          return parsed;
        }
      } catch {
        // Ignore corrupt storage
      }
    }
    return {
      mode: initialMode,
      targetDurationSeconds: initialDurationSeconds,
      elapsedSeconds: 0,
      isRunning: false,
      lastUpdatedEpoch: 0,
    };
  });

  const { mode, targetDurationSeconds, elapsedSeconds, isRunning } = timerData;

  const lastEpochRef = useRef<number>(0);
  const hasChimedRef = useRef<boolean>(false);

  // Synthesize Web Audio chime on expiry
  const playExpiryChime = useCallback(() => {
    if (typeof window === "undefined" || hasChimedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      hasChimedRef.current = true;
    } catch {
      // AudioContext policy or unsupported
    }
  }, []);

  // Sync to localStorage
  const persistState = useCallback(
    (next: StoredTimerData) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage full or unavailable
      }
    },
    [storageKey]
  );

  // Multi-tab synchronization
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const updated: StoredTimerData = JSON.parse(e.newValue);
          setTimerData(updated);
        } catch {
          // Ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  // Monotonic interval loop
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    lastEpochRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.floor((now - lastEpochRef.current) / 1000);

      if (deltaSec >= 1) {
        lastEpochRef.current = now;
        setTimerData((prev) => {
          const nextElapsed = prev.elapsedSeconds + deltaSec;

          if (prev.mode === "COUNTDOWN_EXAM") {
            const rem = Math.max(0, prev.targetDurationSeconds - nextElapsed);
            if (rem <= 0) {
              const finished: StoredTimerData = {
                ...prev,
                elapsedSeconds: prev.targetDurationSeconds,
                isRunning: false,
                lastUpdatedEpoch: now,
              };
              persistState(finished);
              playExpiryChime();
              return finished;
            }
          }

          const runningState: StoredTimerData = {
            ...prev,
            elapsedSeconds: nextElapsed,
            lastUpdatedEpoch: now,
          };
          persistState(runningState);
          return runningState;
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, persistState, playExpiryChime]);

  // Derive remaining seconds purely during render
  const remainingSeconds =
    mode === "COUNTDOWN_EXAM" ? Math.max(0, targetDurationSeconds - elapsedSeconds) : 0;

  // Derive alert level purely during render (no setState in effect)
  const alertLevel: "NORMAL" | "WARNING" | "CRITICAL" | "EXPIRED" =
    mode !== "COUNTDOWN_EXAM"
      ? "NORMAL"
      : remainingSeconds <= 0
      ? "EXPIRED"
      : remainingSeconds <= 120
      ? "CRITICAL"
      : remainingSeconds <= 600
      ? "WARNING"
      : "NORMAL";

  // Control actions
  const startTimer = useCallback(() => {
    hasChimedRef.current = false;
    lastEpochRef.current = Date.now();
    setTimerData((prev) => {
      const next: StoredTimerData = {
        ...prev,
        isRunning: true,
        lastUpdatedEpoch: Date.now(),
      };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const pauseTimer = useCallback(() => {
    setTimerData((prev) => {
      const next: StoredTimerData = {
        ...prev,
        isRunning: false,
        lastUpdatedEpoch: Date.now(),
      };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const resetTimer = useCallback(
    (newDuration?: number) => {
      hasChimedRef.current = false;
      setTimerData((prev) => {
        const finalDur = newDuration !== undefined ? newDuration : prev.targetDurationSeconds;
        const next: StoredTimerData = {
          ...prev,
          targetDurationSeconds: finalDur,
          elapsedSeconds: 0,
          isRunning: false,
          lastUpdatedEpoch: Date.now(),
        };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const switchMode = useCallback(
    (newMode: TrainTimerMode, newDuration?: number) => {
      hasChimedRef.current = false;
      setTimerData((prev) => {
        const finalDur = newDuration !== undefined ? newDuration : prev.targetDurationSeconds;
        const next: StoredTimerData = {
          ...prev,
          mode: newMode,
          targetDurationSeconds: finalDur,
          elapsedSeconds: 0,
          isRunning: false,
          lastUpdatedEpoch: Date.now(),
        };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  return {
    mode,
    targetDurationSeconds,
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    alertLevel,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
  };
}
