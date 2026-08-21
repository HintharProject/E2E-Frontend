import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isMockMode } from "@/lib/data-source";

export default async function HomePage() {
  if (isMockMode()) {
    redirect("/forum");
  }

  const { userId } = await auth();
  if (userId) {
    redirect("/forum");
  }
  redirect("/sign-in");
}
