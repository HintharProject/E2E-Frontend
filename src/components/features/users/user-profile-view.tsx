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

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

import { useLevels, useSubjects } from "@/hooks/use-metadata";
import { ProfileSkeleton } from "../skeletons";

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
  
  const levelName = profile.level ? levels.find(l => l.id === profile.level)?.name : null;
  const goodSubjectNames = profile.good_subjects 
    ? profile.good_subjects.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(", ")
    : null;
  const weakSubjectNames = profile.weak_subjects
    ? profile.weak_subjects.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(", ")
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar size="lg">
            {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} />}
            <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <PageHeader title={profile.display_name} />
            <div className="mt-[-1.5rem] flex flex-wrap gap-2">
              <Badge variant="default">{profile.role}</Badge>
            </div>
            {profile.bio && <p className="mt-4 text-ink">{profile.bio}</p>}
            
            {(levelName || profile.custom_level || goodSubjectNames || weakSubjectNames) && (
              <div className="mt-4 flex flex-col gap-1 text-sm text-ink-muted">
                {(levelName || profile.custom_level) && (
                  <p><span className="font-medium text-ink">Level:</span> {profile.custom_level || levelName}</p>
                )}
                {goodSubjectNames && <p><span className="font-medium text-ink">Good Subjects:</span> {goodSubjectNames}</p>}
                {weakSubjectNames && <p><span className="font-medium text-ink">Weak Subjects:</span> {weakSubjectNames}</p>}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!isSelf && (profile.role === "TEACHER" || profile.role === "SENIOR_STUDENT") ? (
                <Button>Follow</Button>
              ) : null}
              {!isSelf ? <Button variant="ghost">Report profile</Button> : null}
              {isSelf && (
                <Button variant="outline" nativeButton={false} render={<Link href="/settings/profile" />}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {profile.role === "TEACHER" || profile.role === "SENIOR_STUDENT" ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-display text-2xl text-ink">Published Lessons</h2>
            <div className="mt-6">
              <LessonsFeed authorId={userId} />
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl text-ink">Recent Posts</h2>
            <div className="mt-6">
              <ForumFeed authorId={userId} />
            </div>
          </section>
        </div>
      ) : (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">Recent Posts</h2>
          <div className="mt-6">
            <ForumFeed authorId={userId} />
          </div>
        </section>
      )}
    </div>
  );
}
