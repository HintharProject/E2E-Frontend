"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDeletePost } from "@/hooks/use-interactions";
import { useState } from "react";

export function PostAuthorActions({ postId }: { postId: string }) {
  const router = useRouter();
  const deleteMutation = useDeletePost();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(postId);
      router.push("/forum");
      router.refresh();
    } catch (error) {
      alert("Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="secondary" nativeButton={false} render={<Link href={`/posts/${postId}/edit`} />}>
        Edit
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </>
  );
}
