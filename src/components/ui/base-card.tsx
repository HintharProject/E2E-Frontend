"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { ContributorTier } from "@/types/contribution";
import { cn } from "@/lib/utils";
import { useAuthGate } from "@/components/features/auth/auth-gate-modal";

export function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "");
}

export type BaseCardVariant = "default" | "editorial" | "flat";

const feedCardVariantStyles: Record<BaseCardVariant, string> = {
  default:
    "bg-card p-5 shadow-card hover:border-primary/35 hover:shadow-card-hover",
  editorial:
    "bg-card p-5 sm:p-6 shadow-sm border-border/90 hover:border-primary/35 hover:shadow-card",
  flat:
    "bg-card/80 p-4 sm:p-5 shadow-none hover:border-primary/30 hover:bg-card",
};

const detailedCardVariantStyles: Record<BaseCardVariant, string> = {
  default: "bg-card p-5 sm:p-6 shadow-card",
  editorial: "bg-card p-6 sm:p-8 shadow-sm border-border/90",
  flat: "bg-card/85 p-5 sm:p-6 shadow-none",
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
        "group relative rounded-xl border border-border transition-all duration-200",
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
            "relative z-10 flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:w-20 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/25 px-4 py-2.5 sm:px-2 sm:py-4",
            leftRailClassName
          )}
        >
          {leftRail}
        </div>
      )}

      <div
        className={cn(
          "flex flex-1 min-w-0 flex-col justify-between",
          leftRail && "p-4 sm:p-5"
        )}
      >
        <div className="min-w-0">
          {topBanner && <div className="relative z-10 mb-3">{topBanner}</div>}

          {/* Header: Author + Date (top-left) and Status Badges + MoreMenu (top-right) */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
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
                  className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Avatar size="sm">
                    {author?.profile_image_url && (
                      <AvatarImage src={author.profile_image_url} alt={displayName} />
                    )}
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar size="sm" className="shrink-0">
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
                      className="truncate max-w-[180px] sm:max-w-[240px] text-sm font-semibold text-foreground hover:text-primary transition-colors rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {displayName}
                    </Link>
                  ) : (
                    <span className="truncate max-w-[180px] sm:max-w-[240px] text-sm font-semibold text-foreground">
                      {displayName}
                    </span>
                  )}
                  {author ? (
                    <ContributorBadge
                      tier={author.contributor_tier ?? 0}
                      size="sm"
                      showInfoIcon={false}
                    />
                  ) : null}
                  {authorBadge}
                </div>
                {subtitle && (
                  <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            {(topRight || moreMenu) && (
              <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                {topRight}
                {moreMenu}
              </div>
            )}
          </div>

          {/* Primary Content Body */}
          {renderBody ? (
            <div className="mt-3">{renderBody}</div>
          ) : href ? (
            <Link
              href={href}
              prefetch={contentPrefetch}
              onClick={onContentLinkClick}
              className="mt-3 block min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {title && <TitleTag className={titleClassName}>{title}</TitleTag>}
              {body && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {stripHtml(body)}
                </p>
              )}
            </Link>
          ) : (
            <div className="mt-3 min-w-0">
              {title && <TitleTag className={titleClassName}>{title}</TitleTag>}
              {body && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {stripHtml(body)}
                </p>
              )}
            </div>
          )}

          {extraContent && <div className="relative z-10 mt-3">{extraContent}</div>}

          {taxonomy && (
            <div className="relative z-10 mt-3 flex flex-wrap items-center gap-1.5">
              {taxonomy}
            </div>
          )}
        </div>

        {/* Footer: Engagement Left, SaveButton Right */}
        {hasFooter && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs font-medium text-muted-foreground">
            <div className="relative z-10 flex flex-wrap items-center gap-2.5">
              {bottomLeft}
            </div>
            <div className="flex items-center gap-1.5 tabular-nums ml-auto">
              {bottomRight}
            </div>
          </div>
        )}
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
}: BaseDetailedCardProps) {
  const { isSignedIn, requireAuth } = useAuthGate();

  return (
    <article
      data-slot="base-detailed-card"
      data-variant={variant}
      className={cn(
        "rounded-xl border border-border",
        detailedCardVariantStyles[variant],
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {author ? (
            <div className="flex items-center gap-2 flex-wrap">
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
                <Avatar size="sm">
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
              <ContributorBadge
                tier={author.contributor_tier ?? 0}
                size="sm"
              />
              {authorBadge}
            </div>
          ) : null}
          {badges && <div className="flex flex-wrap gap-2 items-center">{badges}</div>}
        </div>
        {topRight && <div className="shrink-0">{topRight}</div>}
      </div>

      {mediaImages && <div className="mt-6">{mediaImages}</div>}

      <div className="mt-6 whitespace-pre-wrap text-sm sm:text-base text-foreground leading-relaxed [overflow-wrap:anywhere]">
        {body}
      </div>

      {fileAttachments && (
        <div className="mt-8 flex flex-col gap-3">
          <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
            Attachments
          </h3>
          <div className="flex flex-col gap-2">{fileAttachments}</div>
        </div>
      )}

      {interactions && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          {interactions}
        </div>
      )}
    </article>
  );
}
