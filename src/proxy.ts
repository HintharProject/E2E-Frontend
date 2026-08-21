import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function checkMockMode(): boolean {
  const flag = process.env.USE_MOCK_DATA?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export const proxy = checkMockMode()
  ? function proxyMiddleware() {
      return NextResponse.next();
    }
  : clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect();
      }
    });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
