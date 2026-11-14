"use client";

import { usePost } from "@/hooks/use-posts";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { PostInteractions } from "@/components/features/posts/post-interactions";
import { PostComments } from "@/components/features/comments/post-comments";
import { PostAuthorActions } from "@/components/features/posts/post-author-actions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { useUser } from "@clerk/nextjs";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import dynamic from "next/dynamic";
const LessonMediaViewer = dynamic(() => import("@/components/features/lessons/lesson-media-viewer").then(mod => mod.LessonMediaViewer), {
  loading: () => <div className="aspect-video w-full rounded-xl bg-card border border-border animate-pulse"></div>,
  ssr: false
});
import { BaseDetailedCard } from "@/components/ui/base-card";

function daysUntilExpiration(createdAt: string): number {
  const createdDate = new Date(createdAt);
  const expirationDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diffTime = expirationDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function PostDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      <div className="h-8 w-3/4 rounded-lg bg-card border border-border mb-2" />
      <div className="h-4 w-1/4 rounded bg-card border border-border mb-8" />
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted mt-2" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-10 space-y-4">
        <div className="h-6 w-32 rounded bg-card border border-border" />
        <div className="h-24 w-full rounded-xl bg-card border border-border" />
      </div>
    </div>
  );
}

export function PostDetailView({ postId }: { postId: string }) {
  const { data: post, isLoading, isError } = usePost(postId);
  const { user: clerkUser } = useUser();
  const { user } = useCurrentUser();

  if (isLoading) return <PostDetailSkeleton />;

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-muted-foreground">Could not load this post. It may have been deleted or you may not have access.</p>
      </div>
    );
  }

  const author = post.author_details;
  const subject = post.subject_details;
  const level = post.level_details;
  const tagNames = post.tags_data?.map(t => t.name) ?? [];
  const isAuthor = isContentAuthor(user || (clerkUser ? { clerk_id: clerkUser.id } : null), author, post.author);
  const expiresIn = daysUntilExpiration(post.created_at);

  const isImageAttachment = post.attachment_url && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(post.attachment_url);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={post.title}
        description={`Posted ${formatDate(post.created_at)}`}
        actions={isAuthor ? <PostAuthorActions postId={post.id} /> : undefined}
      />
      <BaseDetailedCard
        author={author ? {
          id: author.id || "",
          display_name: author.display_name || "Unknown",
          profile_image_url: author.profile_image_url,
          contributor_tier: author.contributor_tier ?? (author as any)?.reputation?.contributor_tier ?? 0,
        } : undefined}
        badges={
          <>
            <Badge variant="default">{post.post_type}</Badge>
            {expiresIn <= 3 ? (
              <Badge variant="warning" className="border-warning/30 bg-warning/10 text-warning">
                Expires in {expiresIn}d
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Expires in {expiresIn}d
              </Badge>
            )}
            {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
            {level ? <Badge variant="outline">{level.name}</Badge> : null}
            {tagNames.map((t) => (
              <TagBadge key={t} name={t} />
            ))}
          </>
        }
        body={post.body}
        mediaImages={
          isImageAttachment && post.attachment_url ? (
            <LessonMediaViewer
              imageAttachments={[{
                id: post.id,
                file_url: post.attachment_url,
                file_name: post.attachment_name || "Attachment",
                download_url: post.attachment_url,
                created_at: post.created_at,
              }]}
              youtubeUrl={null}
            />
          ) : undefined
        }
        fileAttachments={
          !isImageAttachment && post.attachment_url ? (
            <PostAttachment url={post.attachment_url} filename={post.attachment_name || "Attachment"} />
          ) : undefined
        }
        interactions={<PostInteractions post={post} />}
      />

      <PostComments postId={post.id} initialCount={post.comment_count ?? 0} />
    </div>
  );
}
