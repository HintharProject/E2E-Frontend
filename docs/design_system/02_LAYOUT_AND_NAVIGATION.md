# Layout & Navigation Architecture

> **Status:** Authoritative Architectural Guide  
> **Target Files:** `src/app/(app)/layout.tsx`, `src/app/(workspace)/layout.tsx`, `src/components/layout/*`  
> **Design Mode:** Operate (dense, fast, keyboard-first) & Read (distraction-free)

---

## 1. Dual-Shell Layout Architecture

The platform provides two distinct top-level layouts depending on the educational activity:

```
                                RootLayout (src/app/layout.tsx)
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
         App Shell ((app)/layout.tsx)                  Workspace Shell ((workspace)/layout.tsx)
    ┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
    │  AppHeader (Sticky 64px, Cmd+K)     │         │  TrainTopBar (Timer, Split QP/MS)   │
    │  ─────────────────────────────────  │         │  ─────────────────────────────────  │
    │  Main Container (max-w-6xl mx-auto) │         │  Fullscreen Zero-Chrome Split Pane: │
    │  ├── FilterSidebar (lg:sticky)      │         │  ├── Curriculum Sidebar (tree)      │
    │  └── Content Feed / Detail View     │         │  └── Dual PDF Viewer (QP + MS)      │
    │  ─────────────────────────────────  │         └─────────────────────────────────────┘
    │  AppFooter                          │
    └─────────────────────────────────────┘
```

### 1.1 The Standard App Shell (`src/app/(app)/layout.tsx`)
- **Scope:** Forum feeds, Lessons directory, Solve! problem threads, Collections, Profile, and Admin.
- **Top Bar (`AppHeader`):** Sticky $64\text{px}$ bar with subtle backdrop blur (`bg-background/90 backdrop-blur-md`).
- **Main Wrapper:** `<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">`.
- **Global FAB:** Contextual floating action button (`GlobalFAB`) on mobile viewports for quick problem creation.
- **Rule of Single Container:** The `max-w-6xl mx-auto px-4 sm:px-6` boundary is applied **only once** in `AppLayout`. Child pages must **never** add redundant wrapper containers.

### 1.2 The Workspace Shell (`src/app/(workspace)/layout.tsx`)
- **Scope:** Past paper examination solving (`/train/[resourceId]`).
- **Characteristics:** Fullscreen zero-chrome viewport (`h-screen overflow-hidden flex flex-col`).
- **TrainTopBar:** Houses the examination countdown timer, split-screen toggle button (QP side-by-side with MS), zoom tools, and an immediate "Ask in Solve!" trigger modal.
- **CurriculumTreeSidebar:** Accordion navigation for quickly switching between papers in the same syllabus without losing state.

---

## 2. Container Hierarchy & Elimination of Anti-Patterns

### 2.1 The Negative Margin Anti-Pattern (Banned)
In the prototype, child pages applied negative top margins to fight parent container padding:
```tsx
// ❌ ANTI-PATTERN: Double container + negative margin hack
<div className="mx-auto max-w-6xl px-4 pb-8 pt-0 -mt-3 sm:px-6">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
    ...
  </div>
</div>
```
**The Fixed Standard:** Child views must render clean layout rows inheriting parent container bounds:
```tsx
// ✅ REQUIRED PATTERN: Clean row layout inheriting AppLayout constraints
<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
  <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20">
    <FilterSidebar showPostType />
  </aside>
  <div className="min-w-0 flex-1">
    <ForumFeed ... />
  </div>
</div>
```

---

### 2.2 The Desktop Feed Scroll Trap Anti-Pattern (Banned)
In earlier iterations, feeds locked desktop viewports with fixed heights:
```tsx
// ❌ ANTI-PATTERN: Traps mouse wheel, causes double scrollbars
<div className="lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:custom-scrollbar">
  <PostList />
</div>
```
**The Fixed Standard:** Feeds render naturally within the document body. The main window scrolls, while the sticky sidebar remains pinned in view:
```tsx
// ✅ REQUIRED PATTERN: Natural window scrolling with sticky desktop sidebar
<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
  <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20">
    <FilterSidebar />
  </aside>
  <main className="min-w-0 flex-1">
    <PostList />
  </main>
</div>
```

---

## 3. Navigation Components Specification

### 3.1 `AppHeader` (`src/components/layout/app-header.tsx`)
- **Height:** $64\text{px}$ (`h-16`)
- **Backdrop:** `border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40`
- **Navigation Groups:**
  1. **Brand Identity:** Logo + Hinthar Education wordmark linking to `/forum`.
  2. **Primary Navigation Pills:**
     - Links: `Forum`, `Lessons`, `Solve!`, `Train!`, `Resources`.
     - Active State: `bg-primary/15 text-primary font-medium border border-primary/25 rounded-md px-3 py-1.5 text-xs sm:text-sm`
     - Inactive State: `text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-md px-3 py-1.5 text-xs sm:text-sm`
  3. **Secondary Collections Dropdown:** Consolidates `Study Plans` and `Saved Sessions` into a compact popover menu to prevent tablet navbar crowding.
  4. **Global Search Trigger (`CommandPalette`):**
     - Keyboard shortcut trigger with badge: `<kbd className="text-[10px] font-mono bg-muted border border-border px-1.5 py-0.5 rounded">⌘K</kbd>`.
  5. **User Utilities:**
     - Theme switcher (`ThemeToggle`)
     - Cold-start refresh indicator (`TopmostScrollRefresh` / `useRefreshStore`)
     - Clerk `<UserButton />`

---

### 3.2 `FilterSidebar` (`src/components/layout/filter-sidebar.tsx`)
- **Desktop Layout:** `w-full lg:w-64 shrink-0 lg:sticky lg:top-20 self-start`
- **Mobile Layout:** Rendered inside a slide-up bottom drawer triggered by `MobileFilterToggle`.
- **Taxonomy Filters:**
  - Academic Level (IGCSE, A-Level, IB)
  - Subject (Mathematics, Physics, Chemistry, Biology, Economics)
  - Post / Problem Type
  - Tag Search with Combobox (`TagInput`)
- **State Management:** URL search parameters (`?subject=...&level=...&tag=...`) for shareable, bookmarkable filter views.

---

### 3.3 Horizontal Secondary Tabs (`SubNav` & `PrefetchingSubNav`)
- **File:** `src/components/ui/sub-nav.tsx`, `src/components/ui/prefetching-sub-nav.tsx`
- **Purpose:** Route switching within a section (e.g. Forum: `Main Feed` | `Announcements` | `Followed Creators`).
- **Mobile Scrolling:** `overflow-x-auto scrollbar-none flex gap-2 border-b border-border pb-2`.
- **Prefetching:** Automatically initiates background TanStack Query prefetch on `onMouseEnter` and `onTouchStart` to optimize network latency without wasteful initial over-fetching.

---

### 3.4 Mobile Navigation (`src/components/layout/mobile-nav.tsx`)
- **Breakpoint:** Active on `< 1024px` (`lg:hidden`).
- **Slide-Over Drawer:** Accessible sheet containing all platform routes.
- **Ergonomics:** Every touch target is at least $44\times 44\text{px}$ with generous vertical spacing ($8\text{px}$ gap).
- **Categorization:** Clearly delineates public learner feeds from user collections and staff moderation tools.

