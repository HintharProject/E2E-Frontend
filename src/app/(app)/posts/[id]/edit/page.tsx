import { notFound } from "next/navigation";
import {
  Button,
  Field,
  PageHeader,
  inputClass,
} from "@/components/ui";
import {
  getCurrentUser,
  getPost,
  levels,
  subjects,
  tags,
} from "@/lib/mock-data";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) notFound();
  const user = getCurrentUser();
  const canAnnounce = user.role === "CREATOR" || user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit post" description="Owner-only mock edit form." />
      <form className="space-y-4 rounded-2xl border border-line bg-white p-6">
        <Field label="Post type">
          <select className={inputClass} defaultValue={post.postType}>
            <option value="QUESTION">Question</option>
            <option value="SHARING">Sharing</option>
            {canAnnounce ? (
              <option value="ANNOUNCEMENT">Announcement</option>
            ) : null}
          </select>
        </Field>
        <Field label="Title">
          <input
            className={inputClass}
            maxLength={100}
            defaultValue={post.title}
          />
        </Field>
        <Field label="Body">
          <textarea
            className={`${inputClass} min-h-40`}
            maxLength={3000}
            defaultValue={post.body}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject">
            <select
              className={inputClass}
              defaultValue={post.subjectId ?? ""}
            >
              <option value="">None</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select className={inputClass} defaultValue={post.levelId ?? ""}>
              <option value="">None</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Tags">
          <select className={inputClass} defaultValue={post.tagIds[0] ?? ""}>
            <option value="">None</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Save (mock)</Button>
          <Button href={`/posts/${post.id}`} variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
