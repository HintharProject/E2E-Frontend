"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Edit2,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  Lock,
  LogIn,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  RefreshCw,
  Share2,
  Sigma,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Comment } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { MathRenderer } from "@/components/ui/math-renderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./comment-module-v2.css";

export function getCommentInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isCommentEdited(createdAt?: string, updatedAt?: string): boolean {
  if (!createdAt || !updatedAt) return false;
  const createdMs = Date.parse(createdAt);
  const updatedMs = Date.parse(updatedAt);
  if (Number.isNaN(createdMs) || Number.isNaN(updatedMs)) return false;
  return updatedMs - createdMs > 5000;
}

export function renderCommentBodyWithMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w[\w\s]{0,24}?\b(?=\s|$)|\s+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      return (
        <span key={idx} className="cm-mention">
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function CommentModuleRoot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label="Comments"
      className={cn("comment-module-v2 mt-6", className)}
    >
      <div className="cm-root">{children}</div>
    </section>
  );
}

export function CommentSectionHeader({
  count,
  sortSlot,
}: {
  count: number;
  sortSlot: React.ReactNode;
}) {
  return (
    <div className="cm-header">
      <div className="cm-header-title-group">
        <MessageSquare className="cm-header-icon size-[18px]" aria-hidden="true" />
        <h2 className="cm-header-title">Comments</h2>
        <span className="cm-count-pill" aria-live="polite">
          {count}
        </span>
      </div>
      {sortSlot}
    </div>
  );
}

export interface CommentComposerShellProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFocus?: () => void;
  placeholder: string;
  submitLabel: string;
  submittingLabel?: string;
  submitDisabled?: boolean;
  textareaDisabled?: boolean;
  isSubmitting?: boolean;
  maxLength?: number;
  compact?: boolean;
  autoFocus?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  replyTarget?: { authorName: string } | null;
  onCancelReply?: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  author?: {
    display_name?: string | null;
    profile_image_url?: string | null;
  } | null;
  label?: string;
}

export function CommentComposerShell({
  value,
  onChange,
  onSubmit,
  onFocus,
  placeholder,
  submitLabel,
  submittingLabel = "Posting...",
  submitDisabled = false,
  textareaDisabled = false,
  isSubmitting = false,
  maxLength = 1000,
  compact = false,
  autoFocus = false,
  textareaRef,
  replyTarget,
  onCancelReply,
  onCancel,
  cancelLabel = "Cancel",
  author,
  label = "Write a comment",
}: CommentComposerShellProps) {
  const inputId = useId();
  const [isPreview, setIsPreview] = useState(false);

  const charCount = value.length;
  const charState =
    charCount >= Math.floor(maxLength * 0.98)
      ? "limit"
      : charCount >= Math.floor(maxLength * 0.85)
        ? "warn"
        : "normal";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!submitDisabled && !isSubmitting) {
        e.currentTarget.form?.requestSubmit();
      }
    }
    if (e.key === "Escape" && onCancel && !isSubmitting) {
      e.preventDefault();
      onCancel();
    }
  };

  const handleInsertMath = () => {
    if (textareaDisabled || isSubmitting) return;
    const next = value.length > 0 && !value.endsWith(" ") ? `${value} $ $` : `${value}$ $`;
    if (next.length <= maxLength) {
      onChange(next);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="cm-composer"
      data-compact={compact ? "true" : "false"}
    >
      {replyTarget && (
        <div className="cm-reply-banner" role="status">
          <span>
            Replying to <strong>@{replyTarget.authorName}</strong>
          </span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="cm-reply-banner-close"
              aria-label={`Cancel reply to ${replyTarget.authorName}`}
              title="Cancel reply"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {!compact && author?.display_name && (
        <div className="cm-composer-meta">
          <div className="cm-composer-identity">
            <Avatar size="sm" className="size-5">
              {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
              <AvatarFallback style={{ fontSize: "var(--cm-text-micro)" }}>
                {getCommentInitials(author.display_name)}
              </AvatarFallback>
            </Avatar>
            <span>
              Commenting as <strong>{author.display_name}</strong>
            </span>
          </div>
        </div>
      )}

      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      {isPreview && value.trim() ? (
        <div className="cm-textarea" style={{ minHeight: compact ? "54px" : "64px", overflowY: "auto" }}>
          <MathRenderer content={value} />
        </div>
      ) : (
        <textarea
          id={inputId}
          ref={textareaRef}
          className="cm-textarea"
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          disabled={textareaDisabled}
          readOnly={isSubmitting}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      <div className="cm-composer-footer">
        <div className="cm-composer-tools">
          <button
            type="button"
            className="cm-btn"
            data-variant="ghost"
            data-size="xs"
            onClick={handleInsertMath}
            disabled={textareaDisabled || isSubmitting}
            title="Insert inline LaTeX math ($...$)"
          >
            <Sigma className="size-3.5" aria-hidden="true" />
            <span>LaTeX</span>
          </button>

          <button
            type="button"
            className="cm-btn"
            data-variant="ghost"
            data-size="xs"
            onClick={() => setIsPreview((p) => !p)}
            disabled={!value.trim()}
            aria-pressed={isPreview}
          >
            {isPreview ? (
              <>
                <PenLine className="size-3.5" aria-hidden="true" />
                <span>Write</span>
              </>
            ) : (
              <>
                <Eye className="size-3.5" aria-hidden="true" />
                <span>Preview</span>
              </>
            )}
          </button>

          <span className="cm-char-count" data-state={charState} aria-live="off">
            {charCount}/{maxLength}
          </span>
        </div>

        <div className="cm-composer-actions">
          <span className="cm-kbd-hint" aria-hidden="true">
            Ctrl+Enter
          </span>
          {onCancel && (
            <button
              type="button"
              className="cm-btn"
              data-variant="ghost"
              data-size="xs"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            className="cm-btn"
            data-variant="primary"
            data-size={compact ? "xs" : undefined}
            disabled={submitDisabled || isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            <span>{isSubmitting ? submittingLabel : submitLabel}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export interface CommentItemShellProps {
  comment: Comment;
  variant?: "top-level" | "nested";
  isAuthor: boolean;
  canEdit?: boolean;
  renderMentions?: boolean;
  isEditing: boolean;
  editBody: string;
  onEditBodyChange: (value: string) => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSubmit: (e: React.FormEvent) => void;
  isEditSubmitting?: boolean;
  showDeleteDialog: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  isDeletePending?: boolean;
  deleteTitle?: string;
  deleteDescription?: string;
  localVoteCount?: number;
  localUserVote?: number | null;
  onUpvote?: () => void;
  onDownvote?: () => void;
  isVotePending?: boolean;
  onReply?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  isReportPending?: boolean;
  replyCount?: number;
  isRepliesExpanded?: boolean;
  onToggleReplies?: () => void;
  staffMenuSlot?: React.ReactNode;
}

export function CommentItemShell({
  comment,
  variant = "top-level",
  isAuthor,
  canEdit = true,
  renderMentions = false,
  isEditing,
  editBody,
  onEditBodyChange,
  onEditStart,
  onEditCancel,
  onEditSubmit,
  isEditSubmitting = false,
  showDeleteDialog,
  onDeleteDialogChange,
  onDeleteConfirm,
  isDeletePending = false,
  deleteTitle = "Delete Comment",
  deleteDescription = "Are you sure you want to delete this comment? This action cannot be undone.",
  localVoteCount,
  localUserVote,
  onUpvote,
  onDownvote,
  isVotePending = false,
  onReply,
  onShare,
  onReport,
  isReportPending = false,
  replyCount = 0,
  isRepliesExpanded = false,
  onToggleReplies,
  staffMenuSlot,
}: CommentItemShellProps) {
  const author = comment.author_details;
  const authorName = author?.display_name || "Unknown";
  const authorTier =
    author?.contributor_tier ?? (author as { reputation?: { contributor_tier?: number } } | undefined)?.reputation?.contributor_tier ?? 0;
  const edited = isCommentEdited(comment.created_at, comment.updated_at);
  const showOverflowMenu = isAuthor || Boolean(onShare) || Boolean(onReport);

  return (
    <article
      id={`comment-${comment.id}`}
      className="cm-card"
      data-variant={variant}
    >
      {/* Header: Author Metadata, Standing, Timestamp, Edited & Overflow */}
      <header className="cm-card-header">
        <div className="cm-author-row">
          <Avatar size="sm" className={variant === "nested" ? "size-5" : "size-6"}>
            {author?.profile_image_url && <AvatarImage src={author.profile_image_url} />}
            <AvatarFallback
              style={variant === "nested" ? { fontSize: "var(--cm-text-micro)" } : undefined}
            >
              {getCommentInitials(authorName)}
            </AvatarFallback>
          </Avatar>

          <div className="cm-author-meta">
            <span className="cm-author-name">{authorName}</span>

            {author && <ContributorBadge tier={authorTier} size="sm" />}

            {comment.is_hidden && (
              <span className="cm-status-pill" title="Hidden from public view by moderation">
                <EyeOff className="size-2.5" aria-hidden="true" />
                <span>Hidden</span>
              </span>
            )}

            {comment.is_locked && (
              <span className="cm-status-pill" title="Locked by moderation">
                <Lock className="size-2.5" aria-hidden="true" />
                <span>Locked</span>
              </span>
            )}

            <span className="cm-meta-dot" aria-hidden="true">
              ·
            </span>

            <time
              dateTime={comment.created_at}
              title={new Date(comment.created_at).toLocaleString()}
              className="cm-timestamp"
            >
              {formatDate(comment.created_at)}
            </time>

            {edited && (
              <span
                className="cm-badge-edited"
                title={`Edited ${new Date(comment.updated_at).toLocaleString()}`}
              >
                (edited)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Body or Inline Edit Form */}
      {isEditing ? (
        <CommentComposerShell
          compact
          autoFocus
          label="Edit comment"
          placeholder="Update your comment..."
          value={editBody}
          onChange={onEditBodyChange}
          onSubmit={onEditSubmit}
          submitLabel="Save changes"
          submittingLabel="Saving..."
          submitDisabled={!editBody.trim()}
          isSubmitting={isEditSubmitting}
          onCancel={onEditCancel}
          cancelLabel="Cancel"
        />
      ) : (
        <div className="cm-body">
          {renderMentions ? renderCommentBodyWithMentions(comment.body) : comment.body}
        </div>
      )}

      {/* Action Bar */}
      {!isEditing && (
        <footer className="cm-actions">
          {typeof localVoteCount === "number" && onUpvote && onDownvote && (
            <div className="cm-vote-pill" role="group" aria-label="Comment votes">
              <button
                type="button"
                className="cm-vote-btn"
                data-active={localUserVote === 1 ? "up" : undefined}
                onClick={onUpvote}
                disabled={isVotePending || isAuthor}
                aria-label={isAuthor ? "You cannot vote on your own comment" : "Upvote comment"}
                aria-pressed={localUserVote === 1}
                title={isAuthor ? "You cannot vote on your own comment" : "Upvote"}
              >
                <ChevronUp className="size-4" aria-hidden="true" />
              </button>

              <span className="cm-vote-score" aria-label={`Score ${localVoteCount}`}>
                {localVoteCount}
              </span>

              <button
                type="button"
                className="cm-vote-btn"
                data-active={localUserVote === -1 ? "down" : undefined}
                onClick={onDownvote}
                disabled={isVotePending || isAuthor}
                aria-label={isAuthor ? "You cannot vote on your own comment" : "Downvote comment"}
                aria-pressed={localUserVote === -1}
                title={isAuthor ? "You cannot vote on your own comment" : "Downvote"}
              >
                <ChevronDown className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {onReply && (
            <button type="button" className="cm-action-btn" onClick={onReply}>
              <CornerDownRight className="size-3.5" aria-hidden="true" />
              <span>Reply</span>
            </button>
          )}

          {onShare && (
            <button type="button" className="cm-action-btn" onClick={onShare}>
              <Share2 className="size-3.5" aria-hidden="true" />
              <span>Share</span>
            </button>
          )}

          {replyCount > 0 && onToggleReplies && (
            <button
              type="button"
              className="cm-action-btn"
              data-accent="true"
              aria-expanded={isRepliesExpanded}
              onClick={onToggleReplies}
            >
              {isRepliesExpanded ? (
                <>
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                  <span>Hide replies</span>
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                  <span>
                    View {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </span>
                </>
              )}
            </button>
          )}

          {(staffMenuSlot || showOverflowMenu) && (
            <div className="cm-footer-controls">
              {staffMenuSlot}

              {showOverflowMenu && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="cm-icon-btn"
                        aria-label={`More actions for comment by ${authorName}`}
                        title="More actions"
                      />
                    }
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="comment-module-v2 cm-popover-surface min-w-40"
                  >
                    {isAuthor && (
                      <>
                        {canEdit && (
                          <DropdownMenuItem onClick={onEditStart} className="gap-2 cursor-pointer">
                            <Edit2 className="size-3.5" aria-hidden="true" />
                            <span>Edit comment</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteDialogChange(true)}
                          className="gap-2 cursor-pointer cm-menu-item-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          <span>Delete comment</span>
                        </DropdownMenuItem>
                      </>
                    )}

                    {isAuthor && (onShare || (!isAuthor && onReport)) && <DropdownMenuSeparator />}

                    {onShare && (
                      <DropdownMenuItem onClick={onShare} className="gap-2 cursor-pointer">
                        <Share2 className="size-3.5" aria-hidden="true" />
                        <span>Copy link</span>
                      </DropdownMenuItem>
                    )}

                    {!isAuthor && onReport && (
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={isReportPending}
                        onClick={onReport}
                        className="gap-2 cursor-pointer cm-menu-item-danger"
                      >
                        <Flag className="size-3.5" aria-hidden="true" />
                        <span>Report comment</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </footer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={onDeleteDialogChange}>
        <DialogContent className="comment-module-v2 cm-popover-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-semibold">
              {deleteTitle}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {deleteDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="cm-btn"
              data-variant="outline"
              onClick={() => onDeleteDialogChange(false)}
              disabled={isDeletePending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cm-btn"
              data-variant="danger"
              onClick={onDeleteConfirm}
              disabled={isDeletePending}
            >
              {isDeletePending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              <span>{isDeletePending ? "Deleting..." : "Delete"}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function CommentThreadRail({
  children,
  clamped = false,
}: {
  children: React.ReactNode;
  clamped?: boolean;
}) {
  return (
    <div className="cm-thread-rail" data-clamped={clamped ? "true" : "false"}>
      {children}
    </div>
  );
}

export function CommentSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="cm-list" role="status" aria-label="Loading comments">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="cm-card" aria-hidden="true">
          <div className="cm-author-row">
            <div className="cm-skeleton-circle size-6 shrink-0" />
            <div className="cm-skeleton-bar h-3 w-28" />
            <div className="cm-skeleton-bar h-4 w-14 rounded-full" />
            <div className="cm-skeleton-bar h-3 w-12" />
          </div>
          <div className="space-y-1.5">
            <div className="cm-skeleton-bar h-3 w-full" />
            <div className="cm-skeleton-bar h-3 w-4/5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="cm-skeleton-bar h-6 w-16 rounded-full" />
            <div className="cm-skeleton-bar h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentReplySkeleton() {
  return (
    <div className="cm-card" data-variant="nested" role="status" aria-label="Loading replies">
      <div className="cm-author-row">
        <div className="cm-skeleton-circle size-5 shrink-0" />
        <div className="cm-skeleton-bar h-2.5 w-24" />
        <div className="cm-skeleton-bar h-2.5 w-10" />
      </div>
      <div className="cm-skeleton-bar h-2.5 w-4/5" />
    </div>
  );
}

export function CommentEmptyState({
  title = "No comments yet",
  description = "Be the first to start the discussion below.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="cm-empty">
      <div className="cm-empty-icon" aria-hidden="true">
        <MessageSquare className="size-5" />
      </div>
      <p className="cm-empty-title">{title}</p>
      <p className="cm-empty-desc">{description}</p>
    </div>
  );
}

export function CommentErrorState({
  title = "Unable to load comments",
  description = "Check your connection and try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="cm-error-banner" role="alert">
      <div className="cm-error-content">
        <AlertTriangle className="cm-error-icon size-5" aria-hidden="true" />
        <div>
          <p className="cm-error-title">{title}</p>
          <p className="cm-error-desc">{description}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" className="cm-btn" data-variant="outline" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

export function CommentGuestGate({
  hiddenCommentCount,
  encodedRedirect,
}: {
  hiddenCommentCount: number;
  encodedRedirect: string;
}) {
  return (
    <div className="cm-guest-gate">
      <div className="flex items-start gap-3">
        <div className="cm-guest-icon" aria-hidden="true">
          <Lock className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: "var(--cm-ink)" }}>
            Showing top 3 public comments
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--cm-ink-muted)" }}>
            {hiddenCommentCount > 0
              ? `${hiddenCommentCount} more ${hiddenCommentCount === 1 ? "comment" : "comments"} and nested replies are available after signing in.`
              : "More comments and nested replies are available after signing in."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/sign-up?redirect_url=${encodedRedirect}`}
          className="cm-btn"
          data-variant="primary"
        >
          <UserPlus className="size-3.5" aria-hidden="true" />
          <span>Sign up free</span>
        </Link>
        <Link
          href={`/sign-in?redirect_url=${encodedRedirect}`}
          className="cm-btn"
          data-variant="outline"
        >
          <LogIn className="size-3.5" aria-hidden="true" />
          <span>Log in</span>
        </Link>
      </div>
    </div>
  );
}
