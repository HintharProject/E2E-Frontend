import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
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
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/forum"
      />
    </div>
  );
}
