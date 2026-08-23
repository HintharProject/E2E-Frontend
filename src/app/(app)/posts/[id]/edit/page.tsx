import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { auth, currentUser } from "@clerk/nextjs/server";
import { apiFetch } from "@/services/api-client";
import { Post, PaginatedResponse, Subject, Level, Tag } from "@/types";
import { isWriteLocked } from "@/types/user";
import { UpdatePostForm } from "@/components/features/posts/update-post-form";

export default async function EditPostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) notFound();

  let post: Post;
  try {
    post = await apiFetch<Post>(`/posts/${id}/`, token);
  } catch (error) {
    notFound();
  }
  
  const clerkUser = await currentUser();
  const user = clerkUser ? { role: "STUDENT", banState: "ACTIVE" } : { role: "ADMIN", banState: "ACTIVE" };
  
  // Verify permissions: only author or admin can edit
  if (user.role !== "ADMIN" && post.author_details?.clerk_id !== clerkUser?.id) {
    notFound(); // Alternatively, show a permission denied page
  }

  const writeLocked = isWriteLocked(user.banState as "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN");

  const [subjects, levels, tags] = await Promise.all([
    apiFetch<Subject[]>("/subjects/", ""),
    apiFetch<Level[]>("/levels/", ""),
    apiFetch<Tag[]>("/tags/", token)
  ]).catch(() => [
    [] as Subject[],
    [] as Level[],
    [] as Tag[]
  ] as [Subject[], Level[], Tag[]]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="Edit post" description="Update your post details." />
      <UpdatePostForm
        post={post}
        subjects={subjects}
        levels={levels}
        tags={tags}
        userRole={user.role}
        writeLocked={writeLocked}
      />
    </div>
  );
}
