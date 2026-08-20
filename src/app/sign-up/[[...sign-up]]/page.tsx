import Link from "next/link";
import { Button } from "@/components/ui";
import { useMockData } from "@/lib/data-source";
import { SignUp } from "@clerk/nextjs";

function MockSignUp() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-[0_24px_60px_-40px_rgba(99,161,33,0.5)]">
      <h1 className="font-display text-2xl text-ink">Create account</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Mock mode — accounts are not persisted. Continue to explore sample data.
      </p>
      <Button href="/forum" className="mt-6 w-full">
        Continue to app
      </Button>
      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-brand-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-surface px-4 py-16">
      <div className="mb-8 text-center">
        <p className="font-display text-4xl font-semibold text-brand-dark">
          E2E
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          New accounts start as Students — Creators are approved by Admins
        </p>
      </div>
      {useMockData() ? (
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
