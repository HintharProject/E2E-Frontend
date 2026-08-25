// Types for user data from the backend API (GET /users/me/)
// Based on: docs/frontend_handoff/03_roles_and_business_rules.md

export type Role = "ADMIN" | "CREATOR" | "STUDENT";

export type BanState =
  | "ACTIVE"
  | "WARNING"
  | "BANNED_24H"
  | "BANNED_7D"
  | "PERMANENT_BAN";

export interface AppUser {
  id: string;
  clerk_id: string;
  display_name: string;
  image_url: string | null;
  role: Role;
  ban_state: BanState;
}

/**
 * Returns true if the user's ban state prevents write operations.
 * Backend returns 403 with USER_BANNED error code for restricted users.
 */
export function isWriteLocked(banState: BanState): boolean {
  return (
    banState === "BANNED_24H" ||
    banState === "BANNED_7D" ||
    banState === "PERMANENT_BAN"
  );
}
