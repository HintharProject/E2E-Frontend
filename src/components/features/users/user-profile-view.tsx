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

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-pulse">
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-16 w-16 rounded-full bg-line shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 rounded-lg bg-line" />
            <div className="h-5 w-20 rounded bg-line" />
          </div>
        </div>
      </div>
      <div className="mt-10 space-y-4">
        <div className="h-6 w-40 rounded bg-card border border-line" />
        <div className="h-32 w-full rounded-2xl bg-card border border-line" />
        <div className="h-32 w-full rounded-2xl bg-card border border-line" />
      </div>
    </div>
  );
}

export function UserProfileView({ userId }: { userId: string }) {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

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
            <div className="mt-4 flex flex-wrap gap-2">
              {!isSelf && profile.role === "CREATOR" ? (
                <Button>Follow</Button>
              ) : null}
              {!isSelf ? <Button variant="ghost">Report profile</Button> : null}
            </div>
          </div>
        </div>
      </div>

      {profile.role === "CREATOR" ? (
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
