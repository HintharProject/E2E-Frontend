import { PostDetailView } from "@/components/features/posts/post-detail-view";

/**
 * Post detail page — thin server shell.
 *
 * Rendering happens entirely client-side via PostDetailView, which:
 *  1. Shows an instant skeleton while fetching
 *  2. Returns cached data immediately on repeat visits (staleTime: 5min)
 *  3. Leverages prefetch-on-hover from PostCard for near-instant loads
 *
 * This replaces the previous async server component that blocked for ~2-3s
 * while awaiting auth() + apiFetch() sequentially.
 */
export default async function PostDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <PostDetailView postId={id} />;
}
