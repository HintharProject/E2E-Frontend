import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getMe } from "@/lib/api/users";
import {
  allowClerkAuthFallback,
  clerkFallbackUser,
} from "@/lib/auth/clerk-fallback";
import { getMockSessionUser } from "@/lib/auth/mock";
import { isMockMode } from "@/lib/data-source";
import {
  canAccessCreatorStudio,
  isAdmin,
  type AppUser,
  type Role,
} from "@/lib/types/user";

export type AuthSource = "mock" | "api" | "clerk-fallback";

export type AuthenticatedSession = {
  user: AppUser;
  source: AuthSource;
};

export async function requireSession(): Promise<AuthenticatedSession> {
  if (isMockMode()) {
    const user = await getMockSessionUser();
    return { user, source: "mock" };
  }

  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const token = await getToken();
  if (!token) {
    redirect("/sign-in");
  }

  try {
    const user = await getMe(token);
    return { user, source: "api" };
  } catch (err) {
    if (allowClerkAuthFallback()) {
      console.warn(
        "[auth] Backend API unreachable — using Clerk session fallback (STUDENT role).",
        err instanceof Error ? err.message : err,
      );
      const user = await clerkFallbackUser();
      return { user, source: "clerk-fallback" };
    }
    throw err;
  }
}

export async function requireUser(): Promise<AppUser> {
  const { user } = await requireSession();
  return user;
}

export async function requireRole(allowed: Role[]): Promise<AppUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/forum");
  }
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (!isAdmin(user.role)) {
    redirect("/forum");
  }
  return user;
}

export async function requireCreatorOrAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (!canAccessCreatorStudio(user.role)) {
    redirect("/lessons");
  }
  return user;
}
