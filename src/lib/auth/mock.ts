import { cookies } from "next/headers";
import { users, CURRENT_USER_ID, type User } from "@/lib/mock-data";
import type { AppUser } from "@/lib/types/user";

export function mockUserToAppUser(user: User): AppUser {
  return {
    id: user.id,
    displayName: user.displayName,
    imageUrl: user.imageUrl,
    role: user.role,
    banState: user.banState,
    bio: user.bio,
    followerCount: user.followerCount,
    banDetails: user.banDetails,
  };
}

export async function getMockSessionUser(): Promise<AppUser> {
  try {
    const cookieStore = await cookies();
    const mockUserId = cookieStore.get("mock_user_id")?.value;
    if (mockUserId) {
      const found = users.find((u) => u.id === mockUserId);
      if (found) {
        return mockUserToAppUser(found);
      }
    }
  } catch {
    // Fallback if cookies() cannot be read in current context
  }

  const defaultUser =
    users.find((u) => u.id === CURRENT_USER_ID) ?? users[0];
  return mockUserToAppUser(defaultUser);
}
