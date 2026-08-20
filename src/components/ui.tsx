import Link from "next/link";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "warn" | "danger" | "muted";
}) {
  const tones = {
    neutral: "bg-white text-ink border-line",
    brand: "bg-brand-soft text-brand-dark border-brand/30",
    warn: "bg-amber-50 text-warning border-amber-200",
    danger: "bg-red-50 text-danger border-red-200",
    muted: "bg-surface text-ink-muted border-line",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  href,
  variant = "primary",
  type = "button",
  className = "",
  disabled,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const variants = {
    primary:
      "bg-brand text-white hover:bg-brand-dark border-transparent shadow-sm",
    secondary:
      "bg-white text-ink border-line hover:border-brand/40 hover:text-brand-dark",
    ghost: "bg-transparent text-ink-muted border-transparent hover:text-ink",
    danger: "bg-danger text-white border-transparent hover:opacity-90",
  };
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50 ${variants[variant]} ${className}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/70 px-6 py-14 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        {description}
      </p>
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white/80 p-3">
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-[140px] flex-1 flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function SubNav({
  items,
}: {
  items: { href: string; label: string; active?: boolean }[];
}) {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line pb-px">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
            item.active
              ? "border-brand text-brand-dark"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function initials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16" };
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-lg" };
  const cls = `${sizes[size]} rounded-full border border-line bg-brand-soft object-cover`;
  const safeSrc = src?.trim();
  const safeName = name?.trim() || "User";

  if (!safeSrc) {
    return (
      <div
        className={`${cls} flex shrink-0 items-center justify-center font-semibold text-brand-dark ${textSizes[size]}`}
        aria-label={safeName}
        title={safeName}
      >
        {initials(safeName)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={safeSrc} alt={safeName} className={cls} />
  );
}
