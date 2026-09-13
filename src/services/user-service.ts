import type { AppUser } from "@/types/user";
import { apiFetch } from "./api-client";

// ---------------------------------------------------------------------------
// User Service — GET /users/me/
// Endpoint ref: docs/frontend_handoff/02_endpoints_reference.md §1
// ---------------------------------------------------------------------------

/**
 * Fetches the currently authenticated user's profile.
 *
 * On first-ever call for a new Clerk user, the backend performs
 * Just-In-Time provisioning (creates the User record automatically).
 */
export async function fetchCurrentUser(token: string): Promise<AppUser> {
  const data = await apiFetch<any>("/users/me/", token);
  return {
    id: data.id,
    clerk_id: data.clerk_id,
    email: data.email,
    display_name: data.display_name,
    image_url: data.profile_image_url,
    role: data.role,
    ban_state: data.ban_status,
    ban_expires_at: data.ban_expires_at,
    weak_subjects: data.weak_subjects,
    good_subjects: data.good_subjects,
    bio: data.bio,
    level: data.level,
    custom_level: data.custom_level,
    contribution_points: data.contribution_points ?? data.reputation?.contribution_points ?? 0,
    contributor_tier: data.contributor_tier ?? data.reputation?.contributor_tier ?? 0,
    dynamic_vote_weight: data.dynamic_vote_weight ?? data.reputation?.dynamic_vote_weight ?? 1,
    reputation: data.reputation,
    created_at: data.created_at,
  };
}
