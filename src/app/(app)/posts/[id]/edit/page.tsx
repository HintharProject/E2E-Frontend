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
  if (user.role !== "ADMIN" && post.author !== clerkUser?.id) {
    notFound(); // Alternatively, show a permission denied page
  }

  const writeLocked = isWriteLocked(user.banState as "WARNING" | "BANNED_24H" | "BANNED_7D" | "PERMANENT_BAN");

  const [subjectsRes, levelsRes, tagsRes] = await (Promise.all([
    apiFetch<PaginatedResponse<Subject>>("/subjects/", ""),
    apiFetch<PaginatedResponse<Level>>("/levels/", ""),
    apiFetch<PaginatedResponse<Tag>>("/tags/", "")
  ]) as Promise<[PaginatedResponse<Subject>, PaginatedResponse<Level>, PaginatedResponse<Tag>]>).catch(() => [
    { data: [] as Subject[] },
    { data: [] as Level[] },
    { data: [] as Tag[] }
  ] as [PaginatedResponse<Subject>, PaginatedResponse<Level>, PaginatedResponse<Tag>]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="Edit post" description="Update your post details." />
      <UpdatePostForm
        post={post}
        subjects={subjectsRes.data}
        levels={levelsRes.data}
        tags={tagsRes.data}
        userRole={user.role}
        writeLocked={writeLocked}
      />
    </div>
  );
}
