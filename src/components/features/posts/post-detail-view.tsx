"use client";

import { usePost } from "@/hooks/use-posts";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { PostInteractions } from "@/components/features/posts/post-interactions";
import { PostComments } from "@/components/features/comments/post-comments";
import { PostAuthorActions } from "@/components/features/posts/post-author-actions";
import { useUser } from "@clerk/nextjs";
import { PostAttachment } from "@/components/features/posts/post-attachment";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function PostDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="h-8 w-3/4 rounded-lg bg-card border border-line mb-2" />
      <div className="h-4 w-1/4 rounded bg-card border border-line mb-8" />
      <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-line" />
          <div className="h-4 w-32 rounded bg-line mt-2" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-4 w-full rounded bg-line" />
          <div className="h-4 w-full rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-line" />
        </div>
      </div>
      <div className="mt-10 space-y-4">
        <div className="h-6 w-32 rounded bg-card border border-line" />
        <div className="h-24 w-full rounded-xl bg-card border border-line" />
      </div>
    </div>
  );
}

export function PostDetailView({ postId }: { postId: string }) {
  const { data: post, isLoading, isError } = usePost(postId);
  const { user: clerkUser } = useUser();

  if (isLoading) return <PostDetailSkeleton />;

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-ink-muted">Could not load this post. It may have been deleted or you may not have access.</p>
      </div>
    );
  }

  const author = post.author_details;
  const subject = post.subject_details;
  const level = post.level_details;
  const tagNames = post.tags_data?.map(t => t.name) ?? [];
  const isAuthor = clerkUser?.id === author?.clerk_id;

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
          <PostAttachment url={post.attachment_url} />
        ) : null}

        <PostInteractions post={post} />
      </div>

      <PostComments postId={post.id} initialCount={post.comment_count ?? 0} />
    </div>
  );
}
