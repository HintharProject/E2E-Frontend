"use client";

import Link from "next/link";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Post, Lesson } from "@/types";
import { PostCardVote } from "./posts/post-card-vote";
import { PostAuthorActions } from "./posts/post-author-actions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { apiFetch } from "@/services/api-client";
import { LessonDetailActions } from "./lessons/lesson-detail-actions";
import { LessonCardVote } from "./lessons/lesson-card-vote";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

import { BaseFeedCard } from "@/components/ui/base-card";


function daysUntilExpiration(createdAt: string): number {
  const createdDate = new Date(createdAt);
  const expirationDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diffTime = expirationDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function formatDateStr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export function PostCard({ post }: { post: Post }) {
  const { user } = useCurrentUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(false);

  const author = post.author_details;
  const isAuthor = user?.id === author?.id;
  const subject = post.subject_details;
  const level = post.level_details;
  const tags = post.tags_data || [];
  const expiresIn = daysUntilExpiration(post.created_at);

  // Prefetch post detail on hover so clicking feels instant
  const handleMouseEnter = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["post", post.id],
      queryFn: async () => {
        const token = await getToken();
        if (!token) return post; // fallback to card data if no token
        return apiFetch<Post>(`/posts/${post.id}/`, token);
      },
      staleTime: 5 * 60 * 1000,
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
        <>
          {isAuthor && <PostAuthorActions postId={post.id} />}
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
        </>
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
    />
  );
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const { user } = useCurrentUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(false);

  const author = lesson.author_details;
  const subject = lesson.subject_details;
  const level = lesson.level_details;

  const isAuthor = user?.id === author?.id;
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "CREATOR";
  const canEdit = isAdmin || (isCreator && isAuthor);

  const handleMouseEnter = () => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    queryClient.prefetchQuery({
      queryKey: ["lesson", lesson.id],
      queryFn: async () => {
        const token = await getToken();
        if (!token) return lesson;
        return apiFetch<Lesson>(`/lessons/${lesson.id}/`, token);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/lessons/${lesson.id}`);
    toast.success("Link copied to clipboard!");
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
      bottomRight={
        <>
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-ink-muted hover:text-ink">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <LessonDetailActions lesson={lesson} />
        </>
      }
    />
  );
}
