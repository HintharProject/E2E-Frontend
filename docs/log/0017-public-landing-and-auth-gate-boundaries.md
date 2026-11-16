# 0017: Public Editorial Landing Page & Auth-Gate Boundaries

- **Date:** 2026-11-16
- **Status:** Implemented & Verified (Frontend Build/HTTP Verified; Browser Visual QA & Backend Deploy Pending)
- **Scope:** Public `/` Warm Archival Paper landing experience (`editorial-cover-sheet`), shared `next-themes` light-first default (`defaultTheme="light"` across landing and app shell), middleware/hook/UI access boundaries across `Solve!`, `Lessons`, `Exams & Resources` (`Train!`), and `Forum`, plus design/product specification sync.
- **Target Files:**
  - `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/components/features/landing/*`
  - `src/proxy.ts`, `src/app/providers.tsx`, `src/components/features/auth/auth-gate-modal.tsx`, `src/components/features/auth/gated-link.tsx`
  - `src/components/layout/app-sidebar.tsx`, `src/components/layout/app-top-bar.tsx`, `src/components/layout/mobile-nav.tsx`
  - `src/hooks/use-app-initialization.ts`, `src/hooks/use-comments.ts`, `src/hooks/use-lessons.ts`, `src/hooks/use-metadata.ts`, `src/hooks/use-posts.ts`, `src/hooks/use-problems.ts`
  - `src/components/ui/base-card.tsx`, `src/components/ui/card-more-menu.tsx`, `src/components/features/collections/save-button.tsx`, `src/components/features/contributions/vote-widget.tsx`, `src/components/features/content-cards.tsx`
  - `src/components/features/problems/*`, `src/components/features/posts/*`, `src/components/features/comments/*`, `src/components/features/lessons/lesson-card-vote.tsx`, `src/components/features/forum-feed.tsx`, `src/components/features/lessons-feed.tsx`
  - `src/app/(app)/problems/page.tsx`, `src/app/(app)/problems/[id]/page.tsx`, `src/app/(app)/forum/page.tsx`, `src/app/(app)/resources/page.tsx`, `src/app/(workspace)/train/[resourceId]/page.tsx`
  - `DESIGN.md`, `PRODUCT.md`, `.gitignore`

---

## Summary of Changes

### 1. Public Editorial Cover Sheet Landing Page (`/`)
- **Auth-Split Root Route (`src/app/page.tsx`):** Server-side check renders `<AppLayout><AcademicHub /></AppLayout>` for signed-in users and fetches bounded public snapshots (`/problems/`, `/lessons/`, `/resources/files/`, `/subjects/` with a 2.5s `AbortSignal.timeout`) into `<LandingPage />` for unauthenticated visitors.
- **Unified Light-First Theme & Overscroll Fix (`src/app/layout.tsx`, `src/app/globals.css`, `src/components/features/landing/*`):** Set `defaultTheme="light"` globally in `ThemeProvider` and applied `bg-background text-foreground` onto `html, body` so Warm Archival Paper is the shared opening theme across `/` and the WebApp, `ThemeToggle` switches persist seamlessly between landing and app routes, and top/bottom overscroll shows zero mismatched blankspace. Modularized the landing page into `landing-header.tsx`, `landing-tour.tsx`, `landing-preview.tsx`, `landing-features.tsx`, and `landing-page.tsx` with `Newsreader` display typography, WebApp-aligned vocabulary (`Search`, `Browse Resources`, `Exams & Resources`), a `Solve!` + `Lessons`-first feature switcher with concise mock previews, live `Solve! Problems` and `Lessons` snapshots, and a clean `Features` directory (`Solve!`, `Lessons`, `Exams & Resources`, `Discussions`).

### 2. Route Middleware & Guest Shell Controls
- **Clerk Route Matching (`src/proxy.ts`):** Opened `/`, `/problems(.*)`, `/resources(.*)`, `/train(.*)`, `/lessons`, `/forum(.*)`, `/posts(.*)`, and `/search(.*)` to public visitors while keeping authoring, edit, profile, personal collection, and `/lessons/(.+)` detail routes protected behind `auth.protect()`.
- **Guest Chrome & Auth Gate Modal (`auth-gate-modal.tsx`, `gated-link.tsx`, `app-sidebar.tsx`, `app-top-bar.tsx`, `mobile-nav.tsx`):** Added `<AuthGateProvider>` and `<GatedLink>` to intercept unauthenticated member actions with a direct `"Sign up free"` (`/sign-up?redirect_url=...`) and `"Log in"` (`/sign-in?redirect_url=...`) dialog, surfaced top-bar & sidebar auth CTAs, and gated `Study Plans` and `Saved Sessions`.

### 3. Feature-Level Public vs. Member Boundaries
- **`Solve!` (`/problems`, `/problems/[id]`):** Guests can browse problems and read problem prompts; peer consensus solutions in `solution-pool-container.tsx` are withheld (`useSolutions` disabled when signed out) behind a 7-slot locked summary card (`Sign up free` / `Log in`), and asking questions, voting, saving, reporting, and clicking author profiles prompt sign-in.
- **`Forum` (`/forum`, `/posts/[id]`):** Guests can browse threads and the top 3 top-level comments on post detail (`post-comments.tsx`), while remaining comments, nested replies (`threaded-comment.tsx`), new posts, commenting/replying, voting, saving, reporting, and author profiles require authentication. Added 401/403 guest fallback cards in `forum-feed.tsx` and `post-detail-view.tsx`.
- **`Lessons` (`/lessons`):** Guests can scan the catalog (`useInfiniteLessons` with optional token); clicking into lesson detail cards, author profiles, voting (`lesson-card-vote.tsx`), saving, or authoring prompts authentication, with a 401/403 fallback card in `lessons-feed.tsx`.
- **`Resources & Train!` (`/resources`, `/train/[resourceId]`):** Catalog browsing, PDF previews/downloads, and split-pane QP/MS timed practice are publicly available; `SaveButton`, `Ask in Solve!`, and paper walkthrough authoring (`SolveAPaperModal`) gate on authentication.

---

## Verification

1. **Production Build (`npm run build` / `next build --webpack`):** Exited `0`; TypeScript passed (`12.2s`) and generated all `35` App Router routes.
2. **Targeted ESLint & Design Detector:** `npx eslint` passed with `0` errors on `landing-page.tsx`, `page.tsx`, `auth-gate-modal.tsx`, `gated-link.tsx`, `proxy.ts`, `providers.tsx`, and `post-comments.tsx` (1 pre-existing `no-explicit-any` remains in `post-detail-view.tsx`). `impeccable detect --json` returned `0` errors across checked landing/auth files.
3. **Live HTTP & SSR Checks:** `next start -p 3000` returned HTTP `200` on `/`, `/problems`, `/resources`, `/lessons`, and `/forum`, and `307` auth redirects on `/problems/new`, `/posts/new`, `/lessons/new`, and `/lessons/demo-123`; `/` HTML verified `.landing-archival-light`, KaTeX markup, Myanmar text, and the public-vs-member directory.
