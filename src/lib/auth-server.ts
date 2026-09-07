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
  } catch (e) {
    // Ignore cookie errors
  }

  if (!token) {
    try {
      const { getToken } = await auth();
      const serverToken = await getToken();
      if (serverToken) {
        token = getValidDevToken(serverToken);
      }
    } catch (e) {
      // Ignore auth errors
    }
  }

  return token || getValidDevToken(null);
}
