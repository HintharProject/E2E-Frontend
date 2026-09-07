"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { apiFetch } from "@/services/api-client";
import { UserPublic } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { ProfileSkeleton } from "../skeletons";
import { ProfileLessonsRail } from "./profile-lessons-rail";
import { ProfileActivityTabs } from "./profile-activity-tabs";
import { formatDate } from "@/lib/utils";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function roleLabel(role: UserPublic["role"]) {
  if (role === "CREATOR") return "Creator";
  if (role === "TEACHER") return "Teacher";
  if (role === "SENIOR_STUDENT") return "Senior Student";
  if (role === "ADMIN") return "Admin";
  return "Student";
}

export function UserProfileView({ userId }: { userId: string }) {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

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
  const canFollow =
    !isSelf &&
    (profile.role === "CREATOR" ||
      profile.role === "TEACHER" ||
      profile.role === "SENIOR_STUDENT");

  const levelName = profile.level ? levels.find((l) => l.id === profile.level)?.name : null;
  const goodSubjectNames = profile.good_subjects
    ? profile.good_subjects.map((id) => subjects.find((s) => s.id === id)?.name).filter(Boolean).join(", ")
    : null;
  const weakSubjectNames = profile.weak_subjects
    ? profile.weak_subjects.map((id) => subjects.find((s) => s.id === id)?.name).filter(Boolean).join(", ")
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <article className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-20 sm:size-24">
            {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} />}
            <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {profile.display_name}
              </h1>
              <Badge variant={profile.role === "ADMIN" ? "outline" : "default"}>
                {roleLabel(profile.role)}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-ink-muted">
              Joined {formatDate(profile.created_at)}
            </p>

            {profile.bio ? (
              <p className="mt-4 max-w-2xl text-ink">{profile.bio}</p>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">No bio yet.</p>
            )}

            {(levelName || profile.custom_level || goodSubjectNames || weakSubjectNames) && (
              <div className="mt-4 flex flex-col gap-1 text-sm text-ink-muted">
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
              {canFollow ? <Button>Follow</Button> : null}
              {!isSelf ? <Button variant="ghost">Report profile</Button> : null}
              {isSelf && (
                <Button variant="outline" nativeButton={false} render={<Link href="/settings/profile" />}>
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
