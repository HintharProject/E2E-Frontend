"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useSavedSessions, useStudyPlans } from "@/hooks/use-collections";
import type {
  SavedSessionItem,
  SaveTargetType,
  StudyPlanItem,
} from "@/types";

interface SavedCollectionsContextValue {
  isSaved: (entityType: SaveTargetType, entityId: string) => boolean;
  isSavedInSession: (entityType: SaveTargetType, entityId: string) => boolean;
  isSavedInPlan: (entityType: SaveTargetType, entityId: string) => boolean;
}

const SavedCollectionsContext =
  createContext<SavedCollectionsContextValue | null>(null);

const SESSION_TARGET_TYPES: SaveTargetType[] = [
  "post",
  "problem",
  "solution",
  "lesson",
  "resource",
];

const PLAN_TARGET_TYPES: SaveTargetType[] = [
  "lesson",
  "problem",
  "solution",
  "resource",
];

function extractTargetId(
  item: SavedSessionItem | StudyPlanItem,
  entityType: SaveTargetType
): string | null | undefined {
  switch (entityType) {
    case "post":
      return "post" in item ? item.post || item.post_details?.id : null;
    case "problem":
      return item.problem || item.problem_details?.id;
    case "solution":
      return item.solution || item.solution_details?.id;
    case "lesson":
      return item.lesson || item.lesson_details?.id;
    case "resource":
      return item.resource || item.resource_details?.id;
    default:
      return null;
  }
}

function makeTargetKey(entityType: SaveTargetType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

/**
 * Shares one Saved Sessions + Study Plans subscription across the app shell
 * so feed cards can check saved status in O(1) without mounting queries per card.
 */
export function SavedCollectionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessionsResponse } = useSavedSessions();
  const { data: plansResponse } = useStudyPlans();

  const sessionTargetKeys = useMemo(() => {
    const keys = new Set<string>();
    const sessions = sessionsResponse?.data || [];
    for (const session of sessions) {
      for (const item of session.items || []) {
        for (const targetType of SESSION_TARGET_TYPES) {
          const targetId = extractTargetId(item, targetType);
          if (targetId) keys.add(makeTargetKey(targetType, targetId));
        }
      }
    }
    return keys;
  }, [sessionsResponse]);

  const planTargetKeys = useMemo(() => {
    const keys = new Set<string>();
    const plans = plansResponse?.data || [];
    for (const plan of plans) {
      for (const item of plan.items || []) {
        for (const targetType of PLAN_TARGET_TYPES) {
          const targetId = extractTargetId(item, targetType);
          if (targetId) keys.add(makeTargetKey(targetType, targetId));
        }
      }
    }
    return keys;
  }, [plansResponse]);

  const isSavedInSession = useCallback(
    (entityType: SaveTargetType, entityId: string) =>
      sessionTargetKeys.has(makeTargetKey(entityType, entityId)),
    [sessionTargetKeys]
  );

  const isSavedInPlan = useCallback(
    (entityType: SaveTargetType, entityId: string) =>
      entityType !== "post" &&
      planTargetKeys.has(makeTargetKey(entityType, entityId)),
    [planTargetKeys]
  );

  const isSaved = useCallback(
    (entityType: SaveTargetType, entityId: string) =>
      isSavedInSession(entityType, entityId) ||
      isSavedInPlan(entityType, entityId),
    [isSavedInSession, isSavedInPlan]
  );

  const value = useMemo(
    () => ({ isSaved, isSavedInSession, isSavedInPlan }),
    [isSaved, isSavedInSession, isSavedInPlan]
  );

  return (
    <SavedCollectionsContext.Provider value={value}>
      {children}
    </SavedCollectionsContext.Provider>
  );
}

/**
 * Returns shared saved-status lookup helpers when inside SavedCollectionsProvider,
 * or null when rendered standalone outside the app shell.
 */
export function useOptionalSavedCollectionsLookup() {
  return useContext(SavedCollectionsContext);
}

