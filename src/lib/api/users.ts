import { apiFetch } from "@/lib/api/client";
import { mapApiUser, type ApiUser, type AppUser } from "@/lib/types/user";

/** JIT-provisions the user on first authenticated request. */
export async function getMe(token: string): Promise<AppUser> {
  const raw = await apiFetch<ApiUser>("/users/me/", { token });
  return mapApiUser(raw);
}

export async function getUserById(
  id: string,
  token: string,
): Promise<AppUser> {
  const raw = await apiFetch<ApiUser>(`/users/${id}/`, { token });
  return mapApiUser(raw);
}
