// Types for user data from the backend API (GET /users/me/)
import type { ContributorTier, ReputationSummary } from "./contribution";

// Unified End-User Role & 3-Tier Staff Governance Hierarchy
export type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPERADMIN" | null;
export type RoleEnum = "USER" | "MODERATOR" | "ADMIN" | "SUPERADMIN";

export type BanState =
  | "ACTIVE"
  | "WARNING"
  | "BANNED_24H"
  | "BANNED_7D"
  | "PERMANENT_BAN";

export interface AppUser {
  id: string;
  clerk_id: string;
  email?: string;
  display_name: string;
  image_url: string | null;
  role: Role;
  ban_state: BanState;
  ban_expires_at?: string | null;
  weak_subjects?: string[];
  good_subjects?: string[];
  bio?: string | null;
  level?: string | null;
  custom_level?: string | null;
  contribution_points?: number;
  contributor_tier?: ContributorTier;
  dynamic_vote_weight?: number;
  reputation?: ReputationSummary;
  created_at?: string;
}

/**
 * Returns true if the user's ban state prevents mutating/write operations.
 * Backend returns 403 with USER_BANNED error code for restricted users.
 */
export function isWriteLocked(banState?: BanState | null): boolean {
  return (
    banState === "BANNED_24H" ||
    banState === "BANNED_7D" ||
    banState === "PERMANENT_BAN"
  );
}

/**
 * Helper utilities for role checking across components and routes.
 */
export function isStaffRole(role?: Role): boolean {
  return role === "MODERATOR" || role === "ADMIN" || role === "SUPERADMIN";
}

export function isModeratorOrAbove(role?: Role): boolean {
  return role === "MODERATOR" || role === "ADMIN" || role === "SUPERADMIN";
}

export function isAdminOrSuperAdmin(role?: Role): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function isSuperAdmin(role?: Role): boolean {
  return role === "SUPERADMIN";
}

/**
 * Robustly checks if the current user is the author of a content item,
 * safely handling both internal database UUIDs and Clerk string IDs.
 */
export function isContentAuthor(
  currentUser: { id?: string; clerk_id?: string } | null | undefined,
  authorDetails?: { id?: string; clerk_id?: string } | null,
  authorRawId?: string | null
): boolean {
  if (!currentUser) return false;

  const matchesId = Boolean(
    currentUser.id && (
      (authorRawId && currentUser.id === authorRawId) ||
      (authorDetails?.id && currentUser.id === authorDetails.id)
    )
  );

  const matchesClerkId = Boolean(
    currentUser.clerk_id && (
      (authorRawId && currentUser.clerk_id === authorRawId) ||
      (authorDetails?.clerk_id && currentUser.clerk_id === authorDetails.clerk_id)
    )
  );

  return matchesId || matchesClerkId;
}


