import { cookies } from "next/headers";
import { SHIM_DEV_USERS, getValidDevToken, getDevUserByToken } from "@/lib/dev-auth";

export const DEV_USERS = SHIM_DEV_USERS;

export async function auth() {
  let devToken: string | null = null;
  try {
    const cookieStore = await cookies();
    devToken = cookieStore.get("dev_token")?.value ?? null;
  } catch {
    // Non-request context
  }

  const validToken = getValidDevToken(devToken);
  const user = getDevUserByToken(validToken);

  return {
    userId: user.clerk_id,
    getToken: async () => validToken,
    sessionId: `sess_${user.id}`,
    protect: () => {},
  };
}

export async function currentUser() {
  const { userId } = await auth();
  const user = SHIM_DEV_USERS.find((u) => u.clerk_id === userId) || SHIM_DEV_USERS[0];
  return {
    id: user.clerk_id,
    firstName: user.display_name.split(" ")[0],
    lastName: user.display_name.split(" ")[1] || "",
    fullName: user.display_name,
    imageUrl: user.profile_image_url,
    emailAddresses: [{ emailAddress: user.email }],
  };
}

export function clerkMiddleware(_handler?: any) {
  return () => {};
}

export function createRouteMatcher(_routes: string[]) {
  return (_req: any) => false;
}
