"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import { apiFetch } from "@/services/api-client";
import { Lesson } from "@/types";
import { LessonDetailActions } from "@/components/features/lessons/lesson-detail-actions";
import { PostAttachment } from "@/components/features/posts/post-attachment";
import { LessonMediaViewer } from "@/components/features/lessons/lesson-media-viewer";
import LessonDetailLoading from "@/app/(app)/lessons/[id]/loading";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useVoteLesson } from "@/hooks/use-interactions";

export function LessonDetailClient({ id }: { id: string }) {
  const { getToken } = useAuth();
  const voteMutation = useVoteLesson();

  const { data: lesson, isLoading, isError } = useQuery<Lesson>({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      return apiFetch<Lesson>(`/lessons/${id}/`, token);
    },
    staleTime: 5 * 60 * 1000,
  });

  const [localVoteCount, setLocalVoteCount] = useState(0);
  const [localUserVote, setLocalUserVote] = useState(0);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  useEffect(() => {
    if (lesson) {
      setLocalVoteCount(lesson.vote_count ?? 0);
      setLocalUserVote(lesson.user_vote ?? 0);
    }
  }, [lesson]);

  const handleVote = (value: 1 | -1 | 0) => {
    if (localUserVote === value || !lesson) return;
    const diff = value - localUserVote;
    setLocalUserVote(value);
    setLocalVoteCount((prev) => prev + diff);

    voteMutation.mutate({ lessonId: lesson.id, value }, {
      onError: () => {
        setLocalUserVote(localUserVote);
        setLocalVoteCount((prev) => prev - diff);
        toast.error("Failed to register vote.");
      }
    });
  };

  if (isLoading) return <LessonDetailLoading />;

  if (isError || !lesson) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-ink-muted">Could not load this lesson.</p>
      </div>
    );
  }

  const author = lesson.author_details;
  const subject = lesson.subject_details;
  const level = lesson.level_details;
  const tagNames = lesson.tags ?? [];

  const imageAttachments = lesson.attachments?.filter(att => {
    const ext = att.file_name.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  }) || [];
  
  const otherAttachments = lesson.attachments?.filter(att => {
    const ext = att.file_name.split('.').pop()?.toLowerCase() || '';
    return !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  }) || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={lesson.title}
        description={`Published ${formatDate(lesson.created_at)} · no comments on lessons`}
        actions={<LessonDetailActions lesson={lesson} />}
      />
      <article className="rounded-2xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`} className="flex items-center gap-2">
              <Avatar size="sm">
                 {author.profile_image_url && <AvatarImage src={author.profile_image_url} />}
                 <AvatarFallback>{getInitials(author.display_name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-ink">{author.display_name}</span>
            </Link>
          ) : null}
          <Badge variant="default">{lesson.state}</Badge>
          {subject ? <Badge variant="outline">{subject.name}</Badge> : null}
          {level ? <Badge variant="outline">{level.name}</Badge> : null}
          {tagNames.map((t) => (
            <Badge key={t} variant="outline">#{t}</Badge>
          ))}
        </div>
        
        <LessonMediaViewer imageAttachments={imageAttachments} youtubeUrl={lesson.embedded_video_url} />

        <div className="mt-6 whitespace-pre-wrap text-ink leading-relaxed">
          {lesson.body}
        </div>

        {otherAttachments.length > 0 ? (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">Attachments</h3>
            <div className="flex flex-col gap-3">
              {otherAttachments.map((file) => (
                <PostAttachment key={file.id} url={file.file_url} downloadUrl={file.download_url} filename={file.file_name} />
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button 
            variant={localUserVote === 1 ? "default" : "secondary"} 
            onClick={() => handleVote(localUserVote === 1 ? 0 : 1)}
          >
            ▲ Upvote ({localVoteCount})
          </Button>
          <Button 
            variant={localUserVote === -1 ? "default" : "ghost"} 
            onClick={() => handleVote(localUserVote === -1 ? 0 : -1)}
          >
            ▼ Downvote
          </Button>
          <Button variant="secondary">Add to Study Plan</Button>
          <Button variant="secondary">Save to session</Button>
          <Button variant="ghost" onClick={handleShare}>Share</Button>
          <Button variant="ghost">Report</Button>
        </div>
      </article>
    </div>
  );
}
