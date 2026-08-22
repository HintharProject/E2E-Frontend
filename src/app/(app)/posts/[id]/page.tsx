import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ThreadedComment } from "@/components/features/comments/threaded-comment";
import { daysUntil, formatDate } from "@/lib/utils";
import { apiFetch } from "@/services/api-client";
import { Post, Comment, PaginatedResponse } from "@/types";

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
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) notFound();

  let post: Post;
  let comments: Comment[] = [];

  try {
    post = await apiFetch<Post>(`/posts/${id}/`, token);
    const commentsRes = await apiFetch<PaginatedResponse<Comment>>(`/posts/${id}/comments/`, token);
    comments = commentsRes.data;
  } catch (error) {
    notFound();
  }

  const author = post.author_details;
  const subject = post.subject_details;
  const level = post.level_details;
  const tagNames = post.tags_data?.map(t => t.name) ?? [];
  const canVote = post.post_type !== "ANNOUNCEMENT";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={post.title}
        description={`Posted ${formatDate(post.created_at)}`}
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
                 {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                 <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-ink">{author.display_name}</span>
            </Link>
          ) : null}
          <Badge variant="default">{post.post_type}</Badge>
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
          {tagNames.map((t) => (
            <Badge key={t} variant="outline">#{t}</Badge>
          ))}
        </div>
        <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
          {post.body}
        </p>
        {post.attachment_url ? (
          <p className="mt-4 text-sm font-semibold text-brand-dark">
            <a href={post.attachment_url} target="_blank" rel="noopener noreferrer">View Attachment</a>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          {canVote ? (
            <>
              <Button variant="secondary">▲ Upvote ({post.vote_count ?? 0})</Button>
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
          Comments ({post.comment_count ?? comments.length})
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
          {comments.map((c) => {
            const cAuthor = c.author_details;
            return (
              <li key={c.id}>
                <ThreadedComment 
                  authorName={cAuthor?.display_name ?? "Unknown"} 
                  authorImage={cAuthor?.profile_image_url ?? undefined} 
                  authorInitials={getInitials(cAuthor?.display_name)}
                  content={c.body} 
                  timestamp={formatDate(c.created_at)}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
