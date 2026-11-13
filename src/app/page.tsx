import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getServerAuthToken } from "@/lib/auth-server";
import AppLayout from "@/app/(app)/layout";
import { AcademicHub } from "@/components/features/home/academic-hub";

export default async function HomePage() {
  const token = await getServerAuthToken();
  if (token) {
    return (
      <AppLayout>
        <AcademicHub />
      </AppLayout>
    );
  }

  try {
    const user = await currentUser();
    if (user) {
      return (
        <AppLayout>
          <AcademicHub />
        </AppLayout>
      );
    }
  } catch {
    // Ignore auth lookup errors
  }

  redirect("/sign-in");
}
