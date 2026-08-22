import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import { useAuth } from "@clerk/nextjs";

export function useVotePost() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, value }: { postId: string; value: 1 | -1 | 0 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      if (value === 0) {
        await apiFetch(`/posts/${postId}/vote/`, token, { method: "DELETE" });
      } else {
        await apiFetch(`/posts/${postId}/vote/`, token, {
          method: "POST",
          body: JSON.stringify({ value }),
        });
      }
    },
    onMutate: async ({ postId, value }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousPost = queryClient.getQueryData(["posts", postId]);

      // Optimistically update lists (infinite query structure)
      queryClient.setQueryData(["posts"], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((post: any) => 
              post.id === postId ? { ...post, user_vote: value } : post
            )
          }))
        };
      });

      // Optimistically update individual post if cached
      if (previousPost) {
        queryClient.setQueryData(["posts", postId], (old: any) => ({ ...old, user_vote: value }));
      }

      return { previousPosts, previousPost };
    },
    onError: (err, newVote, context) => {
      if (context?.previousPosts) queryClient.setQueryData(["posts"], context.previousPosts);
      if (context?.previousPost) queryClient.setQueryData(["posts", newVote.postId], context.previousPost);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useVoteLesson() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ lessonId, value }: { lessonId: string; value: 1 | -1 | 0 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      if (value === 0) {
        await apiFetch(`/lessons/${lessonId}/vote/`, token, { method: "DELETE" });
      } else {
        await apiFetch(`/lessons/${lessonId}/vote/`, token, {
          method: "POST",
          body: JSON.stringify({ value }),
        });
      }
    },
    onMutate: async ({ lessonId, value }) => {
      await queryClient.cancelQueries({ queryKey: ["lessons"] });
      const previousLessons = queryClient.getQueryData(["lessons"]);
      const previousLesson = queryClient.getQueryData(["lessons", lessonId]);

      queryClient.setQueryData(["lessons"], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((lesson: any) => 
              lesson.id === lessonId ? { ...lesson, user_vote: value } : lesson
            )
          }))
        };
      });

      if (previousLesson) {
        queryClient.setQueryData(["lessons", lessonId], (old: any) => ({ ...old, user_vote: value }));
      }

      return { previousLessons, previousLesson };
    },
    onError: (err, newVote, context) => {
      if (context?.previousLessons) queryClient.setQueryData(["lessons"], context.previousLessons);
      if (context?.previousLesson) queryClient.setQueryData(["lessons", newVote.lessonId], context.previousLesson);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      if (isFollowing) {
        await apiFetch(`/users/${userId}/follow/`, token, { method: "POST" });
      } else {
        await apiFetch(`/users/${userId}/follow/`, token, { method: "DELETE" });
      }
    },
    onMutate: async ({ userId, isFollowing }) => {
      await queryClient.cancelQueries({ queryKey: ["user", userId] });
      const previousUser = queryClient.getQueryData(["user", userId]);

      if (previousUser) {
        queryClient.setQueryData(["user", userId], (old: any) => ({ ...old, is_following: isFollowing }));
      }
      return { previousUser };
    },
    onError: (err, variables, context) => {
      if (context?.previousUser) queryClient.setQueryData(["user", variables.userId], context.previousUser);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useReport() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ targetId, targetType }: { targetId: string; targetType: "POST" | "LESSON" | "USER" }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      const payload: Record<string, string> = {};
      if (targetType === "POST") payload.reported_post_id = targetId;
      else if (targetType === "LESSON") payload.reported_lesson_id = targetId;
      else if (targetType === "USER") payload.reported_user_id = targetId;

      await apiFetch(`/reports/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
}
