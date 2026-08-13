import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Field,
  PageHeader,
  inputClass,
} from "@/components/ui";
import {
  getCurrentUser,
  getUser,
  savedSessions,
  studyPlans,
} from "@/lib/mock-data";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = getUser(id);
  if (!profile) notFound();
  const me = getCurrentUser();
  const isSelf = me.id === profile.id;
  const isAdmin = me.role === "ADMIN";
  const publicPlans = studyPlans.filter(
    (p) => p.ownerId === profile.id && p.isPublic,
  );
  const publicSessions = savedSessions.filter(
    (s) => s.ownerId === profile.id && s.isPublic,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar src={profile.imageUrl} name={profile.displayName} size="lg" />
          <div className="flex-1">
            <PageHeader
              title={profile.displayName}
              description={profile.bio}
            />
            <div className="mt-[-1.5rem] flex flex-wrap gap-2">
              <Badge tone="brand">{profile.role}</Badge>
              <Badge
                tone={
                  profile.banState === "ACTIVE"
                    ? "muted"
                    : profile.banState === "WARNING"
                      ? "warn"
                      : "danger"
                }
              >
                {profile.banState}
              </Badge>
              {profile.role === "CREATOR" && profile.followerCount != null ? (
                <Badge tone="muted">{profile.followerCount} followers</Badge>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!isSelf && profile.role === "CREATOR" ? (
                <Button>Follow</Button>
              ) : null}
              {!isSelf ? <Button variant="ghost">Report profile</Button> : null}
            </div>
          </div>
        </div>

        {isAdmin && !isSelf ? (
          <div className="mt-8 grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
            <Field label="Update role">
              <select className={inputClass} defaultValue={profile.role}>
                <option value="STUDENT">Student</option>
                <option value="CREATOR">Creator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <Field label="Ban status">
              <select className={inputClass} defaultValue={profile.banState}>
                <option value="ACTIVE">Active</option>
                <option value="WARNING">Warning</option>
                <option value="BANNED_24H">24 Hours</option>
                <option value="BANNED_7D">7 Days</option>
                <option value="PERMANENT_BAN">Permanent</option>
              </select>
            </Field>
            <Button type="button">Apply (mock)</Button>
          </div>
        ) : null}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Public study plans</h2>
        <ul className="mt-3 space-y-2">
          {publicPlans.length === 0 ? (
            <li className="text-sm text-ink-muted">None public.</li>
          ) : (
            publicPlans.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/study-plans/${p.id}`}
                  className="font-semibold text-brand-dark hover:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Public saved sessions</h2>
        <ul className="mt-3 space-y-2">
          {publicSessions.length === 0 ? (
            <li className="text-sm text-ink-muted">None public.</li>
          ) : (
            publicSessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/saved-sessions/${s.id}`}
                  className="font-semibold text-brand-dark hover:underline"
                >
                  {s.title}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
