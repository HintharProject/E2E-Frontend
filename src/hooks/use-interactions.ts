import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import { useAuth } from "@clerk/nextjs";

export function useVotePost() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, value, voteWeight = 1 }: { postId: string; value: 1 | -1 | 0; voteWeight?: number }) => {
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
    onMutate: async ({ postId, value, voteWeight = 1 }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      // Optimistically update lists (infinite query structure) – update both user_vote AND vote_count
      queryClient.setQueryData(["posts"], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((post: any) => {
              if (post.id !== postId) return post;
              const prevVote = post.user_vote ?? 0;
              let delta = 0;
              if (value === 0) {
                delta = -(prevVote * voteWeight);
              } else if (prevVote === 0) {
                delta = value * voteWeight;
              } else {
                delta = (value - prevVote) * voteWeight;
              }
              return { ...post, user_vote: value, vote_count: (post.vote_count ?? 0) + delta };
            }),
          }))
        };
      });

      // Optimistically update individual post if cached
      if (previousPost) {
        const prevVote = (previousPost as any)?.user_vote ?? 0;
        let delta = 0;
        if (value === 0) {
          delta = -(prevVote * voteWeight);
        } else if (prevVote === 0) {
          delta = value * voteWeight;
        } else {
          delta = (value - prevVote) * voteWeight;
        }
        queryClient.setQueryData(["post", postId], (old: any) => ({
          ...old,
          user_vote: value,
          vote_count: ((old?.vote_count) ?? 0) + delta,
        }));
      }

      return { previousPosts, previousPost };
    },
    onError: (err, newVote, context) => {
      if (context?.previousPosts) queryClient.setQueryData(["posts"], context.previousPosts);
      if (context?.previousPost) queryClient.setQueryData(["post", newVote.postId], context.previousPost);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
  });
}

export function useVoteLesson() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ lessonId, value, voteWeight = 1 }: { lessonId: string; value: 1 | -1 | 0; voteWeight?: number }) => {
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
    onMutate: async ({ lessonId, value, voteWeight = 1 }) => {
      await queryClient.cancelQueries({ queryKey: ["lessons"] });
      await queryClient.cancelQueries({ queryKey: ["lesson", lessonId] });
      const previousLessons = queryClient.getQueryData(["lessons"]);
      const previousLesson = queryClient.getQueryData(["lesson", lessonId]);

      // Optimistically update lists – update both user_vote AND vote_count
      queryClient.setQueryData(["lessons"], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((lesson: any) => {
              if (lesson.id !== lessonId) return lesson;
              const prevVote = lesson.user_vote ?? 0;
              let delta = 0;
              if (value === 0) {
                delta = -(prevVote * voteWeight);
              } else if (prevVote === 0) {
                delta = value * voteWeight;
              } else {
                delta = (value - prevVote) * voteWeight;
              }
              return { ...lesson, user_vote: value, vote_count: (lesson.vote_count ?? 0) + delta };
            }),
          }))
        };
      });

      // Optimistically update individual lesson if cached
      if (previousLesson) {
        const prevVote = (previousLesson as any)?.user_vote ?? 0;
        let delta = 0;
        if (value === 0) {
          delta = -(prevVote * voteWeight);
        } else if (prevVote === 0) {
          delta = value * voteWeight;
        } else {
          delta = (value - prevVote) * voteWeight;
        }
        queryClient.setQueryData(["lesson", lessonId], (old: any) => ({
          ...old,
          user_vote: value,
          vote_count: ((old?.vote_count) ?? 0) + delta,
        }));
      }

      return { previousLessons, previousLesson };
    },
    onError: (err, newVote, context) => {
      if (context?.previousLessons) queryClient.setQueryData(["lessons"], context.previousLessons);
      if (context?.previousLesson) queryClient.setQueryData(["lesson", newVote.lessonId], context.previousLesson);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson"] });
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
    mutationFn: async ({ targetId, targetType }: { targetId: string; targetType: "POST" | "LESSON" | "USER" | "PROBLEM" | "SOLUTION" | "COMMENT" }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      
      const payload: Record<string, string> = {};
      if (targetType === "POST") payload.reported_post = targetId;
      else if (targetType === "LESSON") payload.reported_lesson = targetId;
      else if (targetType === "USER") payload.reported_user = targetId;
      else if (targetType === "PROBLEM") payload.reported_problem = targetId;
      else if (targetType === "SOLUTION") payload.reported_solution = targetId;
      else if (targetType === "COMMENT") payload.reported_comment = targetId;

      await apiFetch(`/reports/`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
}

export function useDeletePost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      await apiFetch(`/posts/${postId}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeleteLesson() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      await apiFetch(`/lessons/${lessonId}/`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useUpdateLessonState() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, state }: { lessonId: string; state: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      await apiFetch(`/lessons/${lessonId}/`, token, {
        method: "PATCH",
        body: JSON.stringify({ state }),
      });
    },
    onMutate: async ({ lessonId, state }) => {
      await queryClient.cancelQueries({ queryKey: ["lessons"] });
      await queryClient.cancelQueries({ queryKey: ["lesson", lessonId] });

      const previousList = queryClient.getQueryData(["lessons"]);
      const previousDetail = queryClient.getQueryData(["lesson", lessonId]);

      queryClient.setQueryData(["lessons"], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((lesson: any) =>
              lesson.id === lessonId ? { ...lesson, state } : lesson
            ),
          })),
        };
      });

      if (previousDetail) {
        queryClient.setQueryData(["lesson", lessonId], (old: any) => ({ ...old, state }));
      }

      return { previousList, previousDetail };
    },
    onError: (_err, { lessonId }, context) => {
      if (context?.previousList) queryClient.setQueryData(["lessons"], context.previousList);
      if (context?.previousDetail) queryClient.setQueryData(["lesson", lessonId], context.previousDetail);
    },
    onSettled: (_data, _err, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
    },
  });
}

export function useVoteComment() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, value }: { commentId: string; value: 1 | -1 | 0 }) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      if (value === 0) {
        await apiFetch(`/comments/${commentId}/vote/`, token, { method: "DELETE" });
      } else {
        await apiFetch(`/comments/${commentId}/vote/`, token, {
          method: "POST",
          body: JSON.stringify({ value }),
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
  });
}
