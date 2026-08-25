import { PageSkeleton } from "@/components/layout/page-skeleton";

/**
 * Next.js loading boundary for the (app) route group.
 * Shown during route transitions within the authenticated shell.
 * Uses the shared PageSkeleton with cold-start messaging.
 */
export default function AppLoading() {
  return <PageSkeleton />;
}
