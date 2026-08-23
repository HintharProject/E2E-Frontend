import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { daysUntil, formatDate } from "@/lib/utils";
import { apiFetch } from "@/services/api-client";
import { Post, PaginatedResponse } from "@/types";
import { PostInteractions } from "@/components/features/posts/post-interactions";
import { PostComments } from "@/components/features/comments/post-comments";
import { PostAuthorActions } from "@/components/features/posts/post-author-actions";

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
  const { getToken, userId } = await auth();
  const token = await getToken();
  
  if (!token) notFound();

  let post: Post;
  
  try {
    post = await apiFetch<Post>(`/posts/${id}/`, token);
  } catch (error: any) {
    if (error?.status === 404) {
      notFound();
    }
    throw error;
  }

  const author = post.author_details;
  const subject = post.subject_details;
  const level = post.level_details;
  const tagNames = post.tags_data?.map(t => t.name) ?? [];
  const isAuthor = userId === author?.clerk_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={post.title}
        description={`Posted ${formatDate(post.created_at)}`}
        actions={isAuthor ? <PostAuthorActions postId={post.id} /> : undefined}
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
        
        <PostInteractions post={post} />
      </div>

      <PostComments postId={post.id} initialCount={post.comment_count ?? 0} />
    </div>
  );
}
