import { PageHeader } from "@/components/ui/page-header";
import { apiFetch } from "@/services/api-client";
import { PaginatedResponse, Subject, Level, Tag } from "@/types";
import { CreateLessonForm } from "@/components/features/lessons/create-lesson-form";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { UserPublic } from "@/types";
import { getServerAuthToken } from "@/lib/auth-server";

export default async function NewLessonPage() {
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

  const [subjects, levels, tags] = await Promise.all([
    apiFetch<Subject[]>("/subjects/", token),
    apiFetch<Level[]>("/levels/", token),
    apiFetch<Tag[]>("/tags/", token)
  ]).catch(() => [
    [] as Subject[],
    [] as Level[],
    [] as Tag[]
  ] as [Subject[], Level[], Tag[]]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="New lesson"
        description="Subject and Level are required. Videos must be YouTube/playlist URLs — no direct video upload."
      />
      <CreateLessonForm 
        subjects={subjects} 
        levels={levels} 
        tags={tags} 
      />
    </div>
  );
}
