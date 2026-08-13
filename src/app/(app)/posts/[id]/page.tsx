import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  PageHeader,
  inputClass,
} from "@/components/ui";
import {
  comments,
  daysUntil,
  formatDate,
  getLevel,
  getPost,
  getSubject,
  getTagNames,
  getUser,
} from "@/lib/mock-data";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) notFound();

  const author = getUser(post.authorId);
  const subject = getSubject(post.subjectId);
  const level = getLevel(post.levelId);
  const tagNames = getTagNames(post.tagIds);
  const postComments = comments.filter((c) => c.postId === post.id);
  const canVote = post.postType !== "ANNOUNCEMENT";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={post.title}
        description={`Posted ${formatDate(post.createdAt)} · expires in ${daysUntil(post.expiresAt)} days`}
        actions={
          <>
            <Button href={`/posts/${post.id}/edit`} variant="secondary">
              Edit
            </Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`} className="flex items-center gap-2">
              <Avatar src={author.imageUrl} name={author.displayName} />
              <span className="font-semibold">{author.displayName}</span>
            </Link>
          ) : null}
          <Badge tone="brand">{post.postType}</Badge>
          <Badge tone="warn">Expires in {daysUntil(post.expiresAt)}d</Badge>
          {subject ? <Badge tone="muted">{subject.name}</Badge> : null}
          {level ? <Badge tone="muted">{level.name}</Badge> : null}
          {tagNames.map((t) => (
            <Badge key={t}>#{t}</Badge>
          ))}
        </div>
        <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
          {post.body}
        </p>
        {post.attachmentName ? (
          <p className="mt-4 text-sm font-semibold text-brand-dark">
            Attachment: {post.attachmentName}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          {canVote ? (
            <>
              <Button variant="secondary">▲ Upvote ({post.voteScore})</Button>
              <Button variant="ghost">▼ Downvote</Button>
            </>
          ) : (
            <span className="text-sm text-ink-muted">
              Voting disabled on announcements
            </span>
          )}
          <Button variant="secondary">Save to session</Button>
          <Button variant="ghost">Share</Button>
          <Button variant="ghost">Report</Button>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">
          Comments ({postComments.length})
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Flat comments only — no nested replies.
        </p>
        <ul className="mt-4 space-y-3">
          {postComments.map((c) => {
            const cAuthor = getUser(c.authorId);
            return (
              <li
                key={c.id}
                className="rounded-xl border border-line bg-white/90 p-4"
              >
                <div className="flex items-center gap-2">
                  {cAuthor ? (
                    <Avatar
                      src={cAuthor.imageUrl}
                      name={cAuthor.displayName}
                      size="sm"
                    />
                  ) : null}
                  <span className="text-sm font-semibold">
                    {cAuthor?.displayName}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">{c.body}</p>
              </li>
            );
          })}
        </ul>
        <form className="mt-4 space-y-3 rounded-xl border border-line bg-white p-4">
          <textarea
            className={`${inputClass} min-h-24`}
            maxLength={1000}
            placeholder="Add a flat comment (max 1000)…"
          />
          <Button type="submit">Comment (mock)</Button>
        </form>
      </section>
    </div>
  );
}
