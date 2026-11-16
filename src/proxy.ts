import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/problems(.*)",
  "/resources(.*)",
  "/train(.*)",
  "/lessons",
  "/forum(.*)",
  "/posts(.*)",
  "/search(.*)",
]);

const isProtectedWriteOrMemberRoute = createRouteMatcher([
  "/problems/new",
  "/problems/(.*)/edit",
  "/posts/new",
  "/posts/(.*)/edit",
  "/lessons/new",
  "/lessons/(.+)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedWriteOrMemberRoute(request) || !isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
