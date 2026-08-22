import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getUser, savedSessions, studyPlans } from "@/lib/mock-data";
import { currentUser } from "@clerk/nextjs/server";
import { isWriteLocked } from "@/types/user";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

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
  const me = clerkUser ? { id: clerkUser.id, role: "STUDENT" } : { id: "u1", role: "ADMIN" };
  const profile = getUser(id);
  if (!profile) notFound();

  const appProfile = {
    id: profile.id,
    displayName: profile.displayName,
    imageUrl: profile.imageUrl,
    role: profile.role,
    banState: profile.banState,
    bio: profile.bio,
    followerCount: profile.followerCount,
    banDetails: profile.banDetails,
  };

  const isSelf = me.id === appProfile.id;
  const isAdmin = me.role === "ADMIN";
  const isRestricted = isWriteLocked(appProfile.banState) || appProfile.banState === "WARNING";
  const publicPlans = studyPlans.filter(
    (p) => p.ownerId === appProfile.id && p.isPublic,
  );
  const publicSessions = savedSessions.filter(
    (s) => s.ownerId === appProfile.id && s.isPublic,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar size="lg">
             {appProfile.imageUrl && <AvatarImage src={appProfile.imageUrl} />}
             <AvatarFallback>{getInitials(appProfile.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <PageHeader
              title={appProfile.displayName}
              description={appProfile.bio}
            />
            <div className="mt-[-1.5rem] flex flex-wrap gap-2">
              <Badge variant="default">{appProfile.role}</Badge>
              <Badge
                variant={
                  appProfile.banState === "ACTIVE"
                    ? "outline"
                    : appProfile.banState === "WARNING"
                      ? "secondary"
                      : "destructive"
                }
                className={appProfile.banState === "WARNING" ? "bg-warning/20 text-warning" : ""}
              >
                {appProfile.banState}
              </Badge>
              {appProfile.role === "CREATOR" &&
              appProfile.followerCount != null ? (
                <Badge variant="outline">{appProfile.followerCount} followers</Badge>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!isSelf && appProfile.role === "CREATOR" ? (
                <Button>Follow</Button>
              ) : null}
              {!isSelf ? <Button variant="ghost">Report profile</Button> : null}
            </div>
          </div>
        </div>

        {/* Account Restriction / Cooldown Notice Box */}
        {isRestricted || appProfile.banDetails ? (
          <div
            className={`mt-6 rounded-2xl border p-5 ${
              appProfile.banState === "WARNING"
                ? "border-amber-200 bg-amber-50/70 text-amber-950 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-200"
                : "border-rose-200 bg-rose-50/70 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {appProfile.banState === "WARNING" ? "⚠️" : "🚫"}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">
                    {appProfile.banState === "WARNING"
                      ? "Account Moderation Warning"
                      : `Account Suspension Notice — ${
                          appProfile.banDetails?.duration ?? appProfile.banState
                        }`}
                  </h3>
                  <p className="text-xs opacity-80">
                    {isSelf
                      ? "Official penalty details for your account"
                      : "Public moderation record on file for this user"}
                  </p>
                </div>
              </div>
              <Badge
                variant={appProfile.banState === "WARNING" ? "secondary" : "destructive"}
                className={appProfile.banState === "WARNING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100" : ""}
              >
                {appProfile.banDetails?.duration ?? appProfile.banState}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3.5 text-xs sm:grid-cols-2">
              <div>
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Reason for Action (Banned for What)
                </span>
                <p className="mt-1 font-medium">
                  {appProfile.banDetails?.reason ??
                    "Violation of community conduct standards."}
                </p>
              </div>

              <div>
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Policy / Rule Violated
                </span>
                <p className="mt-1 font-medium">
                  {appProfile.banDetails?.ruleViolated ??
                    "Community Guidelines"}
                </p>
              </div>

              <div>
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Date Issued (Banned When)
                </span>
                <p className="mt-1 font-medium">
                  {appProfile.banDetails?.bannedAt
                    ? formatDate(appProfile.banDetails.bannedAt)
                    : "Active record"}
                </p>
              </div>

              <div>
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Cooldown Period & Expiration
                </span>
                <p className="mt-1 font-medium">
                  {appProfile.banDetails?.cooldownExpiresAt
                    ? `${formatDate(appProfile.banDetails.cooldownExpiresAt)} (${
                        appProfile.banDetails.cooldownRemaining ?? "Active cooldown"
                      })`
                    : "No cooldown timer"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Restriction Scope
                </span>
                <p className="mt-1 font-medium">
                  {appProfile.banDetails?.readOnlyRestriction ??
                    (isWriteLocked(appProfile.banState)
                      ? "Read-only mode: Cannot create posts, write comments, cast votes, or edit content."
                      : "Account under observation; writes permitted.")}
                </p>
              </div>

              <div>
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Moderator Action By
                </span>
                <p className="mt-1 font-medium">
                  {appProfile.banDetails?.issuedBy ?? "Platform Moderation"}
                </p>
              </div>
            </div>

            {isSelf && isWriteLocked(appProfile.banState) ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-white/90 dark:bg-black/50 p-3.5 text-xs text-ink-muted">
                <p className="font-semibold text-rose-900 dark:text-rose-400">
                  How Cooldown Works for You:
                </p>
                <p className="mt-1">
                  Your write permissions are locked until the cooldown ends on{" "}
                  <strong className="text-ink">
                    {appProfile.banDetails?.cooldownExpiresAt
                      ? formatDate(appProfile.banDetails.cooldownExpiresAt)
                      : "the expiry date"}
                  </strong>
                  . You can still read forums, study lesson content, and view public collections. Write capabilities will automatically restore after cooldown.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {isAdmin && !isSelf ? (
          <div className="mt-8 grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
            <Field label="Update role">
              <select className={inputClass} defaultValue={appProfile.role}>
                <option value="STUDENT">Student</option>
                <option value="CREATOR">Creator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <Field label="Ban status">
              <select className={inputClass} defaultValue={appProfile.banState}>
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
