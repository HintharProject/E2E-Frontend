import { Suspense } from "react";
import { apiFetch } from "@/services/api-client";
import { Subject, Level, Tag } from "@/types";
import { CreateLessonForm } from "@/components/features/lessons/create-lesson-form";
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

  if (!user) {
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
    <div className="mx-auto max-w-[52rem] space-y-6">
      <h1 className="sr-only">New lesson</h1>
      <Suspense fallback={<div className="h-64 rounded-xl bg-card border border-border animate-pulse" />}>
        <CreateLessonForm
          subjects={subjects}
          levels={levels}
          tags={tags}
        />
      </Suspense>
    </div>
  );
}
