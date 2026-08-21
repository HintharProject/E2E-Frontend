import Link from "next/link";
import { Avatar, Badge, Button } from "@/components/ui";
import { isMockMode } from "@/lib/data-source";
import { users } from "@/lib/mock-data";
import { switchMockUser } from "@/lib/auth/actions";
import { SignIn } from "@clerk/nextjs";

type RoleCardConfig = {
  userId: string;
  badgeTone: "brand" | "neutral" | "warn";
  badgeLabel: string;
  tagline: string;
  features: string[];
  redirectUrl: string;
  bgHighlight: string;
};

const PRIMARY_ROLES: RoleCardConfig[] = [
  {
    userId: "u-student1",
    badgeTone: "brand",
    badgeLabel: "STUDENT VIEW",
    tagline: "Learner & Community Participant",
    features: [
      "Browse lessons & followed creators",
      "Ask questions & share solutions in forum",
      "Organize study plans & saved sessions",
    ],
    redirectUrl: "/forum",
    bgHighlight: "hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100",
  },
  {
    userId: "u-creator1",
    badgeTone: "brand",
    badgeLabel: "CREATOR VIEW",
    tagline: "Educator & Content Publisher",
    features: [
      "Access Creator Studio & lesson builder",
      "Manage Draft, Published & Archived lessons",
      "Post official course announcements",
    ],
    redirectUrl: "/lessons/mine",
    bgHighlight: "hover:border-brand hover:ring-2 hover:ring-brand/20",
  },
  {
    userId: "u-admin",
    badgeTone: "neutral",
    badgeLabel: "ADMIN VIEW",
    tagline: "Platform Steward & Moderator",
    features: [
      "Full moderation queue (posts, lessons, users)",
      "Audit logs & platform activity review",
      "Manage user roles & ban status",
    ],
    redirectUrl: "/admin",
    bgHighlight: "hover:border-purple-400 hover:ring-2 hover:ring-purple-100",
  },
];

const SECONDARY_USERS = [
  {
    userId: "u-creator2",
    label: "Morgan Mentor (Biology Creator)",
    role: "CREATOR",
    hint: "Secondary creator with 86 followers & ecology lessons",
    redirectUrl: "/lessons/mine",
  },
  {
    userId: "u-student2",
    label: "Riley Reader (Student with Warning)",
    role: "STUDENT",
    hint: "Test account with WARNING ban state and moderation flags",
    redirectUrl: "/forum",
  },
  {
    userId: "u-student3",
    label: "Jordan Justice (Banned Student — 7 Days)",
    role: "STUDENT",
    hint: "Restricted persona (BANNED_7D) with cooldown timer, reason, & read-only lock",
    redirectUrl: "/users/u-student3",
  },
];

function MockSignIn() {
  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
          <span>Mock Data Mode Active</span>
        </div>
        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">
          Choose Account Type to Test
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted">
          Select a role persona below to test the platform experience with
          appropriate permissions, layouts, and data.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PRIMARY_ROLES.map((cfg) => {
          const user = users.find((u) => u.id === cfg.userId);
          if (!user) return null;

          return (
            <div
              key={cfg.userId}
              className={`relative flex flex-col justify-between rounded-3xl border border-line bg-card p-6 shadow-sm transition ${cfg.bgHighlight}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge tone={cfg.badgeTone}>{cfg.badgeLabel}</Badge>
                  <span className="text-xs font-semibold text-ink-muted">
                    ID: {user.id}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Avatar
                    src={user.imageUrl}
                    name={user.displayName}
                    size="lg"
                  />
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      {user.displayName}
                    </h2>
                    <p className="text-xs text-ink-muted">{cfg.tagline}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs italic text-ink-muted line-clamp-2">
                  &ldquo;{user.bio}&rdquo;
                </p>

                <div className="my-4 border-t border-line/60 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                    Included capabilities
                  </p>
                  <ul className="space-y-1.5 text-xs text-ink">
                    {cfg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-brand font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <form
                action={async () => {
                  "use server";
                  await switchMockUser(cfg.userId, cfg.redirectUrl);
                }}
                className="mt-6 pt-2"
              >
                <Button type="submit" className="w-full">
                  Sign in as {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </Button>
              </form>
            </div>
          );
        })}
      </div>

      {/* Secondary Persona Options */}
      <div className="mt-8 rounded-2xl border border-line bg-white/70 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Alternative test accounts
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SECONDARY_USERS.map((item) => {
            const user = users.find((u) => u.id === item.userId);
            if (!user) return null;
            return (
              <form
                key={item.userId}
                action={async () => {
                  "use server";
                  await switchMockUser(item.userId, item.redirectUrl);
                }}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 transition hover:border-brand/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={user.imageUrl}
                    name={user.displayName}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">
                      {item.label}
                    </p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {item.hint}
                    </p>
                  </div>
                </div>
                <Button type="submit" variant="secondary" className="text-xs px-2.5 py-1 shrink-0">
                  Select
                </Button>
              </form>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Need to register a custom account profile?{" "}
        <Link href="/sign-up" className="font-semibold text-brand-dark hover:underline">
          Go to Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="mb-6 text-center">
        <Link href="/forum">
          <span className="font-display text-4xl font-semibold text-brand-dark">
            E2E
          </span>
        </Link>
        <p className="mt-1 text-sm text-ink-muted">
          Creator-led learning and community Q&amp;A
        </p>
      </div>
      {isMockMode() ? (
        <MockSignIn />
      ) : (
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/forum"
        />
      )}
    </div>
  );
}
