"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseDraftPersistenceOptions<T extends Record<string, unknown>> {
  storageKey: string;
  enabled?: boolean;
  debounceMs?: number;
  isEmpty?: (draft: Partial<T>) => boolean;
}

function defaultIsEmpty(draft: Record<string, unknown>): boolean {
  return Object.values(draft).every((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  });
}

export function useDraftPersistence<T extends Record<string, unknown>>({
  storageKey,
  enabled = true,
  debounceMs = 300,
  isEmpty = defaultIsEmpty,
}: UseDraftPersistenceOptions<T>) {
  const [restoredDraft, setRestoredDraft] = useState<Partial<T> | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEmptyRef = useRef(isEmpty);

  useEffect(() => {
    isEmptyRef.current = isEmpty;
  }, [isEmpty]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = window.sessionStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<T>;
        if (parsed && typeof parsed === "object" && !isEmptyRef.current(parsed)) {
          setRestoredDraft(parsed);
          setHasRestoredDraft(true);
        } else {
          window.sessionStorage.removeItem(storageKey);
        }
      } catch {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // Ignore storage errors
        }
      }
    });

    return () => {
      active = false;
    };
  }, [storageKey, enabled]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const saveDraft = useCallback(
    (values: Partial<T>) => {
      if (!enabled || typeof window === "undefined") return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        try {
          if (isEmptyRef.current(values)) {
            window.sessionStorage.removeItem(storageKey);
          } else {
            window.sessionStorage.setItem(storageKey, JSON.stringify(values));
          }
        } catch {
          // Ignore quota/private-mode storage errors
        }
      }, debounceMs);
    },
    [storageKey, enabled, debounceMs]
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRestoredDraft(null);
    setHasRestoredDraft(false);

    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Ignore storage errors
      }
    }
  }, [storageKey]);

  const dismissRestoredNotice = useCallback(() => {
    setHasRestoredDraft(false);
  }, []);

  return {
    restoredDraft,
    hasRestoredDraft,
    saveDraft,
    clearDraft,
    dismissRestoredNotice,
  };
}
