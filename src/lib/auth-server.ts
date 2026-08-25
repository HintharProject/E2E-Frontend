import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export async function getServerAuthToken(): Promise<string | null> {
  let token: string | null = null;
  
  try {
    const cookieStore = await cookies();
    const devToken = cookieStore.get("dev_token")?.value;
    if (devToken) {
      token = devToken;
    }
  } catch (e) {
    // Ignore cookie errors
  }

  if (!token) {
    try {
      const { getToken } = await auth();
      token = await getToken();
    } catch (e) {
      // Ignore auth errors
    }
  }

  return token;
}
