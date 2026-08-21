export type Role = "STUDENT" | "CREATOR" | "ADMIN";

export type BanState =
  | "ACTIVE"
  | "WARNING"
  | "BANNED_24H"
  | "BANNED_7D"
  | "PERMANENT_BAN";

export type BanDetails = {
  bannedAt: string;
  duration: string;
  durationDays: number;
  cooldownExpiresAt: string;
  reason: string;
  ruleViolated: string;
  issuedBy: string;
  cooldownRemaining?: string;
  readOnlyRestriction?: string;
};

/** Raw user payload from GET /users/me/ (Django REST). */
export type ApiUser = {
  id: string;
  display_name: string;
  image_url: string;
  role: Role;
  ban_state: BanState;
  bio?: string | null;
  follower_count?: number;
  ban_details?: BanDetails;
};

export type AppUser = {
  id: string;
  displayName: string;
  imageUrl: string;
  role: Role;
  banState: BanState;
  bio?: string;
  followerCount?: number;
  banDetails?: BanDetails;
};

export function mapApiUser(raw: ApiUser): AppUser {
  return {
    id: raw.id,
    displayName: raw.display_name,
    imageUrl: raw.image_url || "",
    role: raw.role,
    banState: raw.ban_state,
    bio: raw.bio ?? undefined,
    followerCount: raw.follower_count,
    banDetails: raw.ban_details,
  };
}

export function isWriteLocked(banState: BanState): boolean {
  return (
    banState === "BANNED_24H" ||
    banState === "BANNED_7D" ||
    banState === "PERMANENT_BAN"
  );
}

export function canAccessCreatorStudio(role: Role): boolean {
  return role === "CREATOR" || role === "ADMIN";
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}
