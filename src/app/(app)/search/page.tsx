"use client";

import { useState, use } from "react";
import { LessonCard, PostCard } from "@/components/features/content-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { useSubjects, useLevels, useTags } from "@/hooks/use-metadata";
import { useInfinitePosts } from "@/hooks/use-posts";
import { useInfiniteLessons } from "@/hooks/use-lessons";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function SearchPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = use(props.searchParams);
  const initialQ = (searchParams?.q as string) || "";
  const initialType = (searchParams?.type as string) || "post";

  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState(initialType);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [postType, setPostType] = useState("");
  const [tag, setTag] = useState("");

  const isLesson = type === "lesson";

  const { data: subjects = [] } = useSubjects();
  const { data: levels = [] } = useLevels();
  const { data: tags = [] } = useTags();

  const { data: postData, isLoading: postsLoading } = useInfinitePosts({ search: q, subject, level, type: postType });
  const { data: lessonData, isLoading: lessonsLoading } = useInfiniteLessons({ search: q, subject, level });

  const postResults = postData?.pages.flatMap(p => p.data) || [];
  const lessonResults = lessonData?.pages.flatMap(p => p.data) || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Search"
        description="Title-only matching. Toggle Post vs Lesson — there is no unified search endpoint."
      />
      <form onSubmit={(e) => { e.preventDefault(); }}>
        <FilterBar>
          <Field label="Query">
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={inputClass}
              placeholder="Match titles…"
            />
          </Field>
          <Field label="Type">
            <select name="type" className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="post">Posts</option>
              <option value="lesson">Lessons</option>
            </select>
          </Field>
          <Field label="Subject">
            <select className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">All</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}>
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
              <select className={inputClass} value={postType} onChange={(e) => setPostType(e.target.value)}>
                <option value="">All</option>
                <option value="QUESTION">Question</option>
                <option value="SHARING">Sharing</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </Field>
          ) : (
            <Field label="Tag">
              <select className={inputClass} value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="">All</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </FilterBar>
      </form>

      {isLesson ? (
        lessonsLoading ? <p>Loading...</p> : lessonResults.length === 0 ? (
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
      ) : postsLoading ? <p>Loading...</p> : postResults.length === 0 ? (
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
