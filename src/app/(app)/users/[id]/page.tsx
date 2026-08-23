import { UserProfileView } from "@/components/features/users/user-profile-view";

/**
 * User profile page — thin server shell.
 *
 * Delegates to UserProfileView (client component) which:
 *  1. Shows an instant skeleton while fetching
 *  2. Uses React Query cache (staleTime: 5min) for repeat visits
 *
 * This replaces the previous async server component that blocked for ~2-3s
 * while awaiting currentUser() + auth() + apiFetch() sequentially.
 */
export default async function UserProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <UserProfileView userId={id} />;
}
