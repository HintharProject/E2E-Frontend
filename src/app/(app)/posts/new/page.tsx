import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { levels, subjects, tags } from "@/lib/mock-data";
import { currentUser } from "@clerk/nextjs/server";
import { isWriteLocked } from "@/types/user";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default async function NewPostPage() {
  const clerkUser = await currentUser();
  // fallback for UI testing without auth
  const user = clerkUser ? { role: "STUDENT", banState: "ACTIVE" } : { role: "ADMIN", banState: "ACTIVE" }; 

  const canAnnounce = user.role === "CREATOR" || user.role === "ADMIN";
  const subjectRequired = user.role === "STUDENT";
  const writeLocked = isWriteLocked(user.banState as any);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="New post"
        description={
          subjectRequired
            ? "Students must pick Question or Sharing, plus Subject and Level."
            : "Creators and Admins may post Announcements and omit Subject/Level."
        }
      />
      <form className="space-y-4 rounded-2xl border border-line bg-card p-6">
        <Field label="Post type">
          <select className={inputClass} defaultValue="QUESTION">
            <option value="QUESTION">Question</option>
            <option value="SHARING">Sharing</option>
            {canAnnounce ? (
              <option value="ANNOUNCEMENT">Announcement</option>
            ) : null}
          </select>
        </Field>
        <Field label="Title (max 100)">
          <input
            className={inputClass}
            maxLength={100}
            placeholder="Clear, searchable title"
            required
          />
        </Field>
        <Field label="Body (max 3000)">
          <textarea
            className={`${inputClass} min-h-40`}
            maxLength={3000}
            placeholder="Details, context, what you’ve already tried…"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Subject${subjectRequired ? " *" : " (optional)"}`}>
            <select className={inputClass} required={subjectRequired} defaultValue="">
              <option value="">Select…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Level${subjectRequired ? " *" : " (optional)"}`}>
            <select className={inputClass} required={subjectRequired} defaultValue="">
              <option value="">Select…</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Custom tags">
          <select className={inputClass} defaultValue="">
            <option value="">Autocomplete suggestions…</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Attachment (optional · max 1 · 5MB · jpg/png/pdf)">
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="text-sm" />
        </Field>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={writeLocked}>
            Publish (mock)
          </Button>
          <Button variant="secondary" nativeButton={false} render={<Link href="/forum" />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
