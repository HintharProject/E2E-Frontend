"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import type { Post, Lesson } from "@/types";
import { PostCardVote } from "./posts/post-card-vote";
import { useCurrentUser } from "@/hooks/use-current-user";
import { apiFetch } from "@/services/api-client";
import { LessonCardVote } from "./lessons/lesson-card-vote";
import { toast } from "sonner";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { useDeletePost } from "@/hooks/use-interactions";
import { useDeleteLesson, useUpdateLessonState } from "@/hooks/use-interactions";
import { BaseFeedCard } from "@/components/ui/base-card";


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
  const isAuthor = user?.id === author?.id;
  const isAdmin = user?.role === "ADMIN";
  const canModify = isAuthor || isAdmin;
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
    <BaseFeedCard
      href={`/posts/${post.id}`}
      onMouseEnter={handleMouseEnter}
      author={{
        id: author?.id || "",
        display_name: author?.display_name || "Unknown",
        profile_image_url: author?.profile_image_url,
      }}
      subtitle={`${formatDateStr(post.created_at)} · expires in ${expiresIn}d`}
      topRight={
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
      }
      title={post.title}
      body={post.body}
      bottomLeft={
        <>
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
          {tags.map((t) => (
            <Badge key={t.id} variant="outline">#{t.name}</Badge>
          ))}
        </>
      }
      bottomRight={
        post.post_type !== "ANNOUNCEMENT" ? (
          <>
            <PostCardVote postId={post.id} initialVoteCount={post.vote_count ?? 0} initialUserVote={post.user_vote} />
            <span>· {post.comment_count ?? 0} comments</span>
          </>
        ) : (
          <span>{post.comment_count ?? 0} comments</span>
        )
      }
      moreMenu={
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="POST"
          contentId={post.id}
          editHref={canModify ? `/posts/${post.id}/edit` : undefined}
          onDelete={canModify ? handleDelete : undefined}
          deleteLabel="this post"
        />
      }
    />
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

  const isAuthor = user?.id === author?.id;
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "TEACHER" || user?.role === "SENIOR_STUDENT";
  const canEdit = isCreator && isAuthor;
  const canDelete = isAdmin || (isCreator && isAuthor);
  const canChangeState = isAdmin || (isCreator && isAuthor);
  const canPublish = canChangeState && (lesson.state === "DRAFT" || lesson.state === "ARCHIVED");
  const canArchive = canChangeState && lesson.state === "PUBLISHED";

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

  return (
    <BaseFeedCard
      href={`/lessons/${lesson.id}`}
      onMouseEnter={handleMouseEnter}
      author={author ? {
        id: author.id || "",
        display_name: author.display_name || "Unknown",
        profile_image_url: author.profile_image_url,
      } : undefined}
      subtitle={author?.role === 'TEACHER' ? 'Teacher' : author?.role === 'SENIOR_STUDENT' ? 'Senior Student' : undefined}
      topRight={
        <div className="flex items-center gap-2">
          <Badge
            variant={
              lesson.state === "PUBLISHED"
                ? "default"
                : lesson.state === "DRAFT"
                  ? "secondary"
                  : "outline"
            }
            className={lesson.state === "DRAFT" ? "bg-warning/20 text-warning hover:bg-warning/30" : ""}
          >
            {lesson.state}
          </Badge>
          <LessonCardVote lessonId={lesson.id} initialVoteCount={lesson.vote_count ?? 0} initialUserVote={lesson.user_vote} />
        </div>
      }
      title={lesson.title}
      body={lesson.body}
      bottomLeft={
        <>
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
        </>
      }
      moreMenu={
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="LESSON"
          contentId={lesson.id}
          editHref={canEdit ? `/lessons/${lesson.id}/edit` : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          deleteLabel="this lesson"
          onPublish={canPublish ? handlePublish : undefined}
          onArchive={canArchive ? handleArchive : undefined}
        />
      }
    />
  );
}
