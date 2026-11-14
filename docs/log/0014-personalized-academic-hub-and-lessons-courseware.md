# 0014: Personalized Academic Hub, Subject Shelves & Editorial Lessons Courseware

- **Date:** 2026-11-13
- **Status:** Implemented & Verified
- **Scope:** Root Academic Hub (`/`), Lessons catalog dual-mode subject shelves (`/lessons`, `/lessons/manage`), Editorial Courseware `LessonCard` & skeleton parity, and distraction-free lesson read mode (`/lessons/[id]`)
- **Target Files:**
  - `src/app/page.tsx`
  - `src/components/features/home/academic-hub.tsx`
  - `src/components/features/content-cards.tsx`
  - `src/components/features/skeletons.tsx`
  - `src/components/features/lessons-feed.tsx`
  - `src/components/features/lessons/lesson-detail-client.tsx`
  - `src/app/(app)/lessons/loading.tsx`
  - `src/app/(app)/lessons/manage/loading.tsx`

---

## Summary of Changes

Replaced the root `/forum` redirect with a Personalized Academic Hub workspace, reorganized `/lessons` into categorized subject shelves paired with redesigned Editorial Courseware cards, and streamlined `/lessons/[id]` into a focused reading experience.

### 1. Personalized Academic Hub (`src/app/page.tsx` & `src/components/features/home/academic-hub.tsx`)

- **`src/app/page.tsx`:** Updated the root route to verify authentication via `getServerAuthToken()` (preserving dev-login cookies) with Clerk `currentUser()` fallback, rendering `<AppLayout><AcademicHub /></AppLayout>` for signed-in users and redirecting unauthenticated visitors to `/sign-in`.
- **`academic-hub.tsx`:** Created a responsive bento hub workspace containing:
  - Editorial welcome banner with inline `<ContributorBadge />`, points, vote weight, and dossier link.
  - Quick-launch actions respecting `isWriteLocked`.
  - Open `Solve!` bounties panel with `<SevenSlotMeter />` capacity indicators (`x/7`).
  - Fresh Lessons preview grid powered by `<LessonCard />`.
  - Resume `Train!` card hydrated client-side from `e2e_last_train_paper` in `localStorage`.
  - Library capacity meters (`useStudyPlans` / `useSavedSessions`, `x/3`) and top 2 Official Announcements (`useAnnouncements`).
  - Integrated `<ColdStartNotice />` and skeleton loading states, using Base UI `<Button nativeButton={false} render={<Link ... />} />` conventions.

### 2. Editorial Courseware `LessonCard` & Skeletons (`content-cards.tsx` & `skeletons.tsx`)

- **`LessonCard` (`src/components/features/content-cards.tsx`):** Rebuilt into a uniform-height (`flex h-full flex-col justify-between`) editorial courseware layout with top syllabus context (`Level · Subject`), publication state badge, `<CardMoreMenu />`, `font-display` title with 2-line sanitized excerpt (`stripHtml`), `Video Lecture` and attachment resource pills, capped `<TagBadge />` chips (max 3), and footer with author, `<ContributorBadge />`, `<LessonCardVote />`, and `<SaveButton />` (`PostCard` preserved untouched).
- **`LessonCardSkeleton` (`src/components/features/skeletons.tsx`):** Aligned card skeleton geometry and metadata rows with the redesigned `LessonCard` to prevent layout shift (`CLS < 0.1`).

### 3. Categorized Subject Shelves & Loading Skeletons (`lessons-feed.tsx`, `loading.tsx`, `manage/loading.tsx`)

- **`LessonsFeed` (`src/components/features/lessons-feed.tsx`):** Implemented dual-mode lesson discovery while preserving URL filter synchronization and `hideSort` coordination with `HorizontalFilterBar`:
  - **Shelf Discovery Mode** (no active subject, tag, or `onlyMine` filter): Adds a Level pill switcher (`All Levels` + `useLevels()`), groups lessons by `subject_details.id || subject || "__general__"`, and renders per-subject shelf sections with optional subject code, count badge, `"View all in [Subject]"` action, 3-card preview grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`), and `"Load more lessons & shelves"` pagination.
  - **Drill-Down / Manage Mode** (subject, tag, or `onlyMine` active): Shows `"← Back to All Subject Shelves"` (when `!onlyMine`), `/lessons/manage` state tabs (`Published` / `Drafts` / `Archived`) with preserved `DRAFT` / `ARCHIVED` prefetching, full responsive card grid, and pagination.
- **Route Loading States (`src/app/(app)/lessons/loading.tsx` & `manage/loading.tsx`):** Replaced legacy left-sidebar placeholders with horizontal filter skeletons above a 3-column shelf/card grid.

### 4. Distraction-Free Read Mode (`src/components/features/lessons/lesson-detail-client.tsx`)

- Refactored `LessonDetailClient` into a centered `max-w-3xl mx-auto` reading column featuring catalog/subject breadcrumbs, `<LessonDetailActions />`, `font-display` heading with syllabus and state badges, author strip paired with top `<SaveButton defaultTab="plan" />`, `<LessonMediaViewer />`, `<MathRenderer />` prose (`max-w-[70ch]`), downloadable attachments list, and footer actions (vote, bookmark, share, report) honoring `isContentAuthor` and `isWriteLocked`.

---

## Verification

1. **Impeccable Design Detector (`impeccable detect --json` across modified home and lesson components):** Exited `0` with zero findings in modified Academic Hub and Lessons files (1 pre-existing `10px` advisory remains on `PostCard` line 125 in `content-cards.tsx`).
2. **TypeScript (`npx tsc --noEmit`):** Exited `0` with no errors.
3. **Production Build (`npm run build`):** Exited `0`; compiled cleanly (`7.3s` compile, `3.1s` TypeScript check) and generated all `35/35` static routes.

