import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ThreadedComment } from "@/components/features/comments/threaded-comment";
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

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default async function PostDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const post = getPost(id);
  if (!post) notFound();

  const author = getUser(post.authorId);
  const subject = getSubject(post.subjectId);
  const level = getLevel(post.levelId);
  const tagNames = getTagNames(post.tagIds);
  const postComments = comments.filter((c) => c.postId === post.id);
  const canVote = post.postType !== "ANNOUNCEMENT";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={post.title}
        description={`Posted ${formatDate(post.createdAt)} · expires in ${daysUntil(post.expiresAt)} days`}
        actions={
          <>
            <Button variant="secondary" nativeButton={false} render={<Link href={`/posts/${post.id}/edit`} />}>
              Edit
            </Button>
            <Button variant="destructive">Delete</Button>
          </>
        }
      />
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`} className="flex items-center gap-2">
              <Avatar size="sm">
                 {author.imageUrl && <AvatarImage src={author.imageUrl} />}
                 <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-ink">{author.displayName}</span>
            </Link>
          ) : null}
          <Badge variant="default">{post.postType}</Badge>
          <Badge variant="secondary" className="bg-warning/20 text-warning">Expires in {daysUntil(post.expiresAt)}d</Badge>
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
          {tagNames.map((t) => (
            <Badge key={t} variant="outline">#{t}</Badge>
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
        
        <form className="mt-4 mb-8 space-y-3 rounded-xl border border-line bg-card p-4">
          <textarea
            className={`${inputClass} min-h-24`}
            maxLength={1000}
            placeholder="Write a comment..."
          />
          <Button type="submit">Post comment</Button>
        </form>

        <ul className="mt-4 space-y-3">
          {postComments.map((c) => {
            const cAuthor = getUser(c.authorId);
            return (
              <li key={c.id}>
                {/* Note: The UI_MIGRATION_SPECS states threaded comments override the flat comments spec in proto */}
                <ThreadedComment 
                  authorName={cAuthor?.displayName ?? "Unknown"} 
                  authorImage={cAuthor?.imageUrl} 
                  authorInitials={getInitials(cAuthor?.displayName)}
                  content={c.body} 
                  timestamp={formatDate(c.createdAt)}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
