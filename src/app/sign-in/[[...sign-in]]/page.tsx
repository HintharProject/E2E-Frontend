import Link from "next/link";
import { Button } from "@/components/ui";
import { useMockData } from "@/lib/data-source";
import { SignIn } from "@clerk/nextjs";

function MockSignIn() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-[0_24px_60px_-40px_rgba(99,161,33,0.5)]">
      <h1 className="font-display text-2xl text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Mock mode — no API or database. Continue as the sample Admin user.
      </p>
      <Button href="/forum" className="mt-6 w-full">
        Continue to app
      </Button>
      <p className="mt-4 text-center text-sm text-ink-muted">
        No account?{" "}
        <Link href="/sign-up" className="font-semibold text-brand-dark">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-surface px-4 py-16">
      <div className="mb-8 text-center">
        <p className="font-display text-4xl font-semibold text-brand-dark">
          E2E
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Creator-led learning and community Q&amp;A
        </p>
      </div>
      {useMockData() ? (
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
