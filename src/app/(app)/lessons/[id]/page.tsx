import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { apiFetch } from "@/services/api-client";
import { Lesson } from "@/types";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default async function LessonDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) notFound();

  let lesson: Lesson;
  try {
    lesson = await apiFetch<Lesson>(`/lessons/${id}/`, token);
  } catch (error: any) {
    if (error?.status === 404) {
      notFound();
    }
    throw error;
  }

  const author = lesson.author_details;
  const subject = lesson.subject_details;
  const level = lesson.level_details;
  const tagNames = lesson.tags ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={lesson.title}
        description={`Published ${formatDate(lesson.created_at)} · no comments on lessons`}
        actions={
          <>
            <Button variant="secondary" nativeButton={false} render={<Link href={`/lessons/${lesson.id}/edit`} />}>
              Edit
            </Button>
            <Button variant="secondary">Archive</Button>
            <Button variant="destructive">Delete</Button>
          </>
        }
      />
      <article className="rounded-2xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`} className="flex items-center gap-2">
              <Avatar size="sm">
                 {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                 <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-ink">{author.display_name}</span>
            </Link>
          ) : null}
          <Badge variant="default">{lesson.state}</Badge>
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
          {tagNames.map((t) => (
            <Badge key={t} variant="outline">#{t}</Badge>
          ))}
        </div>
        <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
          {lesson.body}
        </p>
        {lesson.embedded_video_url ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-soft to-surface p-6 text-center">
              <div>
                <p className="font-display text-lg text-brand-dark">
                  Embedded video
                </p>
                <a
                  href={lesson.embedded_video_url}
                  className="mt-2 inline-block text-sm font-semibold text-ink underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {lesson.embedded_video_url}
                </a>
              </div>
            </div>
          </div>
        ) : null}
        {lesson.attachments.length > 0 ? (
          <ul className="mt-6 space-y-2">
            {lesson.attachments.map((file) => (
              <li
                key={file.id}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-brand-dark"
              >
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  {file.file_name}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary">▲ Upvote</Button>
          <Button variant="ghost">▼ Downvote</Button>
          <Button variant="secondary">Add to Study Plan</Button>
          <Button variant="secondary">Save to session</Button>
          <Button variant="ghost">Report</Button>
        </div>
      </article>
    </div>
  );
}
