"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronUp, ChevronDown, Paperclip, Share2, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MathRenderer } from "@/components/ui/math-renderer";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { getInitials } from "@/components/ui/base-card";
import { formatDate } from "@/lib/utils";
import { LessonDetailActions } from "@/components/features/lessons/lesson-detail-actions";
import dynamic from "next/dynamic";
const LessonMediaViewer = dynamic(
  () => import("@/components/features/lessons/lesson-media-viewer").then((mod) => mod.LessonMediaViewer),
  {
    loading: () => <div className="aspect-video w-full rounded-xl bg-card border border-border animate-pulse" />,
    ssr: false,
  }
);
import LessonDetailLoading from "@/app/(app)/lessons/[id]/loading";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { useLesson } from "@/hooks/use-lessons";
import { SaveButton } from "@/components/features/collections/save-button";
import { toast } from "sonner";
import { useVoteLesson } from "@/hooks/use-interactions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isContentAuthor, isWriteLocked } from "@/types/user";
import { ReportModal } from "@/components/features/moderation/report-modal";

export function LessonDetailClient({ id }: { id: string }) {
  const { user: currentUser } = useCurrentUser();
  const voteMutation = useVoteLesson();
  const [reportOpen, setReportOpen] = useState(false);

  const { data: lesson, isLoading, isError } = useLesson(id);

  const author = lesson?.author_details;
  const isAuthor = isContentAuthor(currentUser, author, lesson?.author);
  const writeLocked = isWriteLocked(currentUser?.ban_state);

  const [localVoteCount, setLocalVoteCount] = useState(0);
  const [localUserVote, setLocalUserVote] = useState(0);
  // Prevents the useEffect prop-sync from overwriting optimistic state while in-flight
  const isPendingRef = useRef(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  useEffect(() => {
    if (lesson && !isPendingRef.current) {
      setLocalVoteCount(lesson.vote_count ?? 0);
      setLocalUserVote(lesson.user_vote ?? 0);
    }
  }, [lesson]);

  const userWeight =
    currentUser?.contributor_tier !== undefined ? currentUser.contributor_tier + 1 : 1;

  const handleVote = (value: 1 | -1 | 0) => {
    if (writeLocked) {
      toast.error("Your account is in read-only mode and cannot vote.");
      return;
    }
    if (isAuthor) {
      toast.info("You cannot vote on your own lesson.");
      return;
    }
    if (localUserVote === value || !lesson) return;
    const prevVote = localUserVote;
    const prevCount = localVoteCount;
    const diff = (value - prevVote) * userWeight;
    setLocalUserVote(value);
    setLocalVoteCount((prev) => prev + diff);

    isPendingRef.current = true;
    voteMutation.mutate(
      { lessonId: lesson.id, value, voteWeight: userWeight },
      {
        onSettled: () => {
          isPendingRef.current = false;
        },
        onError: () => {
          setLocalUserVote(prevVote);
          setLocalVoteCount(prevCount);
          toast.error("Failed to register vote.");
        },
      }
    );
  };

  if (isLoading) return <LessonDetailLoading />;

  if (isError || !lesson) {
    return (
      <div className="mx-auto max-w-3xl py-10 space-y-4">
        <Link
          href="/lessons"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to Lessons Catalog
        </Link>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">Could not load this lesson.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            It may have been removed, set to draft, or you may need to refresh.
          </p>
        </div>
      </div>
    );
  }

  const subject = lesson.subject_details;
  const level = lesson.level_details;
  const tagItems =
    (lesson.tags_data && lesson.tags_data.length > 0
      ? lesson.tags_data
      : (lesson.tags ?? []).map((name) => ({ id: name, name }))) || [];

  const imageAttachments =
    lesson.attachments?.filter((att) => {
      const ext = att?.file_name?.split(".").pop()?.toLowerCase() || "";
      return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  const otherAttachments =
    lesson.attachments?.filter((att) => {
      const ext = att?.file_name?.split(".").pop()?.toLowerCase() || "";
      return !["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    }) || [];

  return (
    <article className="mx-auto max-w-3xl py-2 sm:py-4 space-y-8">
      {/* Top Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/lessons"
            className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Lessons Catalog</span>
          </Link>
          {subject && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={`/lessons?subject=${subject.id}`}
                className="font-medium text-foreground hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {subject.name}
                {subject.code ? ` (${subject.code})` : ""}
              </Link>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LessonDetailActions lesson={lesson} />
        </div>
      </div>

      {/* Editorial Reader Header */}
      <header className="space-y-4 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {level && (
            <Badge variant="outline" className="font-mono text-xs">
              {level.name}
            </Badge>
          )}
          {subject && (
            <Badge variant="outline" className="font-medium text-xs">
              {subject.name}
              {subject.code ? ` (${subject.code})` : ""}
            </Badge>
          )}
          <Badge
            variant={
              lesson.state === "PUBLISHED"
                ? "secondary"
                : lesson.state === "DRAFT"
                  ? "warning"
                  : "outline"
            }
          >
            {lesson.state === "PUBLISHED"
              ? "Published"
              : lesson.state === "DRAFT"
                ? "Draft"
                : lesson.state}
          </Badge>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground text-balance leading-[1.15]">
          {lesson.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            {author ? (
              <Link
                href={`/users/${author.id}`}
                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar size="default">
                  {author.profile_image_url && (
                    <AvatarImage src={author.profile_image_url} alt={author.display_name} />
                  )}
                  <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
                </Avatar>
              </Link>
            ) : null}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {author ? (
                  <Link
                    href={`/users/${author.id}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {author.display_name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-foreground">Unknown Author</span>
                )}
                {author && (
                  <ContributorBadge
                    tier={author.contributor_tier ?? (author as any)?.reputation?.contributor_tier ?? 0}
                    size="sm"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Published {formatDate(lesson.created_at)} · Structured courseware (comments disabled)
              </p>
            </div>
          </div>

          <SaveButton
            entityType="lesson"
            entityId={lesson.id}
            variant="secondary"
            size="sm"
            showLabel
            label="Add to Study Plan"
            defaultTab="plan"
          />
        </div>

        {tagItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {tagItems.map((t) => (
              <TagBadge key={t.id || t.name} name={t.name} id={t.id} />
            ))}
          </div>
        )}
      </header>

      {/* Embedded YouTube Player / Image Gallery */}
      {(imageAttachments.length > 0 || lesson.embedded_video_url) && (
        <section aria-label="Lesson media">
          <LessonMediaViewer
            imageAttachments={imageAttachments}
            youtubeUrl={lesson.embedded_video_url}
          />
        </section>
      )}

      {/* Distraction-Free Reading Body (Prose + LaTeX) */}
      <section
        aria-label="Lesson content"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm"
      >
        <div className="mx-auto max-w-[70ch]">
          <MathRenderer
            content={lesson.body}
            className="text-base leading-[1.75] text-foreground [overflow-wrap:anywhere]"
          />
        </div>
      </section>

      {/* Downloadable Attachments Card List */}
      {otherAttachments.length > 0 && (
        <section
          aria-labelledby="lesson-attachments-heading"
          className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3"
        >
          <h2
            id="lesson-attachments-heading"
            className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground"
          >
            <Paperclip className="size-4 text-primary" aria-hidden="true" />
            <span>Downloadable Resources ({otherAttachments.length})</span>
          </h2>
          <div className="flex flex-col gap-2">
            {otherAttachments.map((file) => (
              <PostAttachment
                key={file.id}
                url={file.file_url}
                downloadUrl={file.download_url}
                filename={file.file_name}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bottom Reader Action Bar */}
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={localUserVote === 1 ? "default" : "secondary"}
            disabled={isAuthor || writeLocked}
            title={
              writeLocked
                ? "Read-only mode"
                : isAuthor
                  ? "You cannot vote on your own lesson"
                  : "Upvote lesson"
            }
            className="gap-1.5 min-h-[44px] sm:min-h-[38px]"
            onClick={() => handleVote(localUserVote === 1 ? 0 : 1)}
          >
            <ChevronUp className="size-4" aria-hidden="true" />
            <span className="tabular-nums">Upvote ({localVoteCount})</span>
          </Button>

          <Button
            type="button"
            variant={localUserVote === -1 ? "default" : "ghost"}
            disabled={isAuthor || writeLocked}
            title={
              writeLocked
                ? "Read-only mode"
                : isAuthor
                  ? "You cannot vote on your own lesson"
                  : "Downvote lesson"
            }
            className="gap-1.5 min-h-[44px] sm:min-h-[38px]"
            onClick={() => handleVote(localUserVote === -1 ? 0 : -1)}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
            <span>Downvote</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SaveButton
            entityType="lesson"
            entityId={lesson.id}
            variant="secondary"
            size="default"
            showLabel
            label="Add to Study Plan"
            defaultTab="plan"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={handleShare}
            className="gap-1.5 min-h-[44px] sm:min-h-[38px]"
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span>Share</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setReportOpen(true)}
            className="gap-1.5 min-h-[44px] sm:min-h-[38px]"
          >
            <Flag className="size-4" aria-hidden="true" />
            <span>Report</span>
          </Button>
        </div>
      </footer>

      {/* Global Report Modal */}
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={lesson.id}
        targetType="LESSON"
        targetTitle={lesson.title}
      />
    </article>
  );
}
