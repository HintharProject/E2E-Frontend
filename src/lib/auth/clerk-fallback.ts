import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { AppUser } from "@/lib/types/user";

/** Minimal session when the Django API is unreachable (dev / cold start). */
export async function clerkFallbackUser(): Promise<AppUser> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  return {
    id: clerkUser.id,
    displayName:
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "User",
    imageUrl: clerkUser.imageUrl ?? "",
    role: "STUDENT",
    banState: "ACTIVE",
  };
}

export function allowClerkAuthFallback(): boolean {
  const flag = process.env.ALLOW_CLERK_AUTH_FALLBACK?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  // Default: allow fallback in local development when API is down
  return process.env.NODE_ENV === "development";
}
