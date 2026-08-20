import Link from "next/link";
import {
  daysUntil,
  formatDate,
  getLevel,
  getSubject,
  getTagNames,
  getUser,
  type Lesson,
  type Post,
} from "@/lib/mock-data";
import { Avatar, Badge, Button } from "@/components/ui";

export function PostCard({ post }: { post: Post }) {
  const author = getUser(post.authorId);
  const subject = getSubject(post.subjectId);
  const level = getLevel(post.levelId);
  const tagNames = getTagNames(post.tagIds);
  const expiresIn = daysUntil(post.expiresAt);

  return (
    <article className="group rounded-2xl border border-line bg-white/90 p-5 transition hover:border-brand/35 hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {author ? (
            <Link href={`/users/${author.id}`}>
              <Avatar src={author.imageUrl} name={author.displayName} size="sm" />
            </Link>
          ) : null}
          <div>
            <Link
              href={`/users/${author?.id}`}
              className="text-sm font-semibold text-ink hover:text-brand-dark"
            >
              {author?.displayName}
            </Link>
            <p className="text-xs text-ink-muted">
              {formatDate(post.createdAt)} · expires in {expiresIn}d
            </p>
          </div>
        </div>
        <Badge
          tone={
            post.postType === "ANNOUNCEMENT"
              ? "brand"
              : post.postType === "QUESTION"
                ? "neutral"
                : "muted"
          }
        >
          {post.postType}
        </Badge>
      </div>
      <Link href={`/posts/${post.id}`} className="mt-3 block">
        <h2 className="font-display text-xl text-ink group-hover:text-brand-dark">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {post.body}
        </p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {subject ? <Badge tone="muted">{subject.name}</Badge> : null}
        {level ? <Badge tone="muted">{level.name}</Badge> : null}
        {tagNames.map((t) => (
          <Badge key={t}>#{t}</Badge>
        ))}
        {post.postType !== "ANNOUNCEMENT" ? (
          <span className="ml-auto text-xs font-semibold text-ink-muted">
            ▲ {post.voteScore} · {post.commentCount} comments
          </span>
        ) : (
          <span className="ml-auto text-xs font-semibold text-ink-muted">
            {post.commentCount} comments
          </span>
        )}
      </div>
    </article>
  );
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const author = getUser(lesson.authorId);
  const subject = getSubject(lesson.subjectId);
  const level = getLevel(lesson.levelId);
  const tagNames = getTagNames(lesson.tagIds);

  return (
    <article className="rounded-2xl border border-line bg-white/90 p-5 transition hover:border-brand/35 hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {lesson.followedAuthor ? (
            <Badge tone="brand">Following</Badge>
          ) : null}
          <Badge
            tone={
              lesson.state === "PUBLISHED"
                ? "brand"
                : lesson.state === "DRAFT"
                  ? "warn"
                  : "muted"
            }
          >
            {lesson.state}
          </Badge>
        </div>
        <span className="text-xs font-semibold text-ink-muted">
          ▲ {lesson.voteScore}
        </span>
      </div>
      <Link href={`/lessons/${lesson.id}`} className="mt-3 block">
        <h2 className="font-display text-xl text-ink hover:text-brand-dark">
          {lesson.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{lesson.body}</p>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/users/${author?.id}`}
          className="text-xs font-semibold text-ink hover:text-brand-dark"
        >
          {author?.displayName}
        </Link>
        {subject ? <Badge tone="muted">{subject.name}</Badge> : null}
        {level ? <Badge tone="muted">{level.name}</Badge> : null}
        {tagNames.map((t) => (
          <Badge key={t}>#{t}</Badge>
        ))}
      </div>
      {lesson.state !== "PUBLISHED" ? (
        <div className="mt-4">
          <Button href={`/lessons/${lesson.id}/edit`} variant="secondary">
            Edit
          </Button>
        </div>
      ) : null}
    </article>
  );
}
