# Hinthar Education E2E — Design System (`DESIGN.md`)

> **Aesthetic Direction:** **Warm Editorial Academic**
> High-craft academic clarity anchored in warm parchment paper (`#FAF8F3`), crisp white cards (`#FFFEFB`), Oxford academic emerald (`oklch(0.45 0.115 162)`), and deep slate ink (`#19202B`), balanced by a low-strain warm-slate Dark Mode.
> **Implementation Status:** **Phases 1–5 Complete** across `E2E-frontend`.

---

## 1. Philosophy & Architecture Principles

1. **Purpose-Built Format Differentiation:**
   - **Home Hub (`/`):** Personal bento command center with Resume `Train!`, live Study Plan & Saved Session capacity bars (`X/3`), Open `Solve!` bounties, Fresh Lessons, and official Announcements.
   - **Lessons (`/lessons`):** Editorial syllabus shelf catalog organized by Subject with top Level tabs and drill-down grid; distraction-free `max-w-3xl` Read Mode for lesson detail views.
   - **Exams & Resources (`/resources` & `/train/[resourceId]`):** Unified Past Papers + Textbooks hub (paired Question Papers `QP` & Mark Schemes `MS`, inline `DocumentViewerModal`, `AskInSolveModal`, and `Select for Problem` bridge), linking into the fullscreen split-PDF `Train!` workspace (`src/app/(workspace)/`).
   - **Solve! (`/problems`):** Asymmetric **Academic Challenge Ticket** cards featuring a left vertical vote & 7-slot pool meter rail, Path B Past Paper provenance strip, inline solution drawer/pool header CTA, and `ProblemsRightRail` guidance.
   - **Forum (`/forum`):** Compact editorial discussion stream distinguishing `QUESTION`, `SHARING`, and `ANNOUNCEMENT` formats, displaying `30-day TTL` warning indicators, inline `<ThreadedComment />` trees, and `ForumRightRail` quick notices.
   - **Collections (`/study-plans`, `/saved-sessions`):** Curated study binders with explicit `<CollectionCapacityStrip />` (`X / 3 slots used` hard cap) and empty-collection creation guards.
   - **Admin Studio (`/admin`):** Structured 4-card KPI telemetry strip, curriculum health matrix, response-depth bar visualization (`var(--chart-*)` semantic tokens), and moderation inspector.
2. **Operate vs. Read Spatial Discipline:**
   - **Operate Mode (`max-w-7xl`):** Feeds, hubs, filter bars, right contextual rails (`xl:w-72`), tables, and admin dashboards maximize horizontal breathing room.
   - **Read Mode (`max-w-3xl`):** Lesson articles, Problem & Solution discussions, Post threads, Settings, and `/new` / `/edit` authoring studios constrain prose width for comfortable reading and focus.
3. **Calm, Academic Interaction Design:**
   - Zero decorative emojis—icons exclusively from `lucide-react` (`ChevronUp`, `BookOpen`, `Lightbulb`, `FolderKanban`, `Clock`, `Bookmark`, `ShieldAlert`, `AlertTriangle`, `Ban`, etc.).
   - No nested cards or floating corner trash icons over media; flat single-layer surfaces with semantic borders and inline action rows.
   - All numeric scores, slot counts (`X/7`, `X/3`), timers (`useTrainTimer`), and ledger multipliers (`1×–5×`) use `font-mono tabular-nums`.

---

## 2. Color & Surface System (OKLCH)

Defined in `src/app/globals.css` with Tailwind CSS v4 `@theme inline`. Never hardcode hex, `rgb()`, or raw `oklch()` strings inside JSX/TSX components—always consume semantic utility tokens (`bg-card`, `text-foreground`, `border-border`, `text-primary`, `bg-warning/10`, `var(--chart-1)`, etc.).

### Light Mode (`:root` — Warm Editorial Academic)
- **Canvas Background (`--background`):** `oklch(0.978 0.006 85)` *(Warm ivory parchment `#FAF8F3`)*
- **Foreground Ink (`--foreground`):** `oklch(0.19 0.015 250)` *(Deep slate charcoal ink `#19202B`)*
- **Elevated Card (`--card`):** `oklch(0.996 0.003 85)` *(Crisp bright paper `#FFFEFB`)*
- **Popover Surface (`--popover`):** `oklch(0.998 0.002 85)`
- **Sidebar Surface (`--sidebar`):** `oklch(0.965 0.007 85)` *(Subtle warm stone rail)*
- **Primary Brand (`--primary`):** `oklch(0.45 0.115 162)` *(Oxford academic emerald)*
- **Primary Foreground (`--primary-foreground`):** `oklch(0.99 0.004 85)`
- **Secondary / Muted (`--secondary`, `--muted`):** `oklch(0.945 0.008 85)` *(Warm alabaster fill)*
- **Muted Foreground (`--muted-foreground`):** `oklch(0.46 0.014 250)` *(AA-compliant secondary text)*
- **Accent (`--accent` / `--accent-foreground`):** `oklch(0.935 0.025 162)` / `oklch(0.25 0.04 162)`
- **Border (`--border`) / Input (`--input`):** `oklch(0.895 0.009 85)` / `oklch(0.88 0.009 85)`
- **Ring (`--ring`):** `oklch(0.45 0.115 162)`
- **Destructive (`--destructive`):** `oklch(0.56 0.21 25)` *(Academic crimson)*
- **Warning (`--warning`):** `oklch(0.55 0.15 62)` *(Burnt amber for 30d TTL & alerts)*

### Dark Mode (`.dark` — Deep Warm Slate)
- **Canvas Background (`--background`):** `oklch(0.155 0.008 250)`
- **Foreground Ink (`--foreground`):** `oklch(0.955 0.006 85)` *(Warm off-white parchment ink)*
- **Elevated Card (`--card`):** `oklch(0.205 0.01 250)`
- **Popover Surface (`--popover`):** `oklch(0.225 0.011 250)`
- **Sidebar Surface (`--sidebar`):** `oklch(0.135 0.008 250)`
- **Primary Brand (`--primary`):** `oklch(0.66 0.13 162)` *(Luminous emerald)*
- **Primary Foreground (`--primary-foreground`):** `oklch(0.14 0.015 162)`
- **Secondary / Muted (`--secondary`, `--muted`):** `oklch(0.255 0.01 250)` / `oklch(0.24 0.009 250)`
- **Muted Foreground (`--muted-foreground`):** `oklch(0.70 0.012 85)`
- **Accent (`--accent` / `--accent-foreground`):** `oklch(0.265 0.025 162)` / `oklch(0.94 0.012 162)`
- **Border (`--border`) / Input (`--input`):** `oklch(0.285 0.01 250)` / `oklch(0.30 0.01 250)`
- **Ring (`--ring`):** `oklch(0.66 0.13 162)`
- **Destructive (`--destructive`):** `oklch(0.65 0.20 25)`
- **Warning (`--warning`):** `oklch(0.76 0.15 72)`

### Domain-Specific Tokens
- **Contributor Tiers (`0–4`):** `--tier-0`..`--tier-4` + `--tier-0-bg`..`--tier-4-bg` (Slate `1×`, Amber `2×`, Sky `3×`, Emerald `4×`, Scholar Royal Violet `5×`).
- **Chart Palette (`--chart-1`..`--chart-5`):** Semantic CSS variables powering Recharts / stacked analytics (`FINAL` status badges use `--chart-3`, Problem/Solution/Lesson/Post breakdown charts map via `var(--chart-1..5)`).

---

## 3. Typography Hierarchy

Configured in `src/app/layout.tsx` via `next/font/google` & `geist/font/mono`, mapped in `@theme inline`:
- **Display Font (`font-display`):** `Newsreader` (`--font-display`, optical weight editorial serif for PageHeader display titles, Home Hub welcome greeting, syllabus shelf titles, and reader article headlines).
- **UI & Heading Font (`font-sans`, `font-heading`):** `Plus Jakarta Sans` (`--font-sans` & `--font-heading`, high-legibility humanist sans for card headers, navigation items, forms, buttons, and body prose).
- **Monospace Font (`font-mono`):** `Geist Mono` (`--font-geist-mono`, curriculum syllabus codes, scores/vote counters, slot meters, `⌘K` keyboard hints, and IDs).

### Scale
| Role | Classes | Weight | Notes |
| :--- | :--- | :--- | :--- |
| Display Hero / Shelf | `font-display text-2xl sm:text-3xl tracking-tight` | `600` | Editorial serif headline |
| Card / Section Heading | `font-heading text-base sm:text-lg tracking-tight` | `600–700` | Card titles, dialog titles, right-rail headers |
| Standard Body | `text-sm leading-relaxed` | `400` | Primary card summaries, prose descriptions, comments |
| Compact Metadata / Chips | `text-xs font-medium` | `500` | Authors, timestamps, filter chips, status badges |
| Micro Kicker / Syllabus Telemetry | `text-[10px]` / `text-[11px] font-mono tabular-nums` | `500–600` | Uppercase eyebrows, mobile nav captions, slot counters (`X/7`, `X/3`), `OP`/`ACCEPTED` badges |

---

## 4. Layout Architecture & Shells

1. **Standard App Shell (`src/app/(app)/layout.tsx`):**
   - **`<AppSidebar />` (`src/components/layout/app-sidebar.tsx`):** Desktop collapsible left rail (`w-60` expanded / `w-16` collapsed, persisted in `useUIStore`), containing brand header, **Workspace** (`Home`, `Solve!`, `Lessons`, `Forum`, `Exams & Resources`), **My Library** (`Study Plans`, `Saved Sessions`), conditional **Staff Studio** (`Moderation`, `Admin Studio`), and bottom identity/theme/settings footer.
   - **`<AppTopBar />` (`src/components/layout/app-top-bar.tsx`):** Slim `h-14` sticky top context bar with mobile nav drawer trigger, dynamic route title, `⌘K` Search button (`openCommandPalette`), cold-start refresh button, and contextual primary `+ Ask Problem` / `+ Write Lesson` / `+ New Post` / `+ Create` action, plus sanction banners above when active.
   - **`<HorizontalFilterBar />` (`src/components/layout/horizontal-filter-bar.tsx`):** Sticky filter & sort strip above feeds (`Level`, `Subject`, optional `Type`, `Status`, `State`, `Tags`, active filter chips, and `sortSlot` / `rightActions`).
   - **`<main id="main-content">`:** Centered `max-w-7xl` work canvas with `pb-24 md:pb-8` clearing `<MobileBottomNav />` (`md:hidden`, 5 ergonomic bottom tabs).
   - **Right Contextual Rails (`hidden xl:block w-72 shrink-0`):** Paired alongside `Solve!` (`ProblemsRightRail`) and `Forum` (`ForumRightRail`) feeds without squeezing feed readability.
2. **Fullscreen Practice Workspace (`src/app/(workspace)/layout.tsx`):**
   - Zero-chrome distraction-free environment dedicated exclusively to `/train/[resourceId]` (dual PDF panes `[L]`/`[R]`, `TrainTopBar`, `TimerWidget`, `CurriculumTreeSidebar`, `AskInSolveModal`, `SolveAPaperModal`).

---

## 5. Accessibility & Craft-Floor Invariants

- **Touch & Click Targets:** Minimum `44×44px` (`min-h-[44px] min-w-[44px]`) on mobile controls, bottom nav items, vote rail buttons, and inline reply triggers.
- **Keyboard Navigation & Landmarks:** Single `<main id="main-content">` landmark per route (`AdminLayout` uses an inner `<div>` to avoid nested `<main>` tags), `focus-visible:ring-2 focus-visible:ring-ring`, `⌘K`/`Ctrl+K` Command Palette, and `Escape` modal dismissal.
- **Contrast:** Light mode surface text (`#19202B` on `#FAF8F3`/`#FFFEFB`) > `12:1`; secondary text `>= 4.5:1`; Dark mode cards visibly elevated from dark slate background with crisp `1px` borders.
- **Domain Integrity:** Preserves Clerk RBAC + sanction locks (`writeLocked`), 7-slot solution pool eviction & 48h `FINAL` consensus rules, 30-day post TTL markers, max 3 tags, and strict `3/3` collection capacity caps + empty-collection guards.

---

## 6. Reference Index
- [00_DESIGN_TOKENS.md](./docs/design_system/00_DESIGN_TOKENS.md) — Exact OKLCH variables, font pipeline, shadows & radii.
- [01_COMPONENT_CATALOG.md](./docs/design_system/01_COMPONENT_CATALOG.md) — Primitives (`Button`, `Input`, `Select`, `TagInput`, `FileDropzone`, `Field`, `Card`, `Badge`, `Dialog`, `HorizontalFilterBar`, Right Rails).
- [02_LAYOUT_AND_NAVIGATION.md](./docs/design_system/02_LAYOUT_AND_NAVIGATION.md) — Dual-shell layout, sidebar, mobile bottom bar, filter strip & rails.
- [03_SCREEN_FLOWS_AND_PATTERNS.md](./docs/design_system/03_SCREEN_FLOWS_AND_PATTERNS.md) — Screen blueprints from Home Hub (`/`) through Admin Studio (`/admin`).
