"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Calendar, ExternalLink, GraduationCap, Loader2, Shield } from "lucide-react";
import { apiFetch } from "@/services/api-client";
import type { UserPublic } from "@/types";
import { isStaffRole, type Role } from "@/types/user";
import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CommentProfilePreviewUser {
  id: string;
  display_name?: string | null;
  profile_image_url?: string | null;
  contributor_tier?: number | null;
  role?: Role | null;
}

function getProfileInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function CommentUserProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: CommentProfilePreviewUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { getToken, isSignedIn } = useAuth();
  const userId = user?.id ?? "";

  const { data: fullProfile, isLoading } = useQuery<UserPublic>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const token =
        (await getToken()) ||
        (typeof window !== "undefined" ? localStorage.getItem("dev_token") : null);
      return apiFetch<UserPublic>(`/users/${userId}/`, token || undefined);
    },
    enabled: open && Boolean(userId) && Boolean(isSignedIn),
    staleTime: 5 * 60 * 1000,
  });

  const { data: levels = [] } = useLevels();
  const { data: subjects = [] } = useSubjects();

  const displayName = fullProfile?.display_name || user?.display_name || "Contributor";
  const avatarUrl = fullProfile?.profile_image_url ?? user?.profile_image_url ?? null;
  const role = fullProfile?.role ?? user?.role;
  const tier =
    fullProfile?.contributor_tier ??
    fullProfile?.reputation?.contributor_tier ??
    user?.contributor_tier ??
    0;
  const points =
    fullProfile?.contribution_points ?? fullProfile?.reputation?.contribution_points;

  const levelName =
    fullProfile?.custom_level ||
    (fullProfile?.level ? levels.find((l) => l.id === fullProfile.level)?.name : null);
  const strongSubjects = fullProfile?.good_subjects
    ? fullProfile.good_subjects
        .map((id) => subjects.find((s) => s.id === id)?.name)
        .filter((name): name is string => Boolean(name))
    : [];

  const joinedLabel =
    fullProfile?.created_at && !Number.isNaN(Date.parse(fullProfile.created_at))
      ? formatDate(fullProfile.created_at)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="comment-module-v2 cm-popover-surface sm:max-w-md">
        <DialogHeader className="pr-6">
          <div className="cm-profile-header">
            <Avatar size="lg" className="size-14 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback>{getProfileInitials(displayName)}</AvatarFallback>
            </Avatar>

            <div className="cm-profile-identity">
              <div className="cm-profile-title-row">
                <DialogTitle className="font-heading text-lg font-semibold leading-snug cm-profile-name">
                  {displayName}
                </DialogTitle>
                {role && isStaffRole(role) && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Shield className="size-3" aria-hidden="true" />
                    <span>{role}</span>
                  </Badge>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <ContributorBadge
                  tier={tier}
                  points={points}
                  size="sm"
                  interactive={false}
                />
                {typeof points === "number" && (
                  <span className="cm-profile-points">
                    {points.toLocaleString()} pts
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Profile summary for {displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="cm-profile-body">
          {isLoading && !fullProfile ? (
            <div className="cm-profile-loading" role="status">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              <span>Loading profile details...</span>
            </div>
          ) : (
            <>
              {fullProfile?.bio ? (
                <p className="cm-profile-bio">{fullProfile.bio}</p>
              ) : (
                <p className="cm-profile-bio cm-profile-bio-empty">
                  No bio added yet.
                </p>
              )}

              {(levelName || joinedLabel) && (
                <div className="cm-profile-meta-list">
                  {levelName && (
                    <span className="cm-profile-meta-item">
                      <GraduationCap className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{levelName}</span>
                    </span>
                  )}
                  {joinedLabel && (
                    <span className="cm-profile-meta-item">
                      <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>Joined {joinedLabel}</span>
                    </span>
                  )}
                </div>
              )}

              {strongSubjects.length > 0 && (
                <div className="cm-profile-subjects">
                  <span className="cm-profile-subjects-label">Strong subjects</span>
                  <div className="cm-profile-subjects-list">
                    {strongSubjects.slice(0, 5).map((name) => (
                      <Badge key={name} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            className="cm-btn"
            data-variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          {userId && (
            <Link
              href={`/users/${userId}`}
              onClick={() => onOpenChange(false)}
              className="cm-btn"
              data-variant="primary"
            >
              <span>View full profile</span>
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
