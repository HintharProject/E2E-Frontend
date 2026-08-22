import { PageHeader } from "@/components/ui/page-header";
import { apiFetch } from "@/services/api-client";
import { PaginatedResponse, Subject, Level, Tag } from "@/types";
import { CreateLessonForm } from "@/components/features/lessons/create-lesson-form";

export default async function NewLessonPage() {
  const [subjectsRes, levelsRes, tagsRes] = await Promise.all([
    apiFetch<PaginatedResponse<Subject>>("/subjects/", ""),
    apiFetch<PaginatedResponse<Level>>("/levels/", ""),
    apiFetch<PaginatedResponse<Tag>>("/tags/", "")
  ]).catch(() => [
    { data: [] as Subject[] },
    { data: [] as Level[] },
    { data: [] as Tag[] }
  ] as const);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="New lesson"
        description="Subject and Level are required. Videos must be YouTube/playlist URLs — no direct video upload."
      />
      <CreateLessonForm 
        subjects={subjectsRes.data} 
        levels={levelsRes.data} 
        tags={tagsRes.data} 
      />
    </div>
  );
}
