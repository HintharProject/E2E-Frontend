# 0016: Solve!, Forum, Collections, Profiles, Search & Admin Modernization

- **Date:** 2026-11-14
- **Status:** Implemented & Verified
- **Scope:** Academic Challenge Tickets and inline consensus pool on `/problems`, Forum Right Rail and TTL cards on `/forum`, 3-slot collection capacity strip on `/study-plans` and `/saved-sessions`, semantic profile/ledger controls, `max-w-3xl` authoring studios, `<Select />` filters in `/search`, Admin accessibility landmark & token-driven charts, and `DESIGN.md` / `docs/design_system/*` synchronization
- **Target Files:**
  - `src/components/features/problems/*`, `src/app/(app)/problems/page.tsx`, `src/app/(app)/problems/[id]/page.tsx`, `src/app/(app)/problems/[id]/solutions/[solutionId]/page.tsx`, `src/app/(app)/problems/[id]/solutions/[solutionId]/edit/page.tsx`, `src/app/(app)/problems/[id]/edit/page.tsx`, `src/app/(app)/problems/new/page.tsx`
  - `src/components/features/forum/forum-right-rail.tsx`, `src/components/features/forum/forum-sub-nav.tsx`, `src/app/(app)/forum/page.tsx`, `src/app/(app)/forum/creators/page.tsx`, `src/components/features/content-cards.tsx`, `src/components/features/posts/*`, `src/components/features/comments/threaded-comment.tsx`, `src/app/(app)/posts/new/page.tsx`
  - `src/components/features/collections/collection-capacity-strip.tsx`, `src/app/(app)/study-plans/*`, `src/app/(app)/saved-sessions/*`
  - `src/components/features/users/*`, `src/components/features/contributions/*`, `src/app/(app)/lessons/new/page.tsx`, `src/app/(app)/settings/*`
  - `src/app/(app)/search/page.tsx`, `src/components/features/search/command-palette.tsx`, `src/components/features/tags/tag-detail-client.tsx`
  - `src/app/(app)/admin/layout.tsx`, `src/app/(app)/admin/page.tsx`, `src/components/features/admin/admin-kpi-strip.tsx`, `src/components/features/admin/admin-content-explorer.tsx`, `src/components/features/admin/admin-response-depth-chart.tsx`
  - `DESIGN.md`, `docs/design_system/00_DESIGN_TOKENS.md`, `docs/design_system/01_COMPONENT_CATALOG.md`, `docs/design_system/02_LAYOUT_AND_NAVIGATION.md`, `docs/design_system/03_SCREEN_FLOWS_AND_PATTERNS.md`

---

## Summary of Changes

Brought the **Warm Editorial Academic** token system, semantic controls, and Operate vs. Read spatial hierarchy to all community feeds, detail threads, personal collections, user dossiers, authoring flows, global search, and staff analytics.

### 1. `Solve!` Academic Challenge Tickets & Consensus Workspace

- **`ProblemsRightRail` & `/problems` (`src/components/features/problems/problems-right-rail.tsx`, `src/app/(app)/problems/page.tsx`):** Added an `xl:w-72` contextual rail pairing Path A / Path B challenge guidance and consensus rules (7-slot cap, Tier 2+ eviction, `+10 pt`, `48h FINAL` lock) alongside a responsive mobile trigger inside `HorizontalFilterBar`.
- **`ProblemCard` & `ProblemCardVote`:** Converted problem cards from generic feed containers into purpose-built challenge tickets with a `sm:w-20` vertical upvote and `X/7` slot rail, Path B Past Paper banner (`Open in Train!`), max 3 tags, and `font-mono tabular-nums` counters.
- **Inline Pool Action & Detail Polish (`solution-pool-container.tsx`, `solution-fab.tsx`, `solution-item.tsx`, `problems/[id]/page.tsx`, `solutions/[solutionId]/page.tsx`):** Replaced the floating corner trigger with an inline `Submit Solution` action inside the pool header, replaced `require()` and raw indigo/amber utilities with semantic `warning` / `--chart-3` tokens and top-level ES imports, and rendered `<MathRenderer />` + Lucide badges for accepted and endorsed solutions.

### 2. Forum Rail, Post Differentiation & Threaded Discussions

- **`ForumRightRail` (`src/components/features/forum/forum-right-rail.tsx`, `forum/page.tsx`, `forum/creators/page.tsx`):** Added quick authoring shortcuts, the latest 3 active notices from `useAnnouncements`, and `Question` / `Sharing` format legend; cleaned unused sidebar props in `forum-sub-nav.tsx`.
- **Format Badges & Threads (`content-cards.tsx`, `posts/*`, `threaded-comment.tsx`):** Styled distinct `QUESTION`, `SHARING`, and `ANNOUNCEMENT` pills on `PostCard`, clamped tags to 3, added attachment chips and `30-day TTL` expiration indicators, upgraded `ChevronUp` vote rails, and refined nested comment border guides and touch targets.

### 3. Collections, Profiles, Creation Studios, Search & Tag Hubs

- **`CollectionCapacityStrip` (`src/components/features/collections/collection-capacity-strip.tsx`):** Added a 3-slot binder meter (`X / 3 slots used`) with empty-collection creation guard notices across `/study-plans` and `/saved-sessions`, eliminated nested cards and floating corner delete overlays in `/saved-sessions/[id]`, and standardized `/new` forms on `max-w-3xl` editorial cards.
- **Profiles & Ledger (`users/*`, `contributions/*`):** Replaced emoji ban badges (`AlertTriangle`, `Ban`, `ShieldBan`), removed decorative gradients in `TierProgressBar`, swapped raw `<select>` controls for the `<Select />` primitive in `ContributionLedgerTable`, and normalized semantic tokens across settings and authoring forms (fixing `returnUrl: "/posts/new"` in `create-post-form.tsx`).
- **Search & Tags (`search/page.tsx`, `command-palette.tsx`, `tag-detail-client.tsx`):** Migrated search filters onto `<Select />` and flattened nested tag hub item wrappers.

### 4. Admin Accessibility & Design Documentation Sync

- **Admin Studio (`admin/layout.tsx`, `admin/page.tsx`, `admin-kpi-strip.tsx`, `admin-content-explorer.tsx`, `admin-response-depth-chart.tsx`):** Replaced the inner `<main>` inside `AdminLayout` with a `<div>` to eliminate nested landmark violations, switched KPI metrics to `font-mono tabular-nums`, and replaced hardcoded Recharts hex palettes with CSS custom properties (`var(--chart-1..5)`, `var(--primary)`, `var(--warning)`, `var(--destructive)`).
- **Living Documentation Sync:** Updated `DESIGN.md` and `docs/design_system/00_DESIGN_TOKENS.md`–`03_SCREEN_FLOWS_AND_PATTERNS.md` to document the Warm Editorial Academic palette, typography pipeline, dual-shell navigation, and screen blueprints.

---

## Verification

1. **Impeccable Design Detector (`impeccable detect --json` across all modified directories and files):** Exited `0` with zero findings (`[]`).
2. **TypeScript (`npx tsc --noEmit`):** Exited `0` with zero errors.
3. **Production Build (`npm run build`):** Exited `0`; compiled cleanly and generated all `35/35` static pages across App Router routes.
4. **Targeted ESLint (`npx eslint` across newly added and refactored pure UI modules):** Exited `0` (`0` errors, `4` pre-existing unused-var warnings).
