# 0013: Collapsible App Shell, Mobile Navigation & Horizontal Filter Bar

- **Date:** 2026-11-13
- **Status:** Implemented & Verified
- **Scope:** Desktop collapsible sidebar, slim contextual top bar, mobile bottom navigation bar, horizontal filter bar, and feed layout unification
- **Target Files:**
  - `src/lib/store/ui-store.ts`
  - `src/lib/constants.ts`
  - `src/components/layout/nav-config.ts`
  - `src/components/layout/app-sidebar.tsx`
  - `src/components/layout/app-top-bar.tsx`
  - `src/components/layout/app-header.tsx`
  - `src/components/layout/mobile-bottom-nav.tsx`
  - `src/components/layout/mobile-nav.tsx`
  - `src/app/(app)/layout.tsx`
  - `src/components/features/problems/solution-fab.tsx`
  - `src/app/(app)/admin/layout.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/ui/prefetching-sub-nav.tsx`
  - `src/components/layout/horizontal-filter-bar.tsx`
  - `src/components/layout/filter-sidebar.tsx`
  - `src/components/features/forum/forum-sub-nav.tsx`
  - `src/components/features/forum-feed.tsx`
  - `src/components/features/lessons/lessons-tabs.tsx`
  - `src/components/features/lessons-feed.tsx`
  - `src/components/features/lessons/manage-lessons-client.tsx`
  - `src/app/(app)/forum/layout.tsx`
  - `src/app/(app)/forum/page.tsx`
  - `src/app/(app)/forum/creators/page.tsx`
  - `src/app/(app)/lessons/(board)/layout.tsx`
  - `src/app/(app)/lessons/(board)/page.tsx`
  - `src/app/(app)/lessons/(board)/manage/page.tsx`
  - `src/app/(app)/problems/page.tsx`
  - `src/app/(app)/resources/page.tsx`

---

## Summary of Changes

Replaced the heavy top-bar-only chrome and `256px` feed filter sidebars with a collapsible desktop sidebar (`AppSidebar`), slim `56px` contextual top bar (`AppTopBar`), mobile 5-tab bottom navigation (`MobileBottomNav`), and compact `HorizontalFilterBar` across discovery feeds, leaving route services, hooks, middleware proxy, and the isolated `/train/[resourceId]` workspace untouched.

### 1. Navigation Config & Persisted Sidebar State

- **`src/lib/store/ui-store.ts`:** Added `isSidebarCollapsed`, `toggleSidebar`, and `setSidebarCollapsed`, persisted to `localStorage` under `e2e_sidebar_collapsed` and hydrated client-side in `AppSidebar` to prevent SSR mismatches.
- **`src/lib/constants.ts`:** Updated `isNavActive` so `"/"` matches strictly (`pathname === "/"`).
- **`src/components/layout/nav-config.ts`:** Extracted a single source of truth (`WORKSPACE_NAV_ITEMS`, `LIBRARY_NAV_ITEMS`, `STAFF_NAV_ITEMS`, `MOBILE_BOTTOM_NAV_ITEMS`, `getRouteContext`, `getUserInitials`) shared across desktop sidebar, top bar breadcrumb, mobile drawer, and mobile bottom bar.

### 2. Responsive App Shell (`src/components/layout/` & `src/app/(app)/layout.tsx`)

- **`app-sidebar.tsx`:** Implemented the desktop (`md+`) collapsible sidebar (`w-60` expanded / `w-16` collapsed) with `h-14` brand header and collapse toggle, **Workspace** links plus optional `e2e_last_train_paper` quick-resume sub-link, **My Library** with live `x/3` collection/session capacity counters, **Staff Studio**, and a footer separating profile `<Link>` and `<ContributorBadge>` (avoiding nested interactive triggers inside links) alongside Settings, `ThemeToggle`, and `<UserButton />`.
- **`app-top-bar.tsx` & `app-header.tsx`:** Replaced the multi-control top header with a `56px` (`h-14`) contextual bar preserving `writeLocked` / `WARNING` sanction banners, route prefetching, breadcrumb title/parent context via `getRouteContext`, `⌘K` CommandPalette trigger, `useRefreshStore` refresh button, and contextual `+ Create` CTA. Kept `app-header.tsx` as a compatibility re-export of `AppTopBar`.
- **`mobile-bottom-nav.tsx` & `mobile-nav.tsx`:** Added a fixed `md:hidden` 5-tab bottom bar (`Home`, `Solve!`, `Lessons`, `Resources`, `Forum`) with `min-h-[56px]` touch targets and safe-area bottom inset padding, and updated the slide-over `MobileNav` drawer with `nav-config.ts` groups, `x/3` counters, `ThemeToggle`, `UserButton`, `Escape` dismissal, and dialog ARIA attributes.
- **`src/app/(app)/layout.tsx`, `solution-fab.tsx`, & `admin/layout.tsx`:** Wired `<AppSidebar />`, `<AppTopBar />`, and `<MobileBottomNav />`, removed `<GlobalFAB />`, added bottom navigation clearance (`pb-24 md:pb-8` on main content and `bottom-20 right-4 md:bottom-6 md:right-6` on `SolutionFAB`), and updated the admin sticky nav offset to `md:top-20`.

### 3. Popover Primitive, Horizontal Filter Bar & Feed Layouts

- **`src/components/ui/popover.tsx`:** Added a `@base-ui/react/popover` wrapper (`Popover`, `PopoverTrigger`, `PopoverContent`).
- **`horizontal-filter-bar.tsx` & `filter-sidebar.tsx`:** Built a sticky compact `HorizontalFilterBar` with searchable/toggleable filter chips (`Level`, `Subject`, `Type`, `Status`, `State`, `Tags`), removable active filter pills, `Clear all`, and URL-synced `ContentSortToggle` while preserving all existing URL query parameter keys and `FilterSidebarProps` / `FilterContent` for `MobileFilterToggle`.
- **`prefetching-sub-nav.tsx`, `forum-sub-nav.tsx`, & `lessons-tabs.tsx`:** Added `variant?: "pill" | "underline"` support and switched `ForumSubNav` and `LessonsTabs` to `"underline"` for in-page header placement; made `activeHref` optional on `ForumSubNav`.
- **Feed Refactors:** Added `hideSort?: boolean` to `ForumFeed`, `LessonsFeed`, and `ManageLessonsClient` to avoid duplicate sort controls, introduced `src/app/(app)/forum/layout.tsx` to host `ForumSubNav`, and updated `forum`, `forum/creators`, `lessons/(board)`, `lessons/(board)/manage`, `problems`, and `resources` to stack `HorizontalFilterBar` above full-width feeds.

---

## Verification

1. **TypeScript (`npx tsc --noEmit`):** Exited `0` with no errors.
2. **Production Build (`npm run build`):** Exited `0`; compiled cleanly (`7.5s` compile, `11.2s` type check) and generated all `35/35` static routes.
3. **Impeccable Design Detector (`impeccable detect --json` across modified shell and filter components):** Exited `0` (only intentional `10px`/`11px` compact badge and `<kbd>` font-size advisories reported).
