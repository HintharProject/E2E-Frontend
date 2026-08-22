import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { getLesson, levels, subjects, tags } from "@/lib/mock-data";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default async function EditLessonPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Edit lesson"
        description="Draft ↔ Published ↔ Archived state transitions."
      />
      <form className="space-y-4 rounded-2xl border border-line bg-card p-6">
        <Field label="Title">
          <input
            className={inputClass}
            maxLength={100}
            defaultValue={lesson.title}
          />
        </Field>
        <Field label="Body">
          <textarea
            className={`${inputClass} min-h-44`}
            maxLength={5000}
            defaultValue={lesson.body}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject *">
            <select className={inputClass} defaultValue={lesson.subjectId}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Level *">
            <select className={inputClass} defaultValue={lesson.levelId}>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Tags">
          <select className={inputClass} defaultValue={lesson.tagIds[0] ?? ""}>
            <option value="">None</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Embedded video URL">
          <input
            className={inputClass}
            defaultValue={lesson.embeddedVideoUrl ?? ""}
            type="url"
          />
        </Field>
        <Field label="State">
          <select className={inputClass} defaultValue={lesson.state}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>
        <div className="flex gap-2 pt-2">
          <Button type="submit">Save (mock)</Button>
          <Button variant="secondary" nativeButton={false} render={<Link href={`/lessons/${lesson.id}`} />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
