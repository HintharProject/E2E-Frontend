import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  PageHeader,
} from "@/components/ui";
import {
  formatDate,
  getLesson,
  getLevel,
  getSubject,
  getTagNames,
  getUser,
} from "@/lib/mock-data";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  const author = getUser(lesson.authorId);
  const subject = getSubject(lesson.subjectId);
  const level = getLevel(lesson.levelId);
  const tagNames = getTagNames(lesson.tagIds);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={lesson.title}
        description={`Published ${formatDate(lesson.createdAt)} · no comments on lessons`}
        actions={
          <>
            <Button href={`/lessons/${lesson.id}/edit`} variant="secondary">
              Edit
            </Button>
            <Button variant="secondary">Archive</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`} className="flex items-center gap-2">
              <Avatar src={author.imageUrl} name={author.displayName} />
              <span className="font-semibold">{author.displayName}</span>
            </Link>
          ) : null}
          <Badge tone="brand">{lesson.state}</Badge>
          {subject ? <Badge tone="muted">{subject.name}</Badge> : null}
          {level ? <Badge tone="muted">{level.name}</Badge> : null}
          {tagNames.map((t) => (
            <Badge key={t}>#{t}</Badge>
          ))}
        </div>
        <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed">
          {lesson.body}
        </p>
        {lesson.embeddedVideoUrl ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-soft to-surface p-6 text-center">
              <div>
                <p className="font-display text-lg text-brand-dark">
                  Embedded video
                </p>
                <a
                  href={lesson.embeddedVideoUrl}
                  className="mt-2 inline-block text-sm font-semibold text-ink underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {lesson.embeddedVideoUrl}
                </a>
              </div>
            </div>
          </div>
        ) : null}
        {lesson.attachments.length > 0 ? (
          <ul className="mt-6 space-y-2">
            {lesson.attachments.map((file) => (
              <li
                key={file}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-brand-dark"
              >
                {file}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary">▲ Upvote ({lesson.voteScore})</Button>
          <Button variant="ghost">▼ Downvote</Button>
          <Button variant="secondary">Add to Study Plan</Button>
          <Button variant="secondary">Save to session</Button>
          <Button variant="ghost">Report</Button>
        </div>
      </article>
    </div>
  );
}
