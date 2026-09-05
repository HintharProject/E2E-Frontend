"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { apiFetch } from "@/services/api-client";
import { UserPublic } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ForumFeed } from "@/components/features/forum-feed";
import { LessonsFeed } from "@/components/features/lessons-feed";
import { ContributorBadge } from "@/components/features/contributions/contributor-badge";
import { PointAdjustmentModal } from "@/components/features/admin/point-adjustment-modal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { ProfileSkeleton } from "../skeletons";
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
  const isAdmin = appCurrentUser?.role === "ADMIN";

  const levelName = profile.level ? levels.find((l) => l.id === profile.level)?.name : null;
  const goodSubjectNames = profile.good_subjects
    ? profile.good_subjects
        .map((id) => subjects.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(", ")
    : null;
  const weakSubjectNames = profile.weak_subjects
    ? profile.weak_subjects
        .map((id) => subjects.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(", ")
    : null;

  const effectiveTier = profile.contributor_tier ?? profile.reputation?.contributor_tier ?? 0;
  const effectivePoints =
    profile.contribution_points ??
    profile.reputation?.contribution_points ??
    0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar size="lg" className="size-20 ring-4 ring-muted">
            {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} />}
            <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <PageHeader title={profile.display_name} />
                <div className="mt-[-1.5rem] flex flex-wrap items-center gap-2.5">
                  <Badge variant="default">{profile.role}</Badge>
                  <ContributorBadge tier={effectiveTier} size="md" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" />
                    <span>{effectivePoints.toLocaleString()} Contribution Points</span>
                  </div>
                </div>
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

            {profile.bio && <p className="text-sm text-ink">{profile.bio}</p>}

            {(levelName || profile.custom_level || goodSubjectNames || weakSubjectNames) && (
              <div className="flex flex-col gap-1 text-xs text-ink-muted bg-muted/40 p-3 rounded-xl">
                {(levelName || profile.custom_level) && (
                  <p>
                    <span className="font-medium text-ink">Level:</span> {profile.custom_level || levelName}
                  </p>
                )}
                {goodSubjectNames && (
                  <p>
                    <span className="font-medium text-ink">Good Subjects:</span> {goodSubjectNames}
                  </p>
                )}
                {weakSubjectNames && (
                  <p>
                    <span className="font-medium text-ink">Weak Subjects:</span> {weakSubjectNames}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {!isSelf && (profile.role === "TEACHER" || profile.role === "SENIOR_STUDENT") ? (
                <Button size="sm">Follow</Button>
              ) : null}
              {!isSelf ? <Button variant="ghost" size="sm">Report profile</Button> : null}
              {isSelf && (
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/settings/profile" />}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Published Content */}
      <div className="space-y-8">
        {profile.role === "TEACHER" || profile.role === "SENIOR_STUDENT" ? (
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="font-heading text-xl font-bold text-ink">Published Lessons</h2>
              <div className="mt-4">
                <LessonsFeed authorId={userId} />
              </div>
            </section>
            <section>
              <h2 className="font-heading text-xl font-bold text-ink">Recent Posts</h2>
              <div className="mt-4">
                <ForumFeed authorId={userId} />
              </div>
            </section>
          </div>
        ) : (
          <section>
            <h2 className="font-heading text-xl font-bold text-ink">Recent Posts</h2>
            <div className="mt-4">
              <ForumFeed authorId={userId} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
