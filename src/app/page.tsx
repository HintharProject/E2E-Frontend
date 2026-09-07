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
    // In dev mode without Clerk keys
  }

  // In development, redirect directly to forum to display the app and quick account switcher
  redirect("/forum");
}
