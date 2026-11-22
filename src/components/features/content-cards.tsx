"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import type { Post, Lesson } from "@/types";
import { PostCardVote } from "./posts/post-card-vote";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor } from "@/types/user";
import { apiFetch } from "@/services/api-client";
import { LessonCardVote } from "./lessons/lesson-card-vote";
import { toast } from "sonner";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { useDeletePost, useDeleteLesson, useUpdateLessonState } from "@/hooks/use-interactions";
import { BaseFeedCard } from "@/components/ui/base-card";
import { SaveButton } from "@/components/features/collections/save-button";
import { Video, Paperclip, MessageSquareText, BookOpenText, Megaphone } from "lucide-react";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";


function formatDateStr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntilExpiration(createdAt: string): number {
  const createdDate = new Date(createdAt);
  const expirationDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diffTime = expirationDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function PostCard({ post }: { post: Post }) {
  const { user } = useCurrentUser();
  const { getToken } = useAuth();
  const { isSignedIn } = useAuthGate();
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const deleteMutation = useDeletePost();

  const author = post.author_details;
  const isAuthor = isContentAuthor(user, author, post.author);
  const subject = post.subject_details;
  const level = post.level_details;
  const tags = (post.tags_data || []).slice(0, 3);
  const expiresIn = daysUntilExpiration(post.created_at);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/posts/${post.id}`
    : `/posts/${post.id}`;

  // Prefetch post detail on hover so clicking feels instant
  const handleMouseEnter = () => {
    if (prefetchedRef.current || !isSignedIn) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["post", post.id, isSignedIn ? "auth" : "guest", "v2"],
      queryFn: async () => {
        const token = isSignedIn ? await getToken().catch(() => null) : null;
        return apiFetch<Post>(`/posts/${post.id}/?expand=author_details,subject_details,level_details,tags_data`, token || undefined);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleDelete = async () => {
    toast.promise(deleteMutation.mutateAsync(post.id), {
      loading: "Deleting post...",
      success: () => {
        router.push("/forum");
        return "Post deleted successfully";
      },
      error: "Failed to delete post. Please try again.",
    });
  };

  const hasTaxonomy = Boolean(subject || level || tags.length > 0 || post.attachment_url);

  return (
    <BaseFeedCard
      href={`/posts/${post.id}`}
      onMouseEnter={handleMouseEnter}
      author={
        author
          ? {
              id: author.id,
              display_name: author.display_name,
              profile_image_url: author.profile_image_url,
              contributor_tier:
                author.contributor_tier ?? author.reputation?.contributor_tier ?? 0,
            }
          : null
      }
      subtitle={
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{formatDateStr(post.created_at)}</span>
          {expiresIn <= 3 ? (
            <Badge variant="warning" className="font-mono tabular-nums text-[10px] px-1.5 py-0 leading-tight">
              Expires in {expiresIn}d
            </Badge>
          ) : (
            <span>
              · <span className="font-mono tabular-nums">{expiresIn}d</span> left
            </span>
          )}
        </div>
      }
      topRight={
        <>
          {post.post_type === "QUESTION" && (
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary text-xs">
              <MessageSquareText className="size-3" aria-hidden="true" />
              Question
            </Badge>
          )}
          {post.post_type === "SHARING" && (
            <Badge variant="outline" className="gap-1 border-warning/35 bg-warning/10 text-warning text-xs">
              <BookOpenText className="size-3" aria-hidden="true" />
              Sharing
            </Badge>
          )}
          {post.post_type === "ANNOUNCEMENT" && (
            <Badge variant="warning" className="gap-1 text-xs">
              <Megaphone className="size-3" aria-hidden="true" />
              Notice
            </Badge>
          )}
        </>
      }
      moreMenu={
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="POST"
          contentId={post.id}
          author={author ? {
            id: author.id,
            display_name: author.display_name,
            role: author.role,
            contributor_tier: author.contributor_tier,
          } : null}
          isHidden={post.is_hidden}
          isLocked={post.is_locked}
          editHref={isAuthor ? `/posts/${post.id}/edit` : undefined}
          onDelete={isAuthor ? handleDelete : undefined}
          deleteLabel="this post"
        />
      }
      title={post.title}
      titleAs="h3"
      body={post.body}
      taxonomy={
        hasTaxonomy ? (
          <>
            {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
            {level ? <Badge variant="outline">{level.name}</Badge> : null}
            {tags.map((t) => (
              <TagBadge key={t.id || t.name} name={t.name} id={t.id} />
            ))}
            {post.attachment_url && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border bg-muted/30 rounded-md px-2 py-0.5">
                <Paperclip className="size-3" aria-hidden="true" />
                {post.attachment_name || "Attachment"}
              </span>
            )}
          </>
        ) : undefined
      }
      bottomLeft={
        <>
          {post.post_type !== "ANNOUNCEMENT" ? (
            <PostCardVote
              postId={post.id}
              initialVoteCount={post.vote_count ?? 0}
              initialUserVote={post.user_vote}
              authorId={author?.id || (typeof post.author === "string" ? post.author : undefined)}
              authorClerkId={author?.clerk_id}
            />
          ) : null}
          <span className="font-mono tabular-nums">
            {post.post_type !== "ANNOUNCEMENT" ? "· " : ""}
            {post.comment_count ?? 0} comments
          </span>
        </>
      }
      bottomRight={<SaveButton entityType="post" entityId={post.id} variant="icon" />}
    />
  );
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const { user } = useCurrentUser();
  const { getToken } = useAuth();
  const { requireAuth, isSignedIn } = useAuthGate();
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(false);
  const deleteMutation = useDeleteLesson();
  const stateMutation = useUpdateLessonState();

  const author = lesson.author_details;
  const subject = lesson.subject_details;
  const level = lesson.level_details;
  const tags = lesson.tags_data || [];

  const isAuthor = isContentAuthor(user, author, lesson.author);
  const canEdit = isAuthor;
  const canDelete = isAuthor;
  const canPublish = isAuthor && (lesson.state === "DRAFT" || lesson.state === "ARCHIVED");
  const canArchive = isAuthor && lesson.state === "PUBLISHED";

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/lessons/${lesson.id}`
    : `/lessons/${lesson.id}`;

  const handleMouseEnter = () => {
    if (prefetchedRef.current || !isSignedIn) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["lesson", lesson.id, "v2"],
      queryFn: async () => {
        const token = await getToken().catch(() => null);
        if (!token) return lesson;
        return apiFetch<Lesson>(`/lessons/${lesson.id}/?expand=author_details,attachments`, token);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleDelete = async () => {
    toast.promise(deleteMutation.mutateAsync(lesson.id), {
      loading: "Deleting lesson...",
      success: "Lesson deleted successfully",
      error: "Failed to delete lesson. Please try again.",
    });
  };

  const handlePublish = async () => {
    toast.promise(
      stateMutation.mutateAsync({ lessonId: lesson.id, state: "PUBLISHED" }),
      {
        loading: "Publishing lesson...",
        success: "Lesson published successfully",
        error: "Failed to publish lesson. Please try again.",
      }
    );
  };

  const handleArchive = async () => {
    toast.promise(
      stateMutation.mutateAsync({ lessonId: lesson.id, state: "ARCHIVED" }),
      {
        loading: "Archiving lesson...",
        success: "Lesson archived successfully",
        error: "Failed to archive lesson. Please try again.",
      }
    );
  };

  const hasVideo = Boolean(lesson.embedded_video_url);
  const attachmentCount = lesson.attachments?.length ?? 0;
  const visibleTags = tags.slice(0, 3);
  const subjectLabel = subject
    ? subject.code
      ? `${subject.name} (${subject.code})`
      : subject.name
    : null;

  return (
    <BaseFeedCard
      href={`/lessons/${lesson.id}`}
      contentPrefetch={isSignedIn ? undefined : false}
      onContentLinkClick={(e) => {
        if (
          !requireAuth(undefined, {
            actionLabel: "open the full lesson",
            redirectUrl: `/lessons/${lesson.id}`,
          })
        ) {
          e.preventDefault();
        }
      }}
      onMouseEnter={handleMouseEnter}
      className="h-full"
      author={
        author
          ? {
              id: author.id,
              display_name: author.display_name,
              profile_image_url: author.profile_image_url,
              contributor_tier:
                author.contributor_tier ?? author.reputation?.contributor_tier ?? 0,
            }
          : null
      }
      subtitle={formatDateStr(lesson.created_at)}
      topRight={
        <Badge
          variant={
            lesson.state === "PUBLISHED"
              ? "secondary"
              : lesson.state === "DRAFT"
                ? "warning"
                : "outline"
          }
          className="text-xs px-2 py-0 h-5"
        >
          {lesson.state === "PUBLISHED"
            ? "Published"
            : lesson.state === "DRAFT"
              ? "Draft"
              : "Archived"}
        </Badge>
      }
      moreMenu={
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="LESSON"
          contentId={lesson.id}
          author={author ? {
            id: author.id,
            display_name: author.display_name,
            role: author.role,
            contributor_tier: author.contributor_tier,
          } : null}
          isHidden={lesson.state === "DRAFT"}
          editHref={canEdit ? `/lessons/${lesson.id}/edit` : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          deleteLabel="this lesson"
          onPublish={canPublish ? handlePublish : undefined}
          onArchive={canArchive ? handleArchive : undefined}
        />
      }
      title={lesson.title}
      titleAs="h3"
      body={lesson.body}
      extraContent={
        hasVideo || attachmentCount > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {hasVideo && (
              <Badge
                variant="default"
                className="text-xs font-medium gap-1 px-2 py-0.5 h-5"
              >
                <Video className="size-3" aria-hidden="true" />
                <span>Video Lecture</span>
              </Badge>
            )}
            {attachmentCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs font-medium gap-1 px-2 py-0.5 h-5 bg-muted/40"
              >
                <Paperclip className="size-3" aria-hidden="true" />
                <span>
                  {attachmentCount} {attachmentCount === 1 ? "Resource" : "Resources"}
                </span>
              </Badge>
            )}
          </div>
        ) : undefined
      }
      taxonomy={
        <>
          {subjectLabel ? (
            <Badge variant="outline">{subjectLabel}</Badge>
          ) : !level ? (
            <Badge variant="outline">General Courseware</Badge>
          ) : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
          {visibleTags.map((t) => (
            <TagBadge key={t.id || t.name} name={t.name} id={t.id} />
          ))}
        </>
      }
      bottomLeft={
        <LessonCardVote
          lessonId={lesson.id}
          initialVoteCount={lesson.vote_count ?? 0}
          initialUserVote={lesson.user_vote}
          authorId={author?.id || (typeof lesson.author === "string" ? lesson.author : undefined)}
          authorClerkId={author?.clerk_id}
        />
      }
      bottomRight={<SaveButton entityType="lesson" entityId={lesson.id} variant="icon" />}
    />
  );
}
