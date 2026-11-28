"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { ContributorTier } from "@/types/contribution";
import { cn } from "@/lib/utils";
import { stripInlineImageTokens } from "@/lib/inline-media";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

export function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function stripHtml(html: string): string {
  return stripInlineImageTokens(html)
    .replace(/<[^>]*>?/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?|```/g, ""))
    .replace(/[#*_`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type BaseCardVariant = "default" | "editorial" | "flat";

const feedCardVariantStyles: Record<BaseCardVariant, string> = {
  default:
    "bg-card p-0 overflow-hidden shadow-card hover:border-primary/35 hover:shadow-card-hover",
  editorial:
    "bg-card p-0 overflow-hidden shadow-sm border-border/90 hover:border-primary/35 hover:shadow-card",
  flat:
    "bg-card/80 p-0 overflow-hidden shadow-none hover:border-primary/30 hover:bg-card",
};

const detailedCardVariantStyles: Record<BaseCardVariant, string> = {
  default: "bg-transparent p-0 border-0 rounded-none shadow-none",
  editorial: "bg-transparent p-0 border-0 rounded-none shadow-none",
  flat: "bg-transparent p-0 border-0 rounded-none shadow-none",
};

export interface BaseFeedCardAuthor {
  id?: string | null;
  display_name?: string | null;
  profile_image_url?: string | null;
  contributor_tier?: ContributorTier | number | null;
}

export interface BaseFeedCardProps {
  href?: string;
  onMouseEnter?: () => void;
  onContentLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  contentPrefetch?: boolean;
  leftRail?: React.ReactNode;
  leftRailClassName?: string;
  topBanner?: React.ReactNode;
  author?: BaseFeedCardAuthor | null;
  authorFallbackName?: string;
  authorBadge?: React.ReactNode;
  subtitle?: React.ReactNode;
  topRight?: React.ReactNode;
  title?: string;
  titleAs?: "h2" | "h3";
  body?: string;
  renderBody?: React.ReactNode;
  extraContent?: React.ReactNode;
  taxonomy?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
  variant?: BaseCardVariant;
  headerBand?: boolean;
  className?: string;
  moreMenu?: React.ReactNode;
}

export function BaseFeedCard({
  href,
  onMouseEnter,
  onContentLinkClick,
  contentPrefetch,
  leftRail,
  leftRailClassName,
  topBanner,
  author,
  authorFallbackName = "Unknown",
  authorBadge,
  subtitle,
  topRight,
  title,
  titleAs = "h2",
  body,
  renderBody,
  extraContent,
  taxonomy,
  bottomLeft,
  bottomRight,
  variant = "default",
  headerBand = false,
  className = "",
  moreMenu,
}: BaseFeedCardProps) {
  const { isSignedIn, requireAuth } = useAuthGate();
  const displayName = author?.display_name?.trim() || authorFallbackName;
  const authorId = author?.id ?? undefined;
  const TitleTag = titleAs;

  const titleClassName = cn(
    "tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 [overflow-wrap:anywhere]",
    variant === "editorial"
      ? "font-display text-xl font-semibold leading-snug"
      : "font-heading text-base sm:text-lg font-semibold leading-snug"
  );

  const hasFooter = Boolean(bottomLeft || bottomRight);

  return (
    <article
      data-slot="base-feed-card"
      data-variant={variant}
      className={cn(
        "group relative rounded-xl border border-border transition-all duration-200 data-[keyboard-active=true]:border-primary data-[keyboard-active=true]:ring-2 data-[keyboard-active=true]:ring-primary/30",
        leftRail
          ? "flex flex-col sm:flex-row overflow-hidden bg-card shadow-card hover:border-primary/35 hover:shadow-card-hover"
          : cn("flex flex-col justify-between", feedCardVariantStyles[variant]),
        className
      )}
      onMouseEnter={onMouseEnter}
    >
      {leftRail && (
        <div
          className={cn(
            "relative z-10 flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 sm:w-16 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/25 px-3 py-2.5",
            leftRailClassName
          )}
        >
          {leftRail}
        </div>
      )}

      <div className="flex flex-1 min-w-0 flex-col">
        <div
          className={cn(
            "flex items-center justify-between gap-2.5",
            headerBand
              ? "border-b border-border/60 bg-muted/30 px-4 py-2.5"
              : "px-4 pt-3.5"
          )}
        >
          <div className="relative z-10 flex items-center gap-2 min-w-0 flex-1">
            {authorId ? (
              <Link
                href={`/users/${authorId}`}
                prefetch={isSignedIn ? undefined : false}
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    !requireAuth(undefined, {
                      actionLabel: "view contributor profiles",
                      redirectUrl: `/users/${authorId}`,
                    })
                  ) {
                    e.preventDefault();
                  }
                }}
                className="inline-flex items-center justify-center shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar size="sm" className="size-7">
                  {author?.profile_image_url && (
                    <AvatarImage src={author.profile_image_url} alt={displayName} />
                  )}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar size="sm" className="size-7 shrink-0">
                {author?.profile_image_url && (
                  <AvatarImage src={author.profile_image_url} alt={displayName} />
                )}
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {authorId ? (
                  <Link
                    href={`/users/${authorId}`}
                    prefetch={isSignedIn ? undefined : false}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        !requireAuth(undefined, {
                          actionLabel: "view contributor profiles",
                          redirectUrl: `/users/${authorId}`,
                        })
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="truncate max-w-[160px] sm:max-w-[200px] text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {displayName}
                  </Link>
                ) : (
                  <span className="truncate max-w-[160px] sm:max-w-[200px] text-xs sm:text-sm font-semibold text-foreground">
                    {displayName}
                  </span>
                )}
                {author ? (
                  <ContributorBadge
                    tier={author.contributor_tier ?? 0}
                    size="sm"
                    showInfoIcon={false}
                    interactive={false}
                  />
                ) : null}
                {authorBadge}
              </div>
              {subtitle && (
                <div className="mt-0.5 text-xs text-muted-foreground truncate leading-tight">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {(topRight || moreMenu) && (
            <div className="relative z-10 flex items-center gap-1 shrink-0">
              {topRight}
              {moreMenu}
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex flex-1 min-w-0 flex-col justify-between px-4 pb-3.5",
            headerBand ? "pt-3.5" : "pt-2"
          )}
        >
          <div className="min-w-0">
            {topBanner && <div className="relative z-10 mb-2">{topBanner}</div>}

            {renderBody ? (
              <div>{renderBody}</div>
            ) : href ? (
              <Link
                href={href}
                data-feed-primary-link="true"
                prefetch={contentPrefetch}
                onClick={onContentLinkClick}
                className="block min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {title && <TitleTag className={titleClassName}>{title}</TitleTag>}
                {body && (
                  <p className="mt-1 line-clamp-2 text-sm leading-normal text-muted-foreground [overflow-wrap:anywhere]">
                    {stripHtml(body)}
                  </p>
                )}
              </Link>
            ) : (
              <div className="min-w-0">
                {title && <TitleTag className={titleClassName}>{title}</TitleTag>}
                {body && (
                  <p className="mt-1 line-clamp-2 text-sm leading-normal text-muted-foreground [overflow-wrap:anywhere]">
                    {stripHtml(body)}
                  </p>
                )}
              </div>
            )}

            {extraContent && <div className="relative z-10 mt-2">{extraContent}</div>}

            {taxonomy && (
              <div className="relative z-10 mt-2 flex flex-wrap items-center gap-1.5">
                {taxonomy}
              </div>
            )}
          </div>

          {hasFooter && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/45 pt-2 text-xs font-medium text-muted-foreground">
              <div className="relative z-10 flex flex-wrap items-center gap-2">
                {bottomLeft}
              </div>
              <div className="flex items-center gap-1 tabular-nums ml-auto [&_button]:size-8 [&_button]:min-h-8 [&_button]:min-w-8">
                {bottomRight}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export interface BaseDetailedCardProps {
  author?: {
    id: string;
    display_name: string;
    profile_image_url?: string | null;
    contributor_tier?: ContributorTier | number | null;
  };
  authorBadge?: React.ReactNode;
  authorSubtext?: React.ReactNode;
  badges?: React.ReactNode;
  topRight?: React.ReactNode;
  body: React.ReactNode;
  mediaImages?: React.ReactNode;
  fileAttachments?: React.ReactNode;
  interactions?: React.ReactNode;
  variant?: BaseCardVariant;
  className?: string;
  headerClassName?: string;
}

export function BaseDetailedCard({
  author,
  authorBadge,
  authorSubtext,
  badges,
  topRight,
  body,
  mediaImages,
  fileAttachments,
  interactions,
  variant = "default",
  className = "",
  headerClassName = "",
}: BaseDetailedCardProps) {
  const { isSignedIn, requireAuth } = useAuthGate();

  return (
    <article
      data-slot="base-detailed-card"
      data-variant={variant}
      className={cn("flex flex-col gap-5", detailedCardVariantStyles[variant], className)}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border/60 pb-4",
          headerClassName
        )}
      >
        {author ? (
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <Link
              href={`/users/${author.id}`}
              prefetch={isSignedIn ? undefined : false}
              onClick={(e) => {
                if (!requireAuth(undefined, { actionLabel: "view contributor profiles", redirectUrl: `/users/${author.id}` })) {
                  e.preventDefault();
                }
              }}
              className="flex items-center gap-2.5 hover:opacity-85 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar size="sm" className="size-8">
                {author.profile_image_url && (
                  <AvatarImage src={author.profile_image_url} alt={author.display_name} />
                )}
                <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                  {author.display_name}
                </span>
                {authorSubtext && (
                  <span className="text-xs text-muted-foreground">
                    {authorSubtext}
                  </span>
                )}
              </div>
            </Link>
            <ContributorBadge tier={author.contributor_tier ?? 0} size="sm" />
            {authorBadge}
          </div>
        ) : <div />}

        {(badges || topRight) && (
          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            {badges}
            {topRight}
          </div>
        )}
      </div>

      {mediaImages && <div>{mediaImages}</div>}

      <div className="whitespace-pre-wrap text-base leading-[1.75] text-foreground [overflow-wrap:anywhere]">
        {body}
      </div>

      {fileAttachments && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
            Attachments
          </h3>
          <div className="flex flex-col gap-2">{fileAttachments}</div>
        </div>
      )}

      {interactions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/65 pt-4">
          {interactions}
        </div>
      )}
    </article>
  );
}

/**
 * Quiet desktop-only legend for feed keyboard navigation shortcuts.
 */
export function FeedKeyboardHint({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden lg:flex items-center justify-end gap-3 text-xs text-muted-foreground",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        <kbd className="rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground">
          j
        </kbd>
        <span>/</span>
        <kbd className="rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground">
          k
        </kbd>
        <span className="ml-0.5">step cards</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <kbd className="rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground">
          Enter
        </kbd>
        <span className="ml-0.5">open</span>
      </span>
    </div>
  );
}
