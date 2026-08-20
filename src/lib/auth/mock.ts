import { getCurrentUser, type User } from "@/lib/mock-data";
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
  };
}

export function getMockSessionUser(): AppUser {
  return mockUserToAppUser(getCurrentUser());
}
