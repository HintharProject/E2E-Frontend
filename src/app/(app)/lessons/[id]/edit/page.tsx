import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "@/services/api-client";
import { Lesson, PaginatedResponse, Subject, Level, Tag } from "@/types";
import { isWriteLocked } from "@/types/user";
import { UpdateLessonForm } from "@/components/features/lessons/update-lesson-form";

export default async function EditLessonPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { getToken, userId } = await auth();
  const token = await getToken();

  if (!token) notFound();

  let lesson: Lesson;
  try {
    lesson = await apiFetch<Lesson>(`/lessons/${id}/`, token);
  } catch (error) {
    notFound();
  }
  
  const user = userId ? { role: "STUDENT", banState: "ACTIVE" } : { role: "ADMIN", banState: "ACTIVE" };
  
  // Verify permissions: only author or admin can edit
  if (user.role !== "ADMIN" && lesson.author !== userId) {
    notFound(); // Alternatively, show a permission denied page
  }

  const writeLocked = isWriteLocked(user.banState as "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN");

  const [subjects, levels, tags] = await Promise.all([
    apiFetch<Subject[]>("/subjects/", ""),
    apiFetch<Level[]>("/levels/", ""),
    apiFetch<Tag[]>("/tags/", token)
  ]).catch(() => [
    [] as Subject[],
    [] as Level[],
    [] as Tag[]
  ] as [Subject[], Level[], Tag[]]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Edit lesson"
        description="Draft ↔ Published ↔ Archived state transitions."
      />
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
