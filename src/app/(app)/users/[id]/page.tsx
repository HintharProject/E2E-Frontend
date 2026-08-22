import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/services/api-client";
import { UserPublic } from "@/types";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function UserProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const clerkUser = await currentUser();
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) notFound();

  let profile: UserPublic;
  try {
    profile = await apiFetch<UserPublic>(`/users/${id}/`, token);
  } catch (error) {
    notFound();
  }

  const isSelf = clerkUser?.id === profile.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar size="lg">
             {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} />}
             <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <PageHeader
              title={profile.display_name}
            />
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

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Public study plans</h2>
        <ul className="mt-3 space-y-2">
          <li className="text-sm text-ink-muted">Coming soon...</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Public saved sessions</h2>
        <ul className="mt-3 space-y-2">
          <li className="text-sm text-ink-muted">Coming soon...</li>
        </ul>
      </section>
    </div>
  );
}
