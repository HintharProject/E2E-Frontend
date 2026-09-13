import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { getValidDevToken } from "@/lib/dev-auth";

export async function getServerAuthToken(): Promise<string | null> {
  let token: string | null = null;
  
  try {
    const cookieStore = await cookies();
    const devToken = cookieStore.get("dev_token")?.value;
    if (devToken) {
      token = getValidDevToken(devToken);
    }
  } catch {
    // Ignore cookie errors
  }

  if (!token) {
    try {
      const { getToken } = await auth();
      const clerkToken = await getToken();
      if (clerkToken) {
        token = clerkToken;
      }
    } catch {
      // Ignore auth errors
    }
  }

  return token;
}
