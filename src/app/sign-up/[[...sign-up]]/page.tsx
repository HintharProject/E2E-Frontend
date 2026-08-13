import Link from "next/link";
import { Button } from "@/components/ui";

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-[0_24px_60px_-40px_rgba(99,161,33,0.5)]">
        <p className="font-display text-3xl font-semibold text-brand-dark">E2E</p>
        <h1 className="mt-4 font-display text-2xl text-ink">Create account</h1>
        <p className="mt-2 text-sm text-ink-muted">
          New users become Students via JIT provisioning on the first API call.
        </p>
        <form className="mt-6 space-y-3">
          <label className="block text-xs font-semibold uppercase text-ink-muted">
            Display name
            <input
              defaultValue="New Learner"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm normal-case"
            />
          </label>
          <label className="block text-xs font-semibold uppercase text-ink-muted">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm normal-case"
            />
          </label>
          <label className="block text-xs font-semibold uppercase text-ink-muted">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm normal-case"
            />
          </label>
          <Button href="/forum" className="w-full">
            Sign up (mock)
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-brand-dark">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
