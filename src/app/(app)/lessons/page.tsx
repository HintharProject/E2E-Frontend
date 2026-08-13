import { LessonCard } from "@/components/content-cards";
import {
  Button,
  Field,
  FilterBar,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { getCurrentUser, lessons, levels, subjects, tags } from "@/lib/mock-data";

export default function LessonsBoardPage() {
  const user = getCurrentUser();
  const canCreate = user.role === "CREATOR" || user.role === "ADMIN";
  const published = lessons.filter((l) => l.state === "PUBLISHED");
  const followed = published.filter((l) => l.followedAuthor);
  const other = published.filter((l) => !l.followedAuthor);

  return (
    <div>
      <PageHeader
        title="Lessons"
        description="Followed creators first, then the rest of the board. Filter by subject, level, and tags."
        actions={
          canCreate ? <Button href="/lessons/new">New lesson</Button> : null
        }
      />
      <FilterBar>
        <Field label="Subject">
          <select className={inputClass} defaultValue="">
            <option value="">All</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Level">
          <select className={inputClass} defaultValue="">
            <option value="">All</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tag">
          <select className={inputClass} defaultValue="">
            <option value="">All</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      <h2 className="mb-3 font-display text-xl text-ink">From creators you follow</h2>
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        {followed.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>

      <h2 className="mb-3 font-display text-xl text-ink">More lessons</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {other.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
