# 0009: Phase 3 — Layout & Navigation Shell Renewal

**Date**: 2026-11-12  
**Status**: Implemented & Verified  
**Scope**: Unified Container Hierarchy, Eradication of `-mt-3` and Desktop Scroll Traps, Streamlined `AppHeader`, Sticky `FilterSidebar`, Mobile Drawer Optimizations, and Standardized `SubNav`  
**Target Files**:
- Layout & Root: `src/app/(app)/layout.tsx`
- Layout Components: `src/components/layout/app-header.tsx`, `src/components/layout/app-header-skeleton.tsx`, `src/components/layout/filter-sidebar.tsx`, `src/components/layout/tag-search-filter.tsx`, `src/components/layout/mobile-nav.tsx`, `src/components/layout/mobile-filter-toggle.tsx`
- Sub-Navigation: `src/components/ui/sub-nav.tsx`, `src/components/features/forum/forum-sub-nav.tsx`, `src/components/features/lessons/lessons-tabs.tsx`
- Screen Container Cleanups: `src/app/(app)/forum/page.tsx`, `src/app/(app)/forum/announcements/page.tsx`, `src/app/(app)/forum/creators/page.tsx`, `src/app/(app)/lessons/(board)/layout.tsx`, `src/app/(app)/problems/page.tsx`, `src/app/(app)/resources/page.tsx`, `src/app/(app)/train/page.tsx`  
**Author Agent**: Phase 3 Layout & Navigation Specialist (via Impeccable & UI/UX Pro Max)

---

## 1. Context & Objectives

Building upon Phase 1 (Tokens & Typography) and Phase 2 (Core Components Kit), Phase 3 resolved structural layout collisions, desktop viewport scroll traps, and responsive navigation clutter across the platform:

1. **Eliminate Double-Nested Containers & Negative Margin Compensations (`-mt-3`):**
   Root `AppLayout` imposes `<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">`. Child pages previously introduced redundant nested containers with `-mt-3` hacks (`<div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-3 sm:px-6">`), creating spacing anomalies and layout conflicts.
2. **Eradicate Desktop Scroll Traps (`calc(100vh - 160px)`):**
   Desktop feeds across Forum, Lessons, Problems, and Resources previously locked feed containers to fixed heights with inner scrollbars (`lg:h-[calc(100vh-160px)] lg:overflow-y-auto`), causing mouse-wheel traps and dual scrollbars. Feeds now scroll naturally with the browser window.
3. **Streamline `AppHeader` Navigation & Eliminate Tablet/Laptop Wrapping:**
   The desktop navbar previously stacked 4 rows vertically and wrapped awkwardly around 1024px. Consolidated secondary items into a unified `Collections` dropdown and staff links into a separated `Staff` dropdown, achieving a clean single-row 64px (`h-16`) header on desktop with segmented active pill states.
4. **Desktop Sticky `FilterSidebar` & Enhanced Mobile Drawers:**
   Enhanced `FilterSidebar` to stick gracefully during desktop window scrolling (`lg:w-64 sticky top-20 self-start`) without `-ml-4` hacks. Elevated `MobileFilterToggle` with live active filter count badges (`Filters (2)`) and a slide-up bottom sheet drawer with minimum 44×44px tap targets and dedicated "Reset All" / "Apply Filters" actions.
5. **Secondary Navigation (`SubNav`) Standardization:**
   Standardized `SubNav` with clean segmented pill styling, accessible touch sizing, smooth horizontal scrolling without scrollbars (`scrollbar-none`), and aligned domain sub-route labels (`Main Feed` / `Announcements` / `Followed Creators` and `All Lessons` / `Manage Lessons`).

---

## 2. Key Changes & Deliverables

### 2.1 Unified Layout Container Hierarchy & Removal of `-mt-3`
- **`src/app/(app)/layout.tsx`:**
  - Standardized main container padding to `py-6 sm:px-6 max-w-6xl mx-auto`.
- **Eradication of `-mt-3` Across All Child Pages:**
  - `src/app/(app)/forum/page.tsx`: Removed redundant outer container and `-mt-3`.
  - `src/app/(app)/forum/announcements/page.tsx`: Removed redundant outer container and `-mt-3`.
  - `src/app/(app)/forum/creators/page.tsx`: Removed redundant outer container and `-mt-3`.
  - `src/app/(app)/lessons/(board)/layout.tsx`: Removed redundant outer container and `-mt-3`.
  - `src/app/(app)/problems/page.tsx`: Removed redundant outer container and `-mt-3`.
  - `src/app/(app)/resources/page.tsx`: Removed redundant outer container and `-mt-3`.
  - `src/app/(app)/train/page.tsx`: Removed redundant `max-w-7xl` wrapper and `-mt-3`.
  - **Result**: Zero occurrences of `-mt-` remain in `src/`.

### 2.2 Desktop Feed Scroll Trap Eradication & Sticky `FilterSidebar`
- **Eliminated Fixed Viewport Locks:**
  - Removed `lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:custom-scrollbar lg:pr-2` across `forum/page.tsx`, `lessons/(board)/layout.tsx`, `problems/page.tsx`, and `resources/page.tsx`.
  - Primary feeds now render at natural DOM height and scroll with the main browser window.
- **Sticky Desktop `FilterSidebar` (`src/components/layout/filter-sidebar.tsx`):**
  - Updated sidebar wrapper: `<aside className="hidden w-full shrink-0 lg:block lg:w-64 sticky top-20 self-start">`.
  - Removed legacy `-ml-4` negative margin hack.
  - Internal container utilizes `max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar shadow-card` to support deep taxonomy lists without cutting off while pinned in view.
  - Replaced legacy tokens (`border-line`, `text-ink`, `text-ink-muted`, `accent-brand`, `font-display`) with canonical semantic tokens (`border-border`, `text-foreground`, `text-muted-foreground`, `accent-primary`, `font-heading`).
  - Updated `TagSearchFilter`: Removed unused variables, modernized to `border-border`, `text-foreground`, and `shadow-card`.

### 2.3 Streamlined `AppHeader` & Navigation Kit (`src/components/layout/app-header.tsx`)
- **Single-Row 64px (`h-16`) Desktop Navbar:**
  - Eliminated vertical row clutter; brand, primary tabs, search trigger, refresh trigger, theme toggle, and user menu now align on a single clean desktop bar.
- **Navigation Grouping:**
  - **Primary Tabs**: `Forum`, `Lessons`, `Solve!`, `Train!`, `Resources`.
  - **Collections Dropdown**: Consolidates `Study Plans` and `Saved Sessions` via `@base-ui/react/menu` dropdown, preventing navbar crowding on tablet/laptop screens.
  - **Staff Separation**: Distinguishes `Moderation Reports` and `Admin Dashboard` behind a dedicated staff divider and badge dropdown for privileged roles (`isStaffRole`).
- **Segmented Pill States:**
  - Active: `bg-primary/15 text-primary border border-primary/25 font-semibold shadow-2xs rounded-md px-3 py-1.5 text-xs sm:text-sm`
  - Inactive: `text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors rounded-md px-3 py-1.5 text-xs sm:text-sm`
- **Global Search Trigger (`CommandPalette`):**
  - Polished search button with keyboard badge: `<kbd className="text-[10px] font-mono bg-muted border border-border px-1.5 py-0.5 rounded">⌘K</kbd>` / `Ctrl+K`.
- **Cold-Start Refresh Button (`useRefreshStore`):**
  - Aligned cleanly next to `ThemeToggle` with spinning state and refreshed confirmation indicators.
- **CLS-Compliant Skeleton (`app-header-skeleton.tsx`):**
  - Updated skeleton layout to mirror the single-row 64px header, preserving CLS $< 0.1$.

### 2.4 Mobile Navigation & Filter Drawer Optimization
- **`src/components/layout/mobile-nav.tsx`:**
  - Enforced minimum $44\times 44\text{px}$ tap targets across all links.
  - Implemented structured visual categorization:
    1. User Profile card with avatar, role/contributor badge, profile, and settings buttons.
    2. Explore Feeds group (`Forum`, `Lessons`, `Solve!`, `Train!`, `Resources`).
    3. Collections group (`Study Plans`, `Saved Sessions`).
    4. Staff Moderation group (role-gated).
  - Background scroll lock and accessible dismiss handlers.
- **`src/components/layout/mobile-filter-toggle.tsx`:**
  - Real-time active filter count badge: `Filters (N)`.
  - Slide-up bottom sheet drawer with sticky action footer ("Reset All" and "Apply Filters").
  - Full touch targets $\ge 44\text{px}$.

### 2.5 Secondary Sub-Navigation Standardization (`SubNav`)
- **`src/components/ui/sub-nav.tsx`:**
  - Clean segmented pill design with smooth horizontal scrolling and hidden scrollbars (`scrollbar-none`).
  - Accessible touch sizes with high-contrast active states.
- **Route Tabs Normalization:**
  - Forum (`forum-sub-nav.tsx`): `Main Feed` | `Announcements` | `Followed Creators`.
  - Lessons (`lessons-tabs.tsx`): `All Lessons` | `Manage Lessons`.

---

## 3. Verification & Acceptance Checklist

- [x] Zero files in `src/` contain `-mt-3` or negative margin hacks.
- [x] Zero redundant `max-w-6xl mx-auto px-4` wrappers inside child pages.
- [x] Primary feed pages (`forum`, `lessons`, `problems`, `resources`) scroll naturally with the window without fixed `calc(100vh-160px)` desktop scroll traps.
- [x] `FilterSidebar` pins cleanly on desktop via `sticky top-20` and maintains independent internal scroll for deep taxonomies.
- [x] `AppHeader` items fit cleanly without awkward wrapping or breaking at 1024px tablet/laptop widths.
- [x] Mobile navigation and filter drawer provide touch targets $\ge 44\text{px}$ (WCAG 2.2 AA compliant).
- [x] `npx eslint` passes with 0 errors and 0 warnings across all modified layout components.
- [x] `npx tsc --noEmit` compiles cleanly with zero TypeScript errors.

---

## 4. Handoff to Phase 4 Specialist

Phase 3 is complete. The application shell, sticky navigation, container hierarchy, and responsive drawers are fully normalized.
The next agent executing **Phase 4: Screen Flows Refactoring** should:
1. Review `E2E-frontend/docs/design_system/03_SCREEN_FLOWS_AND_PATTERNS.md` and `Planning/design system new/04_PHASE_4_SCREEN_FLOWS_REFACTORING.md`.
2. Refactor module screens (Forum feed & post detail, Solve! problem threads & solutions, Train! workspace, Lessons, and User Profile).
3. Adopt composable `<Card>` primitives, `<EmptyState>`, `<Field>`, and contributor badges uniformly across individual screen feeds.

