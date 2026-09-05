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
    display_name: data.display_name,
    image_url: data.profile_image_url,
    role: data.role,
    ban_state: data.ban_status,
    contribution_points: data.contribution_points ?? data.reputation?.contribution_points ?? 0,
    contributor_tier: data.contributor_tier ?? data.reputation?.contributor_tier ?? 0,
    dynamic_vote_weight: data.dynamic_vote_weight ?? data.reputation?.dynamic_vote_weight ?? 1,
    reputation: data.reputation,
  };
}
