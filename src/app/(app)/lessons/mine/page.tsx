import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SubNav } from "@/components/ui/sub-nav";
import { LessonsFeed } from "@/components/features/lessons-feed";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { apiFetch } from "@/services/api-client";
import { UserPublic } from "@/types";
import { getServerAuthToken } from "@/lib/auth-server";

export default async function MyLessonsPage(props: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const searchParams = await props.searchParams;
  
  const token = await getServerAuthToken();

  if (!token) {
    redirect("/sign-in");
  }

  let user: UserPublic | null = null;
  try {
    user = await apiFetch<UserPublic>("/users/me/", token);
  } catch {
    // Ignore, let user be null
  }

  if (!user || (user.role !== "CREATOR" && user.role !== "ADMIN")) {
    notFound();
  }

  const state = searchParams?.state;
  const active =
    (state?.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="My lessons"
        description="Manage your Draft, Published, and Archived lessons."
        actions={<Button nativeButton={false} render={<Link href="/lessons/new" />}>New lesson</Button>}
      />
      <SubNav
        items={[
          {
            href: "/lessons/mine?state=DRAFT",
            label: "Draft",
            active: active === "DRAFT",
          },
          {
            href: "/lessons/mine?state=PUBLISHED",
            label: "Published",
            active: active === "PUBLISHED",
          },
          {
            href: "/lessons/mine?state=ARCHIVED",
            label: "Archived",
            active: active === "ARCHIVED",
          },
        ]}
      />
      <div className="mt-6">
        <LessonsFeed subjects={[]} levels={[]} tagIds={[]} onlyMine state={active} />
      </div>
    </div>
  );
}
