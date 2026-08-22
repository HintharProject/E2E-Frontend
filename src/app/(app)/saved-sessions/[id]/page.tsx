import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  getLesson,
  getPost,
  getUser,
  savedSessions,
} from "@/lib/mock-data";

export default async function SavedSessionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = savedSessions.find((s) => s.id === id);
  if (!session) notFound();
  const owner = getUser(session.ownerId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={session.title}
        description={`Owned by ${owner?.displayName ?? "unknown"}`}
        actions={
          <>
            <Button variant="secondary">
              {session.isPublic ? "Make private" : "Make public"}
            </Button>
            <Button variant="ghost">Copy share URL</Button>
            <Button variant="destructive">Delete</Button>
          </>
        }
      />
      <div className="mb-6 flex gap-2">
        <Badge variant={session.isPublic ? "default" : "outline"}>
          {session.isPublic ? "Public" : "Private"}
        </Badge>
        <Badge variant="outline">/saved-sessions/{session.id}</Badge>
      </div>

      <h2 className="font-display text-lg text-ink">Posts</h2>
      <ul className="mt-2 space-y-2">
        {session.postIds.map((postId) => {
          const post = getPost(postId);
          if (!post) return null;
          return (
            <li key={postId}>
              <Link
                href={`/posts/${post.id}`}
                className="block rounded-xl border border-line bg-card px-4 py-3 hover:border-brand/40"
              >
                <p className="font-semibold text-ink">{post.title}</p>
                <p className="text-xs text-ink-muted">{post.postType}</p>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 font-display text-lg text-ink">Lessons</h2>
      <ul className="mt-2 space-y-2">
        {session.lessonIds.map((lessonId) => {
          const lesson = getLesson(lessonId);
          if (!lesson) return null;
          return (
            <li key={lessonId}>
              <Link
                href={`/lessons/${lesson.id}`}
                className="block rounded-xl border border-line bg-card px-4 py-3 hover:border-brand/40"
              >
                <p className="font-semibold text-ink">{lesson.title}</p>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <Button variant="secondary" nativeButton={false} render={<Link href="/saved-sessions" />}>
          Back to sessions
        </Button>
      </div>
    </div>
  );
}
