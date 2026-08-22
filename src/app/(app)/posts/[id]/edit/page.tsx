import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { auth, currentUser } from "@clerk/nextjs/server";
import { apiFetch } from "@/services/api-client";
import { Post, PaginatedResponse, Subject, Level, Tag } from "@/types";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default async function EditPostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) notFound();

  let post: Post;
  try {
    post = await apiFetch<Post>(`/posts/${id}/`, token);
  } catch (error) {
    notFound();
  }
  
  const clerkUser = await currentUser();
  const user = clerkUser ? { role: "STUDENT" } : { role: "ADMIN" };
  const canAnnounce = user.role === "CREATOR" || user.role === "ADMIN";

  const [subjectsRes, levelsRes, tagsRes] = await Promise.all([
    apiFetch<PaginatedResponse<Subject>>("/subjects/", ""),
    apiFetch<PaginatedResponse<Level>>("/levels/", ""),
    apiFetch<PaginatedResponse<Tag>>("/tags/", "")
  ]).catch(() => [
    { data: [] as Subject[] },
    { data: [] as Level[] },
    { data: [] as Tag[] }
  ]);

  const subjects = subjectsRes.data;
  const levels = levelsRes.data;
  const tags = tagsRes.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="Edit post" description="Owner-only mock edit form." />
      <form className="space-y-4 rounded-2xl border border-line bg-card p-6">
        <Field label="Post type">
          <select className={inputClass} defaultValue={post.post_type}>
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
              defaultValue={post.subject ?? ""}
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
            <select className={inputClass} defaultValue={post.level ?? ""}>
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
          <select className={inputClass} defaultValue={post.tags_data?.[0]?.id ?? ""}>
            <option value="">None</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex gap-2 pt-2">
          <Button type="submit">Save (mock)</Button>
          <Button variant="secondary" nativeButton={false} render={<Link href={`/posts/${post.id}`} />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
