"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Solution } from "@/types";
import { formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDeleteSolution } from "@/hooks/use-problems";
import { CardMoreMenu } from "@/components/ui/card-more-menu";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

export function SolutionItem({ solution, isProblemAuthor = false }: { solution: Solution; isProblemAuthor?: boolean }) {
  const { user } = useCurrentUser();
  const deleteMutation = useDeleteSolution();

  const author = solution.author_details;
  const localVoteCount = solution.vote_count ?? 0;
  const isAuthor = user?.id === author?.id;
  const isAdmin = user?.role === "ADMIN";
  const canModify = isAuthor || isAdmin;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/problems/${solution.problem}/solutions/${solution.id}`
    : `/problems/${solution.problem}/solutions/${solution.id}`;

  const handleDelete = async () => {
    toast.promise(deleteMutation.mutateAsync(solution.id), {
      loading: "Deleting solution...",
      success: "Solution deleted successfully",
      error: "Failed to delete solution. Please try again.",
    });
  };

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-card p-4 transition-colors hover:border-brand/40">
      <Link
        href={`/problems/${solution.problem}/solutions/${solution.id}`}
        className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center min-w-[40px] gap-1 text-ink-muted">
            <span className="text-sm font-semibold text-ink">{localVoteCount}</span>
            <span className="text-[10px] uppercase tracking-wider">Votes</span>
          </div>
          
          <div className="h-10 w-px bg-line hidden sm:block"></div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {author?.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                <AvatarFallback>{getInitials(author?.display_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-ink">{author?.display_name}</span>
              <span className="text-xs text-ink-muted">· {formatDate(solution.created_at)}</span>
              {solution.status === "WORKED" && (
                <Badge variant="default" className="ml-2 h-5 text-[10px]">Accepted</Badge>
              )}
            </div>
            <p className="line-clamp-1 text-sm text-ink-muted">
              {stripHtml(solution.body)}
            </p>
          </div>
        </div>
        <div className="flex items-center text-brand font-medium text-sm gap-1 group-hover:underline self-end sm:self-center shrink-0 sm:ml-auto">
          View full solution <ChevronRight className="w-4 h-4" />
        </div>
      </Link>

      {/* Three-dot more menu */}
      <div className="absolute right-3 top-3">
        <CardMoreMenu
          shareUrl={shareUrl}
          contentType="SOLUTION"
          contentId={solution.id}
          editHref={canModify ? `/problems/${solution.problem}/solutions/${solution.id}/edit` : undefined}
          onDelete={canModify ? handleDelete : undefined}
          deleteLabel="this solution"
        />
      </div>
    </div>
  );
}
