import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Network Boundary Proxy (proxy.ts)
// Per AGENTS.md: Next.js 16 Network Boundary proxy. Do not rename to middleware.ts.
// Clerk components disabled for development without external Clerk dependencies.
// ---------------------------------------------------------------------------

export default function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
