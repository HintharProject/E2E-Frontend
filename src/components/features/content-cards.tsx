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

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

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
    <article
      className="group rounded-2xl border border-line bg-card p-5 transition hover:border-brand/35 hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)] relative"
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`}>
              <Avatar size="sm">
                {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
          <div>
            <Link
              href={`/users/${author?.id}`}
              className="text-sm font-semibold text-ink hover:text-brand-dark"
            >
              {author?.display_name}
            </Link>
            <p className="text-xs text-ink-muted">
              {formatDateStr(post.created_at)} · expires in {expiresIn}d
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
      <Link href={`/posts/${post.id}`} className="mt-3 block">
        <h2 className="font-display text-xl text-ink group-hover:text-brand-dark">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {stripHtml(post.body)}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
        {level ? <Badge variant="outline">{level.name}</Badge> : null}
        {tags.map((t) => (
          <Badge key={t.id} variant="outline">#{t.name}</Badge>
        ))}
        {post.post_type !== "ANNOUNCEMENT" ? (
          <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <PostCardVote postId={post.id} initialVoteCount={post.vote_count ?? 0} initialUserVote={post.user_vote} />
            <span>· {post.comment_count ?? 0} comments</span>
          </div>
        ) : (
          <span className="ml-auto text-xs font-semibold text-ink-muted">
            {post.comment_count ?? 0} comments
          </span>
        )}
      </div>
    </article>
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
    <article 
      className="rounded-2xl border border-line bg-card p-5 transition hover:border-brand/35 hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)]"
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-start justify-between gap-2">
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
        </div>
        <LessonCardVote lessonId={lesson.id} initialVoteCount={lesson.vote_count ?? 0} initialUserVote={lesson.user_vote} />
      </div>
      <Link href={`/lessons/${lesson.id}`} className="mt-3 block">
        <h2 className="font-display text-xl text-ink hover:text-brand-dark">
          {lesson.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{stripHtml(lesson.body)}</p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/users/${author?.id}`}
          className="text-xs font-semibold text-ink hover:text-brand-dark"
        >
          {author?.display_name}
        </Link>
        {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
        {level ? <Badge variant="outline">{level.name}</Badge> : null}
        {/* Lesson tags might not have names resolved in the basic schema, just IDs. For now, we omit them if they are just strings, or we map them. 
            The schema says Lesson.tags is an array of UUIDs (writeOnly mostly) or tags_data maybe missing. We'll leave them out if not mapped. */}
      </div>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-ink-muted hover:text-ink">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <LessonDetailActions lesson={lesson} />
        </div>
    </article>
  );
}
