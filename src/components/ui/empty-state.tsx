export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/70 px-6 py-14 text-center dark:bg-card/50">
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        {description}
      </p>
    </div>
  );
}
