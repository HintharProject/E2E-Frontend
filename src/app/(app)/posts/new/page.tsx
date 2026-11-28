import { notFound, redirect } from "next/navigation";
import { getServerAuthToken } from "@/lib/auth-server";
import { fetchCurrentUser } from "@/services/user-service";
import { isWriteLocked } from "@/types/user";
import { CreatePostForm } from "@/components/features/posts/create-post-form";

export default async function NewPostPage() {
  const token = await getServerAuthToken();
  if (!token) {
    redirect("/sign-in");
  }

  const user = await fetchCurrentUser(token).catch(() => null);
  if (!user) {
    notFound();
  }

  const userRole = user.role || "USER";
  const writeLocked = isWriteLocked(user.ban_state);

  return (
    <div className="mx-auto max-w-[52rem] space-y-6">
      <h1 className="sr-only">New post</h1>
      {writeLocked ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm font-medium text-destructive"
        >
          Your account is restricted. You cannot create forum posts at this time.
        </div>
      ) : (
        <CreatePostForm
          userRole={userRole}
          writeLocked={writeLocked}
        />
      )}
    </div>
  );
}
