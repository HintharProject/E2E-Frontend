"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { apiFetch } from "@/services/api-client";
import type { UserPublic } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { PointAdjustmentModal } from "@/components/features/admin/point-adjustment-modal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { isAdminOrSuperAdmin, isStaffRole } from "@/types/user";
import { useContributionStats } from "@/hooks/use-contribution";
import { ProfileSkeleton } from "../skeletons";
import { ProfileLessonsRail } from "./profile-lessons-rail";
import { ProfileActivityTabs } from "./profile-activity-tabs";
import { formatDate } from "@/lib/utils";
import { Sparkles } from "lucide-react";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function UserProfileView({ userId }: { userId: string }) {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { user: appCurrentUser } = useCurrentUser();

  const { data: levels = [] } = useLevels();
  const { data: subjects = [] } = useSubjects();

  // Warm up contribution stats for the profile tabs and lessons rail
  useContributionStats(userId);

  const { data: profile, isLoading, isError } = useQuery<UserPublic>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<UserPublic>(`/users/${userId}/`, token);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-ink-muted">Could not load this profile.</p>
      </div>
    );
  }

  const isSelf = clerkUser?.id === profile.clerk_id;
  const isAdmin = isAdminOrSuperAdmin(appCurrentUser?.role);

  const levelName = profile.level ? levels.find((l) => l.id === profile.level)?.name : null;
  const goodSubjectNames = profile.good_subjects
    ? profile.good_subjects.map((id) => subjects.find((s) => s.id === id)?.name).filter(Boolean).join(", ")
    : null;
  const weakSubjectNames = profile.weak_subjects
    ? profile.weak_subjects.map((id) => subjects.find((s) => s.id === id)?.name).filter(Boolean).join(", ")
    : null;

  const effectiveTier = profile.contributor_tier ?? profile.reputation?.contributor_tier ?? 0;
  const effectivePoints =
    profile.contribution_points ??
    profile.reputation?.contribution_points ??
    0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <article className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-20 sm:size-24 ring-4 ring-muted">
            {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} />}
            <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {profile.display_name}
                  </h1>
                  {isStaffRole(profile.role) && (
                    <Badge variant="outline">{profile.role}</Badge>
                  )}
                  <ContributorBadge tier={effectiveTier} size="md" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" />
                    <span>{effectivePoints.toLocaleString()} Contribution Points</span>
                  </div>
                </div>

                {profile.created_at && (
                  <p className="mt-1 text-sm text-ink-muted">
                    Joined {formatDate(profile.created_at)}
                  </p>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && !isSelf && (
                <PointAdjustmentModal
                  user={{
                    id: profile.id,
                    display_name: profile.display_name,
                    contributor_tier: effectiveTier,
                    contribution_points: effectivePoints,
                  }}
                />
              )}
            </div>

            {profile.bio ? (
              <p className="mt-4 max-w-2xl text-ink">{profile.bio}</p>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">No bio yet.</p>
            )}

            {(levelName || profile.custom_level || goodSubjectNames || weakSubjectNames) && (
              <div className="mt-4 flex flex-col gap-1 text-xs text-ink-muted bg-muted/40 p-3 rounded-xl">
                {(levelName || profile.custom_level) && (
                  <p>
                    <span className="font-medium text-ink">Level:</span>{" "}
                    {profile.custom_level || levelName}
                  </p>
                )}
                {goodSubjectNames && (
                  <p>
                    <span className="font-medium text-ink">Good subjects:</span> {goodSubjectNames}
                  </p>
                )}
                {weakSubjectNames && (
                  <p>
                    <span className="font-medium text-ink">Weak subjects:</span> {weakSubjectNames}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {!isSelf && <Button size="sm">Follow</Button>}
              {!isSelf && <Button variant="ghost" size="sm">Report profile</Button>}
              {isSelf && (
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/settings/profile" />}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </article>

      <ProfileLessonsRail userId={userId} />
      <ProfileActivityTabs userId={userId} />
    </div>
  );
}
