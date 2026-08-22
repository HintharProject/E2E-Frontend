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
  return apiFetch<AppUser>("/users/me/", token);
}
