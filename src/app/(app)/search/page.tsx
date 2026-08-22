import { LessonCard, PostCard } from "@/components/features/content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { lessons, levels, posts, subjects, tags } from "@/lib/mock-data";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = (searchParams?.q as string) || "";
  const type = (searchParams?.type as string) || "post";
  const query = q.trim().toLowerCase();
  const isLesson = type === "lesson";

  const postResults = posts.filter((p) =>
    query ? p.title.toLowerCase().includes(query) : true,
  );
  const lessonResults = lessons.filter(
    (l) =>
      l.state === "PUBLISHED" &&
      (query ? l.title.toLowerCase().includes(query) : true),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Search"
        description="Title-only matching. Toggle Post vs Lesson — there is no unified search endpoint."
      />
      <form>
        <FilterBar>
          <Field label="Query">
            <input
              name="q"
              defaultValue={q}
              className={inputClass}
              placeholder="Match titles…"
            />
          </Field>
          <Field label="Type">
            <select name="type" className={inputClass} defaultValue={type}>
              <option value="post">Posts</option>
              <option value="lesson">Lessons</option>
            </select>
          </Field>
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
          {!isLesson ? (
            <Field label="Post type">
              <select className={inputClass} defaultValue="">
                <option value="">All</option>
                <option value="QUESTION">Question</option>
                <option value="SHARING">Sharing</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </Field>
          ) : (
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
          )}
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Search
          </button>
        </FilterBar>
      </form>

      {isLesson ? (
        lessonResults.length === 0 ? (
          <EmptyState
            title="No lessons matched"
            description="Try another title keyword."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lessonResults.map((l) => (
              <LessonCard key={l.id} lesson={l} />
            ))}
          </div>
        )
      ) : postResults.length === 0 ? (
        <EmptyState
          title="No posts matched"
          description="Try another title keyword."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {postResults.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
