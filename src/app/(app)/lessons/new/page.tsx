import {
  Button,
  Field,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { levels, subjects, tags } from "@/lib/mock-data";

export default function NewLessonPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New lesson"
        description="Subject and Level are required. Videos must be YouTube/playlist URLs — no direct video upload."
      />
      <form className="space-y-4 rounded-2xl border border-line bg-white p-6">
        <Field label="Title (max 100)">
          <input className={inputClass} maxLength={100} required />
        </Field>
        <Field label="Body (max 5000)">
          <textarea className={`${inputClass} min-h-44`} maxLength={5000} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject *">
            <select className={inputClass} required defaultValue="">
              <option value="">Select…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Level *">
            <select className={inputClass} required defaultValue="">
              <option value="">Select…</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Tags">
          <select className={inputClass} defaultValue="">
            <option value="">Optional…</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Embedded video URL (YouTube / playlist)">
          <input
            className={inputClass}
            placeholder="https://www.youtube.com/…"
            type="url"
          />
        </Field>
        <Field label="Resources (max 5 · 20MB · pdf/docx/pptx/zip)">
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.zip"
            className="text-sm"
          />
        </Field>
        <Field label="Initial state">
          <select className={inputClass} defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Save (mock)</Button>
          <Button href="/lessons/mine" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
