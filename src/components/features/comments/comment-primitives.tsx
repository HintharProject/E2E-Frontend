"use client";

import React, { createContext, useContext, useId, useRef, useState, useSyncExternalStore } from "react";
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
import { Comment, UserPublic } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { MathRenderer } from "@/components/ui/math-renderer";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";
import {
  CommentProfilePreviewUser,
  CommentUserProfileDialog,
} from "./comment-user-profile-dialog";
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

const CommentHeadingContext = createContext<string | undefined>(undefined);
const CommentProfileContext = createContext<((user: CommentProfilePreviewUser) => void) | null>(null);

export type { CommentProfilePreviewUser };

export function toProfilePreviewUser(
  authorDetails?: Partial<UserPublic> | null,
  fallbackId?: string | null
): CommentProfilePreviewUser | null {
  const id = authorDetails?.id || fallbackId;
  if (!id) return null;
  return {
    id,
    display_name: authorDetails?.display_name ?? null,
    profile_image_url: authorDetails?.profile_image_url ?? null,
    contributor_tier:
      authorDetails?.contributor_tier ??
      authorDetails?.reputation?.contributor_tier ??
      null,
    role: authorDetails?.role ?? null,
  };
}

export function collectCommentParticipants(
  comments: Comment[],
  extraUsers: Array<CommentProfilePreviewUser | null | undefined> = []
): CommentProfilePreviewUser[] {
  const seen = new Map<string, CommentProfilePreviewUser>();
  const addUser = (user: CommentProfilePreviewUser | null | undefined) => {
    if (!user?.id) return;
    const existing = seen.get(user.id);
    if (!existing || (!existing.display_name && user.display_name)) {
      seen.set(user.id, user);
    }
  };

  for (const extra of extraUsers) {
    addUser(extra);
  }
  for (const item of comments) {
    addUser(toProfilePreviewUser(item.author_details, item.author));
    if (Array.isArray(item.replies)) {
      for (const reply of item.replies) {
        addUser(toProfilePreviewUser(reply.author_details, reply.author));
      }
    }
  }
  return Array.from(seen.values());
}

function escapeMentionRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const emptySubscribe = () => () => {};
function getIsApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

function safeFormatDate(iso?: string | null): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "Recently";
  return formatDate(iso);
}

function safeFormatDateTime(iso?: string | null): string | undefined {
  if (!iso || Number.isNaN(Date.parse(iso))) return undefined;
  return new Date(iso).toLocaleString();
}

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

export function renderCommentBodyWithMentions(
  text: string,
  options?: {
    mentionUsers?: CommentProfilePreviewUser[];
    onMentionClick?: (user: CommentProfilePreviewUser) => void;
  }
): React.ReactNode {
  const userByLowerName = new Map<string, CommentProfilePreviewUser>();
  for (const user of options?.mentionUsers ?? []) {
    const trimmed = user.display_name?.trim();
    if (trimmed && !userByLowerName.has(trimmed.toLowerCase())) {
      userByLowerName.set(trimmed.toLowerCase(), user);
    }
  }

  const knownNames = Array.from(userByLowerName.values())
    .map((u) => u.display_name!.trim())
    .sort((a, b) => b.length - a.length);

  const nameAlternation =
    knownNames.length > 0
      ? `(?:${knownNames.map(escapeMentionRegex).join("|")}|[A-Za-z0-9_.-]+)`
      : "[A-Za-z0-9_.-]+";

  const mentionRegex = new RegExp(
    `(^|[\\s(\\[\\"'“‘])(@(${nameAlternation}))(?=[ \\t\\r\\n.,!?;:)\\]\\"'”’]|$)`,
    "gi"
  );

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    const prefix = match[1];
    const fullMention = match[2];
    const matchedName = match[3];
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      nodes.push(
        <React.Fragment key={`t-${keyIdx++}`}>
          {text.slice(lastIndex, matchStart)}
        </React.Fragment>
      );
    }

    if (prefix) {
      nodes.push(
        <React.Fragment key={`p-${keyIdx++}`}>{prefix}</React.Fragment>
      );
    }

    const resolvedUser = userByLowerName.get(matchedName.toLowerCase());
    if (resolvedUser?.id && options?.onMentionClick) {
      const displayLabel = resolvedUser.display_name || matchedName;
      nodes.push(
        <button
          key={`m-${keyIdx++}`}
          type="button"
          className="cm-mention cm-mention-btn"
          onClick={() => options.onMentionClick?.(resolvedUser)}
          aria-label={`View profile for ${displayLabel}`}
          title={`View ${displayLabel}'s profile`}
        >
          {fullMention}
        </button>
      );
    } else {
      nodes.push(
        <span key={`m-${keyIdx++}`} className="cm-mention">
          {fullMention}
        </span>
      );
    }

    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <React.Fragment key={`t-${keyIdx++}`}>{text.slice(lastIndex)}</React.Fragment>
    );
  }

  return nodes.length > 0 ? nodes : text;
}

export function CommentModuleRoot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = useId();
  const { requireAuth } = useAuthGate();
  const [selectedUser, setSelectedUser] = useState<CommentProfilePreviewUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openUserProfile = (user: CommentProfilePreviewUser) => {
    if (!user?.id) return;
    if (
      !requireAuth(undefined, {
        actionLabel: "view contributor profiles",
        redirectUrl: `/users/${user.id}`,
      })
    ) {
      return;
    }
    setSelectedUser(user);
    setProfileOpen(true);
  };

  return (
    <CommentHeadingContext.Provider value={headingId}>
      <CommentProfileContext.Provider value={openUserProfile}>
        <section
          aria-labelledby={headingId}
          className={cn("comment-module-v2 mt-6", className)}
        >
          <div className="cm-root">{children}</div>
          <CommentUserProfileDialog
            user={selectedUser}
            open={profileOpen}
            onOpenChange={setProfileOpen}
          />
        </section>
      </CommentProfileContext.Provider>
    </CommentHeadingContext.Provider>
  );
}

export function CommentSectionHeader({
  count,
  sortSlot,
}: {
  count: number;
  sortSlot: React.ReactNode;
}) {
  const headingId = useContext(CommentHeadingContext);
  return (
    <div className="cm-header">
      <div className="cm-header-title-group">
        <MessageSquare className="cm-header-icon size-[18px]" aria-hidden="true" />
        <h2 id={headingId} className="cm-header-title">
          Comments
        </h2>
        <span className="cm-count-pill" aria-live="polite" aria-label={`${count} ${count === 1 ? "comment" : "comments"}`}>
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
  const hintId = useId();
  const [isPreview, setIsPreview] = useState(false);
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = useRef(false);
  const compositionEndAtRef = useRef(0);
  const isApple = useSyncExternalStore(emptySubscribe, getIsApplePlatform, () => false);

  const effectivePreview = isPreview && Boolean(value.trim());

  const setMergedTextareaRef = (node: HTMLTextAreaElement | null) => {
    localTextareaRef.current = node;
    if (textareaRef) {
      textareaRef.current = node;
    }
  };

  const charCount = value.length;
  const charState =
    charCount >= Math.floor(maxLength * 0.98)
      ? "limit"
      : charCount >= Math.floor(maxLength * 0.85)
        ? "warn"
        : "normal";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isImeActive =
      e.nativeEvent.isComposing ||
      e.keyCode === 229 ||
      isComposingRef.current ||
      Date.now() - compositionEndAtRef.current < 80;
    if (isImeActive) return;

    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === "Enter") {
      e.preventDefault();
      if (!submitDisabled && !isSubmitting && !textareaDisabled) {
        e.currentTarget.form?.requestSubmit();
      }
      return;
    }

    if (e.key === "Escape" && onCancel && !isSubmitting) {
      e.preventDefault();
      onCancel();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    setIsPreview(false);
    onSubmit(e);
  };

  const handleInsertMath = () => {
    if (textareaDisabled || isSubmitting) return;
    setIsPreview(false);
    const el = localTextareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
    const snippet = selected ? `$${selected}$` : "$ $";
    const insertion = `${needsLeadingSpace ? " " : ""}${snippet}`;
    const next = `${before}${insertion}${after}`;

    if (next.length <= maxLength) {
      onChange(next);
      const cursorTarget =
        before.length + (needsLeadingSpace ? 1 : 0) + (selected ? snippet.length : 1);
      requestAnimationFrame(() => {
        const targetEl = localTextareaRef.current;
        if (targetEl) {
          targetEl.focus();
          targetEl.setSelectionRange(cursorTarget, cursorTarget);
        }
      });
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="cm-composer"
      data-compact={compact ? "true" : "false"}
    >
      {replyTarget && (
        <div className="cm-reply-banner" role="status">
          <span className="cm-reply-banner-text">
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
              {author.profile_image_url && <AvatarImage src={author.profile_image_url} alt="" />}
              <AvatarFallback className="cm-avatar-fallback-sm">
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
      <span id={hintId} className="sr-only">
        Press Control plus Enter or Command plus Enter to submit. Press Enter or Shift plus Enter for a new line.
      </span>

      {effectivePreview ? (
        <div
          role="region"
          aria-label="Formatted comment preview"
          className="cm-preview-box"
        >
          <MathRenderer content={value} />
        </div>
      ) : (
        <textarea
          id={inputId}
          ref={setMergedTextareaRef}
          className="cm-textarea"
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          disabled={textareaDisabled}
          readOnly={isSubmitting}
          autoFocus={autoFocus}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          aria-describedby={hintId}
          onFocus={onFocus}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            compositionEndAtRef.current = Date.now();
          }}
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
            aria-label="Insert inline LaTeX math"
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
            aria-pressed={effectivePreview}
            aria-label={effectivePreview ? "Switch back to write mode" : "Preview formatted math"}
          >
            {effectivePreview ? (
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
            {isApple ? "⌘+Enter" : "Ctrl+Enter"}
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
  depth?: number;
  replyingToName?: string | null;
  repliesRegionId?: string;
  isThreadLocked?: boolean;
  isAuthor: boolean;
  canEdit?: boolean;
  renderMentions?: boolean;
  mentionUsers?: CommentProfilePreviewUser[];
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
  depth = 0,
  replyingToName,
  repliesRegionId,
  isThreadLocked = false,
  isAuthor,
  canEdit = true,
  renderMentions = false,
  mentionUsers,
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
  const openUserProfile = useContext(CommentProfileContext);
  const author = comment.author_details;
  const authorName = author?.display_name || "Unknown";
  const authorTier =
    author?.contributor_tier ?? (author as { reputation?: { contributor_tier?: number } } | undefined)?.reputation?.contributor_tier ?? 0;
  const authorProfile = toProfilePreviewUser(author, comment.author);
  const resolvedMentionUsers = collectCommentParticipants([comment], [
    ...(mentionUsers ?? []),
    authorProfile,
  ]);
  const edited = isCommentEdited(comment.created_at, comment.updated_at);
  const isDeleted = Boolean(comment.is_deleted);
  const isLocked = Boolean(comment.is_locked || isThreadLocked);
  const effectiveCanEdit = canEdit && !isLocked && !isDeleted;
  const showOverflowMenu =
    !isDeleted && (isAuthor || Boolean(onShare) || Boolean(onReport));
  const createdDisplay = safeFormatDate(comment.created_at);
  const createdTitle = safeFormatDateTime(comment.created_at);
  const updatedTitle = safeFormatDateTime(comment.updated_at);
  const showThreadContext = Boolean(replyingToName) && depth >= 2;

  if (isDeleted) {
    return (
      <article
        id={`comment-${comment.id}`}
        className="cm-card"
        data-variant={variant}
        data-state="deleted"
        aria-label={variant === "nested" ? "Deleted reply" : "Deleted comment"}
      >
        <header className="cm-card-header">
          <div className="cm-author-row">
            <div className="cm-author-meta">
              <span className="cm-author-name cm-deleted-label">
                {variant === "nested" ? "[deleted reply]" : "[deleted comment]"}
              </span>
              <span className="cm-meta-dot" aria-hidden="true">
                ·
              </span>
              <time
                dateTime={comment.created_at}
                title={createdTitle}
                className="cm-timestamp"
              >
                {createdDisplay}
              </time>
            </div>
          </div>
        </header>

        <p className="cm-body cm-body-deleted">
          {variant === "nested" ? "This reply has been deleted." : "This comment has been deleted."}
        </p>

        {((replyCount > 0 && onToggleReplies) || staffMenuSlot) && (
          <footer className="cm-actions">
            {replyCount > 0 && onToggleReplies && (
              <button
                type="button"
                className="cm-action-btn"
                data-accent="true"
                aria-expanded={isRepliesExpanded}
                aria-controls={repliesRegionId}
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
            {staffMenuSlot && (
              <div className="cm-footer-controls">{staffMenuSlot}</div>
            )}
          </footer>
        )}
      </article>
    );
  }

  return (
    <article
      id={`comment-${comment.id}`}
      className="cm-card"
      data-variant={variant}
      aria-label={`${variant === "nested" ? "Reply" : "Comment"} by ${authorName}, ${createdDisplay}`}
    >
      {/* Header: Author Metadata, Standing, Timestamp, Edited & Status */}
      <header className="cm-card-header">
        <div className="cm-author-row">
          {authorProfile && openUserProfile ? (
            <button
              type="button"
              className="cm-author-trigger"
              onClick={() => openUserProfile(authorProfile)}
              aria-label={`View profile for ${authorName}`}
              title={`View ${authorName}'s profile`}
            >
              <Avatar size="sm" className={variant === "nested" ? "size-5" : "size-6"}>
                {author?.profile_image_url && <AvatarImage src={author.profile_image_url} alt="" />}
                <AvatarFallback
                  className={variant === "nested" ? "cm-avatar-fallback-sm" : undefined}
                >
                  {getCommentInitials(authorName)}
                </AvatarFallback>
              </Avatar>
              <span className="cm-author-name">{authorName}</span>
            </button>
          ) : (
            <>
              <Avatar size="sm" className={variant === "nested" ? "size-5" : "size-6"}>
                {author?.profile_image_url && <AvatarImage src={author.profile_image_url} alt="" />}
                <AvatarFallback
                  className={variant === "nested" ? "cm-avatar-fallback-sm" : undefined}
                >
                  {getCommentInitials(authorName)}
                </AvatarFallback>
              </Avatar>
              <span className="cm-author-name">{authorName}</span>
            </>
          )}

          <div className="cm-author-meta">
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
              title={createdTitle}
              className="cm-timestamp"
            >
              {createdDisplay}
            </time>

            {edited && (
              <span
                className="cm-badge-edited"
                title={updatedTitle ? `Edited ${updatedTitle}` : "Edited"}
              >
                (edited)
              </span>
            )}
          </div>
        </div>
      </header>

      {showThreadContext && (
        <div
          className="cm-thread-context"
          data-mobile-only={depth < 4 ? "true" : "false"}
        >
          <CornerDownRight className="size-3 shrink-0" aria-hidden="true" />
          <span>Replying to @{replyingToName}</span>
        </div>
      )}

      {/* Body or Inline Edit Form */}
      {isEditing ? (
        <CommentComposerShell
          compact
          autoFocus
          label={`Edit comment by ${authorName}`}
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
          {renderMentions
            ? renderCommentBodyWithMentions(comment.body, {
                mentionUsers: resolvedMentionUsers,
                onMentionClick: openUserProfile ?? undefined,
              })
            : comment.body}
        </div>
      )}

      {/* Action Bar */}
      {!isEditing && (
        <footer className="cm-actions">
          {typeof localVoteCount === "number" && onUpvote && onDownvote && (
            <div className="cm-vote-pill" role="group" aria-label={`Votes for comment by ${authorName}`}>
              <button
                type="button"
                className="cm-vote-btn"
                data-active={localUserVote === 1 ? "up" : undefined}
                onClick={onUpvote}
                disabled={isVotePending || isAuthor}
                aria-label={
                  isAuthor
                    ? "You cannot vote on your own comment"
                    : localUserVote === 1
                      ? `Remove upvote from comment by ${authorName}`
                      : `Upvote comment by ${authorName}`
                }
                aria-pressed={localUserVote === 1}
                title={isAuthor ? "You cannot vote on your own comment" : "Upvote"}
              >
                <ChevronUp className="size-4" aria-hidden="true" />
              </button>

              <span className="cm-vote-score">
                <span className="sr-only">Score: </span>
                {localVoteCount}
              </span>

              <button
                type="button"
                className="cm-vote-btn"
                data-active={localUserVote === -1 ? "down" : undefined}
                onClick={onDownvote}
                disabled={isVotePending || isAuthor}
                aria-label={
                  isAuthor
                    ? "You cannot vote on your own comment"
                    : localUserVote === -1
                      ? `Remove downvote from comment by ${authorName}`
                      : `Downvote comment by ${authorName}`
                }
                aria-pressed={localUserVote === -1}
                title={isAuthor ? "You cannot vote on your own comment" : "Downvote"}
              >
                <ChevronDown className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {onReply && !isLocked && (
            <button
              type="button"
              className="cm-action-btn"
              onClick={onReply}
              aria-label={`Reply to ${authorName}`}
            >
              <CornerDownRight className="size-3.5" aria-hidden="true" />
              <span>Reply</span>
            </button>
          )}

          {onShare && (
            <button
              type="button"
              className="cm-action-btn"
              onClick={onShare}
              aria-label={`Copy link to comment by ${authorName}`}
            >
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
              aria-controls={repliesRegionId}
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
                        {effectiveCanEdit && (
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
  id,
  children,
  clamped = false,
  depth = 0,
  ariaLabel = "Replies",
}: {
  id?: string;
  children: React.ReactNode;
  clamped?: boolean;
  depth?: number;
  ariaLabel?: string;
}) {
  return (
    <div
      id={id}
      role="list"
      aria-label={ariaLabel}
      className="cm-thread-rail"
      data-mobile-clamped={depth >= 2 ? "true" : "false"}
      data-clamped={clamped ? "true" : "false"}
    >
      {children}
    </div>
  );
}

export function CommentLockedBanner({
  message = "This discussion has been locked by moderation. New comments and replies are disabled.",
}: {
  message?: string;
}) {
  return (
    <div className="cm-locked-banner" role="status">
      <Lock className="size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
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
  title = "Showing top 3 public comments",
  description,
}: {
  hiddenCommentCount: number;
  encodedRedirect: string;
  title?: string;
  description?: string;
}) {
  const resolvedDescription =
    description ??
    (hiddenCommentCount > 0
      ? `${hiddenCommentCount} more ${hiddenCommentCount === 1 ? "comment" : "comments"} and nested replies are available after signing in.`
      : "More comments and nested replies are available after signing in.");

  return (
    <div className="cm-guest-gate">
      <div className="flex items-start gap-3 min-w-0">
        <div className="cm-guest-icon" aria-hidden="true">
          <Lock className="size-4" />
        </div>
        <div className="cm-guest-body">
          <p className="cm-guest-title">{title}</p>
          <p className="cm-guest-desc">{resolvedDescription}</p>
        </div>
      </div>
      <div className="cm-guest-actions">
        <Link
          href={`/sign-up?redirect_url=${encodedRedirect}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cm-btn"
          data-variant="primary"
        >
          <UserPlus className="size-3.5" aria-hidden="true" />
          <span>Sign up free</span>
        </Link>
        <Link
          href={`/sign-in?redirect_url=${encodedRedirect}`}
          target="_blank"
          rel="noopener noreferrer"
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
