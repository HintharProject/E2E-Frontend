import Link from "next/link";
import { Avatar, Badge, Button } from "@/components/ui";
import { isMockMode } from "@/lib/data-source";
import { users } from "@/lib/mock-data";
import { switchMockUser } from "@/lib/auth/actions";
import { SignUp } from "@clerk/nextjs";

function MockSignUp() {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-line bg-card p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Create test account</h1>
        <Badge tone="brand">Mock Mode</Badge>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        In mock mode, accounts are not persisted to a database. You can immediately enter as any role below to test the application:
      </p>

      <div className="mt-6 space-y-3">
        {[
          users.find((u) => u.id === "u-student1")!,
          users.find((u) => u.id === "u-creator1")!,
          users.find((u) => u.id === "u-admin")!,
        ].filter(Boolean).map((user) => (
          <form
            key={user.id}
            action={async () => {
              "use server";
              const target =
                user.role === "ADMIN"
                  ? "/admin"
                  : user.role === "CREATOR"
                    ? "/lessons/mine"
                    : "/forum";
              await switchMockUser(user.id, target);
            }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 transition hover:border-brand/40"
          >
            <div className="flex items-center gap-3">
              <Avatar src={user.imageUrl} name={user.displayName} size="md" />
              <div>
                <p className="font-semibold text-sm text-ink">{user.displayName}</p>
                <Badge tone={user.role === "ADMIN" ? "neutral" : "brand"}>
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button type="submit" variant="secondary" className="text-xs">
              Test as {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </Button>
          </form>
        ))}
      </div>

      <div className="mt-6 border-t border-line/60 pt-4 text-center">
        <p className="text-sm text-ink-muted">
          Want the full role selector with feature breakdown?{" "}
          <Link href="/sign-in" className="font-semibold text-brand-dark hover:underline">
            Go to Sign in page
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-surface px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/forum">
          <span className="font-display text-4xl font-semibold text-brand-dark">
            E2E
          </span>
        </Link>
        <p className="mt-2 text-sm text-ink-muted">
          New accounts start as Students — Creators are approved by Admins
        </p>
      </div>
      {isMockMode() ? (
        <MockSignUp />
      ) : (
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/forum"
        />
      )}
    </div>
  );
}
