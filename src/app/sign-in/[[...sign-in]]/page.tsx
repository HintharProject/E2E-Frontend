import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted px-4 py-12">
      <div className="mb-6 text-center">
        <Link href="/forum">
          <span className="font-heading text-4xl font-semibold text-primary">
            E2E
          </span>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Creator-led learning and community Q&amp;A
        </p>
      </div>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/forum"
      />
    </div>
  );
}
