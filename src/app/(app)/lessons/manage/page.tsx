import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LessonsTabs } from "@/components/features/lessons/lessons-tabs";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { LessonsFeed } from "@/components/features/lessons-feed";
import { parseFilterList } from "@/lib/filter-params";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { apiFetch } from "@/services/api-client";
import { UserPublic } from "@/types";
import { getServerAuthToken } from "@/lib/auth-server";

export default async function ManageLessonsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
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

  const stateStr = typeof searchParams?.state === "string" ? searchParams.state : undefined;
  const active = (stateStr?.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "PUBLISHED";
  
  const subjects = parseFilterList(searchParams?.subject);
  const levels = parseFilterList(searchParams?.level);
  const tagIds = parseFilterList(searchParams?.tags);

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title={isAdmin ? "Manage all lessons" : "My lessons"}
        description={isAdmin ? "Manage all Draft, Published, and Archived lessons across the platform." : "Manage your Draft, Published, and Archived lessons."}
        actions={!isAdmin ? <Button nativeButton={false} render={<Link href="/lessons/new" />}>New lesson</Button> : undefined}
      />
      <LessonsTabs />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense fallback={null}>
          <FilterSidebar showStateFilter={true} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <LessonsFeed 
            subjects={subjects} 
            levels={levels} 
            tagIds={tagIds} 
            onlyMine={!isAdmin} 
            state={active} 
          />
        </div>
      </div>
    </div>
  );
}
