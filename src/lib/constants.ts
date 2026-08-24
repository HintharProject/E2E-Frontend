import type { Role } from "@/types/user";

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

/** Default fetch timeout — generous to accommodate 30-50s Render cold starts. */
export const API_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export type NavItem = {
  href: string;
  label: string;
  /** Path prefix(es) used to determine the "active" state. */
  match: string | string[];
  /** Paths that should NOT trigger the active state even if they match. */
  exclude?: string[];
  /** If set, the link is only visible to these roles. */
  roles?: Role[];
};

/**
 * Primary navigation items rendered in the AppHeader.
 * Order matters — it defines the visual sequence of nav pills.
 *
 * Role-gated items:
 *  - "My Lessons" → CREATOR only
 *  - "Admin" → ADMIN only
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/forum", label: "Forum", match: "/forum" },
  {
    href: "/lessons",
    label: "Lessons",
    match: "/lessons",
    exclude: ["/lessons/mine", "/lessons/new"],
  },
  {
    href: "/lessons/mine",
    label: "My Lessons",
    roles: ["CREATOR", "ADMIN"],
    match: "/lessons/mine",
  },
  {
    href: "/study-plans",
    label: "Collections",
    roles: ["STUDENT"],
    match: ["/study-plans", "/saved-sessions"],
  },
  { href: "/admin", label: "Admin", roles: ["ADMIN"], match: "/admin" },
];

/**
 * Determines if a nav item should be highlighted as active.
 */
export function isNavActive(
  pathname: string,
  match: string | string[],
  exclude?: string[]
): boolean {
  if (exclude?.some((e) => pathname === e || pathname.startsWith(e + "/"))) {
    return false;
  }
  const matches = Array.isArray(match) ? match : [match];
  return matches.some((m) => pathname === m || pathname.startsWith(m + "/"));
}
