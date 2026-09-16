import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getServerAuthToken } from "@/lib/auth-server";

export default async function HomePage() {
  const token = await getServerAuthToken();
  if (token) {
    redirect("/forum");
  }

  try {
    const user = await currentUser();
    if (user) {
      redirect("/forum");
    }
  } catch {
    // Ignore auth lookup errors
  }

  redirect("/sign-in");
}
