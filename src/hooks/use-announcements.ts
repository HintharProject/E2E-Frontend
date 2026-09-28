import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/services/api-client";
import { toast } from "sonner";

export interface AnnouncementAuthor {
  id: string;
  display_name: string;
  profile_image_url?: string | null;
  role?: string;
  contributor_tier?: number;
}

export interface Announcement {
  id: string;
  author: string;
  author_details?: AnnouncementAuthor | null;
  title: string;
  body: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  is_active?: boolean;
  expires_at?: string | null;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  is_active?: boolean;
  expires_at?: string | null;
}

function getAuthTokenWithDevFallback(token: string | null): string | null {
  if (process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true" && typeof window !== "undefined") {
    const devToken = localStorage.getItem("dev_token");
    if (devToken) return devToken;
  }
  return token;
}

function isClientAuthenticated(isSignedIn: boolean | undefined): boolean {
  if (isSignedIn) return true;
  if (process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === "true" && typeof window !== "undefined") {
    return Boolean(localStorage.getItem("dev_token"));
  }
  return false;
}

export function useAnnouncements(options?: { all?: boolean; active_only?: boolean }) {
  const { getToken, isSignedIn } = useAuth();
  const queryParam = options?.all ? "?all=true" : options?.active_only ? "?active_only=true" : "";

  return useQuery<Announcement[]>({
    queryKey: ["announcements", options?.all ? "all" : options?.active_only ? "active" : "default"],
    queryFn: async () => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      const res = await apiFetch<any>(`/announcements/${queryParam}`, token);
      const items = Array.isArray(res) ? res : (res?.data || res?.results || []);
      return items;
    },
    enabled: isClientAuthenticated(isSignedIn),
    staleTime: 60 * 1000,
  });
}

export function useCreateAnnouncement() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Announcement>("/announcements/", token, {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      toast.success("Announcement published successfully");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create announcement";
      toast.error(msg);
    },
  });
}

export function useUpdateAnnouncement() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAnnouncementInput }) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Announcement>(`/announcements/${id}/`, token, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Announcement updated successfully");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update announcement";
      toast.error(msg);
    },
  });
}

export function useDeleteAnnouncement() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = getAuthTokenWithDevFallback(await getToken());
      if (!token) throw new Error("Unauthorized");
      return apiFetch(`/announcements/${id}/`, token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete announcement";
      toast.error(msg);
    },
  });
}
