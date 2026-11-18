"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared client-side authentication helpers.
 *
 * Centralizes `NEXT_PUBLIC_ALLOW_DEV_LOGIN` checks so stale `dev_token` entries
 * in `localStorage` can never leak into Production headers or auth gates.
 */

export function isDevLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true";
}

export function getDevTokenIfEnabled(): string | null {
  if (typeof window === "undefined" || !isDevLoginEnabled()) {
    return null;
  }
  return localStorage.getItem("dev_token");
}

function subscribeStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Hydration-safe hook that returns the active `dev_token` when
 * `NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true"`, or `null` during SSR / Production.
 */
export function useDevToken(): string | null {
  return useSyncExternalStore(
    subscribeStorage,
    getDevTokenIfEnabled,
    () => null
  );
}

export function isClientAuthenticated(isSignedIn: boolean | undefined): boolean {
  if (isSignedIn) return true;
  return Boolean(getDevTokenIfEnabled());
}

export interface ResolvedClientAuth {
  isAuthed: boolean;
  getOptionalToken: () => Promise<string | null>;
}

/**
 * Resolves client auth state and provides a safe `getOptionalToken()` helper
 * that never invokes Clerk's `getToken()` for unauthenticated guests and never
 * leaks `dev_token` unless `NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true"`.
 */
export function resolveClientAuth(
  isSignedIn: boolean | undefined,
  getToken: () => Promise<string | null>
): ResolvedClientAuth {
  const devToken = getDevTokenIfEnabled();
  const isAuthed = Boolean(isSignedIn || devToken);

  return {
    isAuthed,
    getOptionalToken: async () => {
      const currentDevToken = getDevTokenIfEnabled();
      if (currentDevToken) return currentDevToken;
      if (!isSignedIn) return null;
      return getToken().catch(() => null);
    },
  };
}

/**
 * Resolves an auth token for mutations where dev login may be active locally.
 */
export async function getMutationAuthToken(
  getToken: () => Promise<string | null>
): Promise<string | null> {
  const devToken = getDevTokenIfEnabled();
  if (devToken) return devToken;
  return getToken().catch(() => null);
}
