"use client";

import Link from "next/link";
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
import { useDeletePost } from "@/hooks/use-interactions";
import { useDeleteLesson, useUpdateLessonState } from "@/hooks/use-interactions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { getInitials, stripHtml } from "@/components/ui/base-card";
import { SaveButton } from "@/components/features/collections/save-button";
import { Video, Paperclip } from "lucide-react";


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
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const deleteMutation = useDeletePost();

  const author = post.author_details;
  const isAuthor = isContentAuthor(user, author, post.author);
  const subject = post.subject_details;
  const level = post.level_details;
  const tags = post.tags_data || [];
  const expiresIn = daysUntilExpiration(post.created_at);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/posts/${post.id}`
    : `/posts/${post.id}`;

  // Prefetch post detail on hover so clicking feels instant
  const handleMouseEnter = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["post", post.id, "v2"],
      queryFn: async () => {
        const token = await getToken();
        if (!token) return post;
        return apiFetch<Post>(`/posts/${post.id}/?expand=author_details,subject_details,level_details,tags_data`, token);
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

  return (
    <Card
      className="group relative transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover"
      onMouseEnter={handleMouseEnter}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3 min-w-0">
          {author ? (
            <Link href={`/users/${author.id}`}>
              <Avatar size="sm">
                {author.profile_image_url && (
                  <AvatarImage src={author.profile_image_url} />
                )}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {author ? (
                <Link
                  href={`/users/${author.id}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {author.display_name}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-foreground">Unknown</span>
              )}
              {author ? (
                <ContributorBadge
                  tier={author.contributor_tier ?? (author as any)?.reputation?.contributor_tier ?? 0}
                  size="sm"
                />
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span>{formatDateStr(post.created_at)}</span>
              {expiresIn <= 3 ? (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0 leading-tight">
                  Expires in {expiresIn}d
                </Badge>
              ) : (
                <span>· expires in {expiresIn}d</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant={
              post.post_type === "ANNOUNCEMENT"
                ? "default"
                : post.post_type === "QUESTION"
                  ? "outline"
                  : "secondary"
            }
          >
            {post.post_type}
          </Badge>
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
            isHidden={(post as any).is_hidden}
            isLocked={(post as any).is_locked}
            editHref={isAuthor ? `/posts/${post.id}/edit` : undefined}
            onDelete={isAuthor ? handleDelete : undefined}
            deleteLabel="this post"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Link href={`/posts/${post.id}`} className="block group">
          <CardTitle className="group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-2">
            {stripHtml(post.body)}
          </CardDescription>
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
          {tags.map((t) => (
            <TagBadge key={t.id || t.name} name={t.name} id={t.id} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between pt-4 mt-1 border-t border-border/50 text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-2">
          {post.post_type !== "ANNOUNCEMENT" ? (
            <PostCardVote
              postId={post.id}
              initialVoteCount={post.vote_count ?? 0}
              initialUserVote={post.user_vote}
              authorId={author?.id || (typeof post.author === "string" ? post.author : undefined)}
              authorClerkId={author?.clerk_id}
            />
          ) : null}
          <span>· {post.comment_count ?? 0} comments</span>
        </div>
        <div className="flex items-center gap-1">
          <SaveButton entityType="post" entityId={post.id} variant="icon" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const { user } = useCurrentUser();
  const { getToken } = useAuth();
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
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["lesson", lesson.id, "v2"],
      queryFn: async () => {
        const token = await getToken();
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
  const syllabusParts = [
    level?.name,
    subject ? (subject.code ? `${subject.name} (${subject.code})` : subject.name) : null,
  ].filter(Boolean);
  const visibleTags = tags.slice(0, 3);

  return (
    <Card
      className="group relative flex h-full flex-col justify-between transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover"
      onMouseEnter={handleMouseEnter}
    >
      <div>
        {/* Top Syllabus & State Strip */}
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2.5 border-b border-border/50">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs font-medium text-muted-foreground">
              {syllabusParts.length > 0 ? syllabusParts.join(" · ") : "General Courseware"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
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
          </div>
        </CardHeader>

        {/* Title, Excerpt, Media Strip & Tags */}
        <CardContent className="pt-3.5 space-y-3">
          <Link
            href={`/lessons/${lesson.id}`}
            className="block group/link rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardTitle className="font-heading text-base font-semibold leading-snug text-foreground group-hover/link:text-primary transition-colors line-clamp-2">
              {lesson.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1.5 text-sm leading-relaxed">
              {stripHtml(lesson.body)}
            </CardDescription>
          </Link>

          {/* Media & Resource Indicators Strip */}
          {(hasVideo || attachmentCount > 0) && (
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
          )}

          {/* Tag Row (max 3) */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTags.map((t) => (
                <TagBadge key={t.id || t.name} name={t.name} id={t.id} />
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {/* Footer: Author + Vote + Save */}
      <CardFooter className="justify-between gap-2 pt-3.5 mt-4 border-t border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          {author ? (
            <Link
              href={`/users/${author.id}`}
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar size="sm">
                {author.profile_image_url && (
                  <AvatarImage src={author.profile_image_url} alt={author.display_name} />
                )}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {author ? (
                <Link
                  href={`/users/${author.id}`}
                  className="truncate text-xs font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {author.display_name}
                </Link>
              ) : (
                <span className="truncate text-xs font-semibold text-foreground">Unknown</span>
              )}
              {author ? (
                <ContributorBadge
                  tier={author.contributor_tier ?? (author as any)?.reputation?.contributor_tier ?? 0}
                  size="sm"
                  showInfoIcon={false}
                />
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground leading-tight">
              {formatDateStr(lesson.created_at)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <LessonCardVote
            lessonId={lesson.id}
            initialVoteCount={lesson.vote_count ?? 0}
            initialUserVote={lesson.user_vote}
            authorId={author?.id || (typeof lesson.author === "string" ? lesson.author : undefined)}
            authorClerkId={author?.clerk_id}
          />
          <SaveButton entityType="lesson" entityId={lesson.id} variant="icon" />
        </div>
      </CardFooter>
    </Card>
  );
}
