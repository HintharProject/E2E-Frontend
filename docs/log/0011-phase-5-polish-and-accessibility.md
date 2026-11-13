# 0011: Phase 5 — Polish & Accessibility Quality Pass

- **Status:** Completed
- **Phase:** Phase 5 (Final Polish, Accessibility, Touch Ergonomics, CLS, Cold-Start UX, Micro-Interactions)
- **Specs:**
  - `Planning/design system new/README.md`
  - `Planning/design system new/05_PHASE_5_POLISH_AND_ACCESSIBILITY.md`
  - `E2E-frontend/DESIGN.md`
  - `E2E-frontend/.agents/UI_UX_GUIDELINES.md`

---

## Summary of Changes

Executed the full Phase 5 quality, accessibility (WCAG 2.2 AA), mobile touch target, CLS elimination, Render cold-start UX masking, and reduced-motion polish pass across tokens, layout shells, navigation chrome, feed cards, skeletons, and interactive controls.

### 1. WCAG 2.2 AA Contrast & Semantic Token Calibration (`src/app/globals.css`, `DESIGN.md`, `docs/design_system/00_DESIGN_TOKENS.md`)

Audited every foreground/background/tier token pair against WCAG 2.2 AA ($\ge 4.5:1$ normal text) using linearized sRGB luminance from OKLCH values:

- **Light Mode:**
  - `--warning`: calibrated from `oklch(0.72 0.16 70)` ($2.56:1$) to `oklch(0.51 0.15 62)` (`#a04c00`, **$5.97:1$** on `--card`).
  - `--tier-0` through `--tier-4`: calibrated on their respective `--tier-*-bg` surfaces:
    - `--tier-0`: `oklch(0.49 0.015 220)` (**$5.55:1$**)
    - `--tier-1`: `oklch(0.52 0.15 60)` (**$5.01:1$**)
    - `--tier-2`: `oklch(0.50 0.14 230)` (**$4.81:1$**)
    - `--tier-3`: `oklch(0.49 0.16 150)` (**$4.98:1$**)
    - `--tier-4`: `oklch(0.48 0.22 300)` (**$6.23:1$**)
- **Dark Mode:**
  - `--primary`: calibrated from `oklch(0.58 0.125 165)` ($4.51:1$ on `--card`) to `oklch(0.64 0.13 165)` (`#17a478`, **$5.72:1$** on `--card`, while `--primary-foreground` on `--primary` achieves **$6.42:1$**).
  - `--tier-0` through `--tier-4`: confirmed **$5.24:1$ – $6.80:1$** across dark surfaces.
- **Scholar Tier 4 Shimmer Gradient:**
  - Added semantic CSS variables `--tier-4-shimmer-base: oklch(0.48 0.22 300)` (**$7.37:1$** with white text) and `--tier-4-shimmer-peak: oklch(0.55 0.23 315)` (**$5.51:1$** with white text) so `.animate-scholar-shimmer` (`text-white`) meets AA across every gradient frame in both themes without altering Dark `--tier-4` (`oklch(0.70 0.22 300)` used by SVG/icon badge strokes in `src/types/contribution.ts`).
- **Chart Series & UI Tokens (`src/components/features/admin/admin-content-explorer.tsx`):**
  - Replaced hardcoded hex series colors (`#0d9488`, `#0284c7`, `#f59e0b`) with semantic CSS variables (`var(--primary)`, `var(--chart-2)`, `var(--warning)`), aligned tooltip border radius to `0.75rem`, and migrated chart/tooltip variables from legacy `--line`/`--ink`/`text-ink-muted` to `--border`/`--foreground`/`text-muted-foreground`.
- Synchronized documentation in `DESIGN.md` and `docs/design_system/00_DESIGN_TOKENS.md`.

### 2. Focus Visibility, Skip Links & `aria-label` Completeness

- **`src/app/(app)/layout.tsx`:** Added WCAG bypass **Skip to main content** link (`sr-only focus:not-sr-only` with `focus-visible:ring-2`) targeting `#main-content` (`tabIndex={-1}`), and applied `overflow-x-clip` on `<main>`.
- **`src/app/globals.css`:** Added global `:focus-visible` `2px solid var(--primary)` outline fallback (`outline-offset: 2px`) inside `@layer base`.
- **Navigation, Menus & Controls:** Added explicit `aria-label`, `aria-current="page"`, `aria-pressed`, `aria-selected`, and `focus-visible:ring-2 focus-visible:ring-primary` rings across:
  - `src/components/layout/app-header.tsx`
  - `src/components/ui/sub-nav.tsx`
  - `src/components/ui/theme-toggle.tsx`
  - `src/components/layout/mobile-filter-toggle.tsx`
  - `src/components/ui/card-more-menu.tsx`
  - `src/components/features/contributions/contributor-badge.tsx`
  - `src/components/features/contributions/vote-widget.tsx`
  - `src/components/features/collections/save-button.tsx` (also fixed `font-display` to `font-heading` and added `role="tablist"`/`role="tab"`)
  - `src/components/features/train/timer-widget.tsx` (replaced literal `✕` glyph with Lucide `<X />` + `aria-label="Dismiss timer alert"`)
  - `src/components/features/train/train-top-bar.tsx` (Close Left/Right panel buttons)
  - `src/components/features/train/curriculum-tree-sidebar.tsx` (mobile close button and `[ L ]` / `[ R ]` pane toggles)
  - `src/components/features/train/dual-pdf-viewer.tsx` (Fullscreen and Close Pane buttons)
  - `src/components/features/resources/past-papers-folder-view.tsx` (replaced `focus:outline-none` with `focus-visible:ring-2`)
  - `src/components/features/lessons/lesson-media-viewer.tsx` (added `aria-label="Open media preview"` and `focus-visible:ring-2`)
  - `src/app/(app)/admin/layout.tsx` (added `aria-label` and `focus-visible:ring-2` on sidebar collapse toggle)
  - `src/components/ui/content-sort-toggle.tsx`
  - `src/app/(app)/search/page.tsx` and `src/components/features/search/command-palette.tsx` (input `aria-label`s and clear button `aria-label`s)
  - `src/components/features/users/profile-activity-tabs.tsx` (`aria-label="Profile activity sections"`, `aria-current`)

### 3. Mobile Touch Ergonomics (`>= 44x44px` on `< 768px`) & Overflow Safety

- **`src/app/globals.css`:** Applied `overflow-x: clip;` on `html, body` (preserving `position: sticky` on header and desktop filter sidebars while preventing horizontal scrollbars) and `touch-action: manipulation;` across interactive elements.
- **`src/components/ui/button.tsx`:** Updated `icon` size from `sm:min-h-[40px]` to `min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px]` so `< 768px` mobile viewports always meet the 44x44px minimum target.
- **`min-h-[44px] md:min-h-0` / `size-11 md:size-*` mobile hit targets** applied to:
  - Header controls (`app-header.tsx`, `theme-toggle.tsx`, `mobile-filter-toggle.tsx`)
  - `SubNav` tabs/pills (`sub-nav.tsx`) and `ProfileActivityTabs` (`profile-activity-tabs.tsx`)
  - `ContentSortToggle` sort/timeframe buttons (`content-sort-toggle.tsx`)
  - `VoteWidget` stack/pill buttons (`vote-widget.tsx`), `CardMoreMenu` trigger (`card-more-menu.tsx`)
  - `SaveButton` modal tab buttons (`save-button.tsx`)
  - Train workspace mobile buttons (`curriculum-tree-sidebar.tsx`, `train-top-bar.tsx`, `dual-pdf-viewer.tsx`, `timer-widget.tsx`)
  - Pagination / "Load more" triggers in `forum-feed.tsx`, `lessons-feed.tsx`, `problems/page.tsx`, `solution-pool-container.tsx`, `profile-activity-tabs.tsx`, `solution-comments.tsx`, `threaded-comment.tsx`, and Prev/Next in `contribution-ledger-table.tsx`.

### 4. CLS Elimination & Dimension-Matched Skeletons

- **`src/components/features/skeletons.tsx`:**
  - Updated `PostCardSkeleton` and `LessonCardSkeleton` to render inside `<Card>` (`border-border shadow-card`) with exact `size-6` avatar and `CardFooter` geometry (`VoteWidget` + `SaveButton`).
  - Added `ProblemCardSkeleton` matching `BaseFeedCard` header, badge row, title, tags, and footer controls (`VoteWidget` + solution count badge + `SaveButton`).
  - Cleaned `ProfileSkeleton` (`rounded-xl border-border shadow-card`, removed redundant outer `max-w-5xl` wrapper).
- **`src/app/(app)/problems/page.tsx` & `src/components/features/users/profile-activity-tabs.tsx`:** Replaced generic `h-40` placeholder boxes / post skeletons in Solve! loading views with `<ProblemCardSkeleton />`.

### 5. Render Free-Tier Cold-Start UX Masking (`> 3s` Notice)

- **Created `src/components/layout/cold-start-notice.tsx`:** Reusable `<ColdStartNotice delayMs={3000} />` client component that waits `3000ms` before revealing an accessible (`role="status"`, `aria-live="polite"`) cold-start notice (*"Waking up the server (this may take up to 30 seconds on cold start)..."*) paired with a smooth GPU-composited `.animate-cold-start-bar` progress indicator (`role="progressbar"`).
- **Integrated into:**
  - `src/components/layout/initial-loading-screen.tsx`
  - `src/components/layout/page-skeleton.tsx` (now pairs `<ColdStartNotice />` with three `<PostCardSkeleton />` items)
  - `src/components/features/forum-feed.tsx`
  - `src/components/features/lessons-feed.tsx`
  - `src/app/(app)/problems/page.tsx`

### 6. Micro-Interactions & `prefers-reduced-motion` Support

- **`src/components/features/train/timer-widget.tsx`:** Removed `animate-bounce` on expired warning icon (`AlertTriangle`), replacing it with subtle `animate-pulse` using `text-destructive`.
- **`src/app/globals.css`:** Preserved GPU-composited `@keyframes vote-multiplier`, `@keyframes scholar-shimmer`, and `@keyframes cold-start-bar` animations alongside `@media (prefers-reduced-motion: reduce)` guards disabling animations and infinite transitions for reduced-motion users.

---

## Verification

1. **Impeccable Design Detector (`impeccable.cmd detect --json src`):**
   - `0` non-font antipatterns (`Non-font: []` — cleared all 4 baseline findings: `#0d9488`, `#f59e0b`, `0.85rem` radius, and `animate-bounce`).
   - Remaining findings: `379` `design-system-font-size` advisories (pre-existing `text-[10px]` / `text-[11px]` micro-labels across untouched components; down from `384` at baseline).
2. **TypeScript Type Check (`npx tsc --noEmit`):** Exited `0` after the final edit with no errors.
3. **Production Build (`npm run build` / `next build --webpack`):** Exited `0` after the final edit (compiled in `15.2s`, TypeScript check finished in `7.0s`, generated `35/35` static pages + dynamic routes in `2.4s`; only lockfile-root info warning about `C:\Users\User\package-lock.json`).
4. **Targeted ESLint Check:** `npx eslint src/components/layout/cold-start-notice.tsx src/components/layout/initial-loading-screen.tsx` exited `0` with zero errors/warnings after the final edit (repo-wide `npm run lint` carries 366 pre-existing errors/warnings in untouched files, mostly `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars`).
4. **WCAG 2.2 AA Contrast Audit (Node OKLCH-to-sRGB Luminance Script):**
   - Light mode: `fg/bg 18.25:1`, `fg/card 18.77:1`, `muted-fg/card 5.97:1`, `primary/card 5.37:1`, `warning/card 5.97:1`, `tier-0..4` on `tier-*-bg` (`5.55:1`, `5.01:1`, `4.81:1`, `4.98:1`, `6.23:1`), `white` on shimmer base/peak (`7.37:1` / `5.51:1`).
   - Dark mode: `fg/bg 18.10:1`, `fg/card 16.60:1`, `muted-fg/card 6.30:1`, `primary/card 5.72:1`, `warning/card 7.88:1`, `tier-0..4` on `tier-*-bg` (`6.17:1`, `6.80:1`, `6.64:1`, `6.52:1`, `5.24:1`), `white` on shimmer base/peak (`7.37:1` / `5.51:1`).

