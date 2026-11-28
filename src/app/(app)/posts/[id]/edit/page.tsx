import { notFound } from "next/navigation";
import { apiFetch } from "@/services/api-client";
import { Post, Subject, Level, Tag } from "@/types";
import { isWriteLocked, isContentAuthor } from "@/types/user";
import { fetchCurrentUser } from "@/services/user-service";
import { UpdatePostForm } from "@/components/features/posts/update-post-form";
import { getServerAuthToken } from "@/lib/auth-server";

export default async function EditPostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const token = await getServerAuthToken();
  
  if (!token) notFound();

  let post: Post;
  try {
    post = await apiFetch<Post>(`/posts/${id}/`, token);
  } catch {
    notFound();
  }
  
  const user = await fetchCurrentUser(token).catch(() => null);
  
  if (!user) {
    notFound();
  }

  // Verify permissions: strictly author can edit
  if (!isContentAuthor(user, post.author_details, post.author)) {
    notFound();
  }

  const writeLocked = isWriteLocked(user.ban_state);

  const [subjects, levels, tags] = await Promise.all([
    apiFetch<Subject[]>("/subjects/", token),
    apiFetch<Level[]>("/levels/", token),
    apiFetch<Tag[]>("/tags/", token)
  ]).catch(() => [
    [] as Subject[],
    [] as Level[],
    [] as Tag[]
  ] as [Subject[], Level[], Tag[]]);

  return (
    <div className="mx-auto max-w-[52rem] space-y-6">
      <h1 className="sr-only">Edit post</h1>
      <UpdatePostForm
        post={post}
        subjects={subjects}
        levels={levels}
        tags={tags}
        userRole={user.role || ""}
        writeLocked={writeLocked}
      />
    </div>
  );
}
