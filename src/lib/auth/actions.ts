"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MOCK_USER_COOKIE = "mock_user_id";

export async function switchMockUser(userId: string, redirectTo: string = "/forum"): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MOCK_USER_COOKIE, userId, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(redirectTo);
}

export async function setMockUserCookieOnly(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MOCK_USER_COOKIE, userId, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearMockUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MOCK_USER_COOKIE);
  redirect("/sign-in");
}
