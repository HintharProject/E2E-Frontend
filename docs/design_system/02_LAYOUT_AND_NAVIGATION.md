# Layout & Navigation Architecture

> **Scope:** Dual-Shell Layout, Collapsible Sidebar, Top Context Bar, Horizontal Filter Strip, Right Contextual Rails & Fullscreen Practice Workspace  
> **Reference Files:** `src/app/(app)/layout.tsx`, `src/app/(workspace)/layout.tsx`, `src/components/layout/*`

---

## 1. Dual-Shell Boundary

Hinthar Education E2E separates everyday navigation from distraction-free exam practice through two sibling Next.js route groups:

1. **Standard Application Shell (`src/app/(app)/layout.tsx`):**
   - Renders desktop `<AppSidebar />`, sticky `<AppTopBar />`, `<main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 md:pb-8 sm:px-6 lg:px-8">`, footer, and `<MobileBottomNav />`.
   - Protects all views inside `<RoleGuard>` and initializes React Query/Zustand state with `<AppInitializer />`.
   - Applies `<AdminLayout>` inside `/admin/*` using an inner container `<div>` (avoiding nested `<main>` landmarks).
2. **Fullscreen Practice Workspace (`src/app/(workspace)/layout.tsx`):**
   - Hosts `/train/[resourceId]` cleanly without `AppSidebar`, `AppTopBar`, or `MobileBottomNav`.
   - Provides a focused `TrainTopBar`, countdown/stopwatch `TimerWidget`, sibling Mark Scheme pairing, `CurriculumTreeSidebar`, and `AskInSolveModal`.

---

## 2. Operate vs. Read Width Discipline

- **Operate Mode (`max-w-7xl`):** Used across `/` (Academic Hub Bento), `/lessons` (Syllabus Shelves), `/resources` (Unified Past Papers & Textbooks), `/problems`, `/forum`, `/study-plans`, `/saved-sessions`, `/search`, `/users/[id]`, and `/admin/*`.
- **Read & Authoring Mode (`max-w-3xl`):** Applied cleanly within `(app)/layout.tsx` containers on `/lessons/[id]`, `/problems/[id]`, `/problems/[id]/solutions/[solutionId]`, `/posts/[id]`, `/posts/new`, `/problems/new`, `/lessons/new`, `/study-plans/new`, `/saved-sessions/new`, and `/settings/*`.

---

## 3. Navigation Topology

### 3.1 Desktop Left Sidebar (`src/components/layout/app-sidebar.tsx`)
- Collapsible (`w-60` expanded / `w-16` icon-only, persisted in `useUIStore`).
- Grouped cleanly into **Workspace** (`Home`, `Solve!`, `Lessons`, `Forum`, `Exams & Resources`), **My Library** (`Study Plans`, `Saved Sessions`), and **Staff Studio** (`Moderation`, `Admin Studio` gated by role).
- Sidebar Footer consolidates profile link (`/users/[id]`), contributor standing, Settings, Theme toggle, and Clerk `<UserButton />` in one location.

### 3.2 Slim Top Context Bar (`src/components/layout/app-top-bar.tsx`)
- Sticky `h-14` top strip displaying mobile drawer toggle (`md:hidden`), route context heading, prominent `⌘K` Command Palette search trigger, manual cold-start refresh button, and contextual primary `+ Ask Problem` / `+ Write Lesson` / `+ New Post` / `+ Create` action.
- Sanction alerts (`writeLocked` or `WARNING`) render visibly immediately above the bar.

### 3.3 Mobile Bottom Tab Bar (`src/components/layout/mobile-bottom-nav.tsx`)
- Fixed `md:hidden` 5-tab bar (`Home`, `Solve!`, `Lessons`, `Resources`, `Forum`) with `>= 44px` ergonomic tap height and safe-area bottom inset padding.

### 3.4 Sticky Horizontal Filter Bar (`src/components/layout/horizontal-filter-bar.tsx`)
- Replaces the legacy 256px left checkbox column (`FilterSidebar`) across `/problems`, `/forum`, `/forum/announcements`, `/forum/creators`, `/lessons`, and `/resources`.
- Packs `Level`, `Subject`, optional `Type`, `Status`, `State`, `Tags`, removable active filter pills, and `sortSlot` / `rightActions` onto a single compact bar above the feed.

### 3.5 Right Contextual Rails (`xl:w-72 shrink-0`)
- On wide viewports (`xl`), **Solve!** (`ProblemsRightRail`) and **Forum** (`ForumRightRail`) attach a clean `xl:w-72` contextual sidebar without compressing the horizontal feed card layout; mobile/tablet fall back cleanly to inline `HorizontalFilterBar` `rightActions` CTAs.
