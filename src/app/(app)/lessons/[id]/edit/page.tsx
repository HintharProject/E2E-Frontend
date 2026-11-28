import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { apiFetch } from "@/services/api-client";
import { Lesson, Subject, Level, Tag } from "@/types";
import { isWriteLocked, isContentAuthor } from "@/types/user";
import { fetchCurrentUser } from "@/services/user-service";
import { UpdateLessonForm } from "@/components/features/lessons/update-lesson-form";
import { getServerAuthToken } from "@/lib/auth-server";

export default async function EditLessonPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const token = await getServerAuthToken();

  if (!token) notFound();

  let lesson: Lesson;
  try {
    lesson = await apiFetch<Lesson>(`/lessons/${id}/?expand=attachments`, token);
  } catch {
    notFound();
  }

  const user = await fetchCurrentUser(token).catch(() => null);

  if (!user) {
    notFound();
  }

  // Verify permissions: strictly author can edit
  if (!isContentAuthor(user, lesson.author_details, lesson.author)) {
    notFound();
  }

  const writeLocked = isWriteLocked(user.ban_state);

  const [subjects, levels, tags] = await Promise.all([
    apiFetch<Subject[]>("/subjects/", token),
    apiFetch<Level[]>("/levels/", token),
    apiFetch<Tag[]>("/tags/", token),
  ]).catch(
    () => [[], [], []] as [Subject[], Level[], Tag[]]
  );

  return (
    <div className="mx-auto max-w-[52rem] space-y-6">
      <h1 className="sr-only">Edit lesson</h1>
      {writeLocked && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            Your account is currently restricted from write actions. You can review this lesson,
            but saving edits or modifying attachments is disabled.
          </p>
        </div>
      )}
      <UpdateLessonForm
        lesson={lesson}
        subjects={subjects}
        levels={levels}
        tags={tags}
        writeLocked={writeLocked}
      />
    </div>
  );
}
