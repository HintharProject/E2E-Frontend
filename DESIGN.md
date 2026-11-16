---
name: "Hinthar Education E2E"
description: "Warm Editorial Academic design system for peer problem solving, past-paper practice, and creator-led learning."
colors:
  oxford-emerald: "oklch(0.45 0.115 162)"
  oxford-emerald-deep: "oklch(0.38 0.105 162)"
  sage-tint: "oklch(0.935 0.025 162)"
  sage-ink: "oklch(0.25 0.04 162)"
  ivory-parchment: "oklch(0.978 0.006 85)"
  bright-paper: "oklch(0.996 0.003 85)"
  popover-vellum: "oklch(0.998 0.002 85)"
  warm-stone-rail: "oklch(0.965 0.007 85)"
  warm-alabaster: "oklch(0.945 0.008 85)"
  slate-charcoal-ink: "oklch(0.19 0.015 250)"
  muted-slate-ink: "oklch(0.46 0.014 250)"
  parchment-rule: "oklch(0.895 0.009 85)"
  input-rule: "oklch(0.88 0.009 85)"
  academic-crimson: "oklch(0.56 0.21 25)"
  burnt-amber: "oklch(0.55 0.15 62)"
  cerulean-final: "oklch(0.52 0.13 245)"
  scholar-royal-violet: "oklch(0.48 0.22 300)"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.oxford-emerald}"
    textColor: "{colors.ivory-parchment}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.warm-alabaster}"
    textColor: "{colors.slate-charcoal-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.bright-paper}"
    textColor: "{colors.slate-charcoal-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-slate-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.academic-crimson}"
    textColor: "{colors.bright-paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  card-default:
    backgroundColor: "{colors.bright-paper}"
    textColor: "{colors.slate-charcoal-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input-default:
    backgroundColor: "{colors.bright-paper}"
    textColor: "{colors.slate-charcoal-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  badge-default:
    backgroundColor: "{colors.sage-tint}"
    textColor: "{colors.oxford-emerald}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    height: "20px"
  nav-rail:
    backgroundColor: "{colors.warm-stone-rail}"
    textColor: "{colors.slate-charcoal-ink}"
    width: "240px"
---

# Design System: Hinthar Education E2E

## Overview

**Creative North Star: "The Archival Study"**

Hinthar Education E2E replaces heavy LMS chrome with quiet editorial clarity built for focused exam preparation and peer problem solving. Surfaces behave like well-organized archival stationery: warm ivory parchment (`--background`, `defaultTheme="light"` in `src/app/layout.tsx`), crisp bright paper cards (`--card`), Oxford academic emerald ink (`--primary`), and high-contrast slate charcoal typography (`--foreground`), paired with a co-equal Deep Library Obsidian dark theme calibrated for low-strain evening study.

Every screen honors a deliberate separation between **Operate Mode** (wide `max-w-7xl` bento hubs, feeds, curriculum shelves, and contextual right rails) and **Read & Authoring Mode** (constrained `max-w-3xl` lesson articles, problem threads, and creation studios), alongside a zero-chrome fullscreen `Train!` practice workspace (`src/app/(workspace)/layout.tsx`). Detailed screen specifications and component APIs live alongside this file in [00_DESIGN_TOKENS.md](./docs/design_system/00_DESIGN_TOKENS.md), [01_COMPONENT_CATALOG.md](./docs/design_system/01_COMPONENT_CATALOG.md), [02_LAYOUT_AND_NAVIGATION.md](./docs/design_system/02_LAYOUT_AND_NAVIGATION.md), and [03_SCREEN_FLOWS_AND_PATTERNS.md](./docs/design_system/03_SCREEN_FLOWS_AND_PATTERNS.md).

**Key Characteristics:**
- Warm Editorial Academic tone anchored in OKLCH perceptual uniformity across both Warm Archival Paper (light) and Deep Library Obsidian (dark) themes.
- Strict format differentiation across surfaces: Home Hub bento (`/`) , Subject Shelves (`/lessons`), Past Paper + Textbook hub (`/resources`), split-PDF `Train!` workspace (`/train/[resourceId]`), asymmetric `Solve!` tickets (`/problems`), ephemeral 30-day Forum threads (`/forum`), and `X/3` capacity-metered Collections (`/study-plans`, `/saved-sessions`).
- Calm, noise-free academic affordances: zero decorative emojis (`lucide-react` exclusively), flat single-layer cards without nested card wrappers, and `font-mono tabular-nums` on every score, slot gauge (`X/7`, `X/3`), and exam timer.

## Colors

The palette pairs warm stone-tinted paper neutrals with disciplined Oxford emerald accents and status colors tuned for WCAG 2.2 AA contrast in both themes (defined in `src/app/globals.css`).

### Primary
- **Oxford Emerald (`oxford-emerald` / `--primary`):** Primary CTAs (`Ask Problem`, `Write Lesson`, `New Post`), active navigation indicators, active upvote state, focus rings (`--ring`), and primary interactive links.
- **Oxford Emerald Deep (`oxford-emerald-deep` / `--brand-dark`):** Legacy deep brand alias used where higher-contrast emerald emphasis is needed over light washes.

### Secondary
- **Sage Tint (`sage-tint` / `--accent`) & Sage Ink (`sage-ink` / `--accent-foreground`):** Selected sidebar navigation pills (`bg-sidebar-accent`), hover highlights on `#tag` chips, and soft emerald tinted badges.

### Neutral
- **Ivory Parchment (`ivory-parchment` / `--background`):** Base application canvas providing warm paper separation behind elevated white cards.
- **Bright Paper (`bright-paper` / `--card`):** Elevated card, form input, and ticket surface background.
- **Popover Vellum (`popover-vellum` / `--popover`):** Elevated menus, filter popovers, and modal dialogs.
- **Warm Stone Rail (`warm-stone-rail` / `--sidebar`):** Subtle stone-tinted desktop left navigation rail (`AppSidebar`).
- **Warm Alabaster (`warm-alabaster` / `--secondary`, `--muted`):** Secondary button fills, inactive pill backgrounds, skeleton loaders, and quiet surface wells.
- **Slate Charcoal Ink (`slate-charcoal-ink` / `--foreground`):** Primary body copy, card headlines, and high-contrast display headings (`> 12:1` on light paper).
- **Muted Slate Ink (`muted-slate-ink` / `--muted-foreground`):** Author metadata, timestamps, eyebrows, and secondary labels (`>= 4.5:1`).
- **Parchment Rule (`parchment-rule` / `--border`) & Input Rule (`input-rule` / `--input`):** Crisp `1px` structural dividers, card frames, and form field strokes.

### Semantic & Domain Tokens
- **Academic Crimson (`academic-crimson` / `--destructive`):** Destructive actions, validation errors (`aria-invalid`), and account restriction (`writeLocked`) banners.
- **Burnt Amber (`burnt-amber` / `--warning`):** 30-day Forum TTL countdown pills (`Expires in Xd`), Tier 2+ solution eviction notices, and account `WARNING` banners.
- **Cerulean Final (`cerulean-final` / `--chart-3`):** `FINAL` 48-hour consensus lock badges (`border-chart-3/40 bg-chart-3/10 text-chart-3`) and analytics series; paired with `--chart-1`..`--chart-5` for Recharts visualizations in Admin Studio.
- **Contributor Tiers (`0–4` via `--tier-0..4` & `--tier-0-bg..4-bg`):** Neutral Slate Novice (`1×`), Amber Bronze Explorer (`2×`), Sky Silver Solver (`3×`, unlocks 7-slot eviction), Emerald Gold Master (`4×`), and **Scholar Royal Violet** (`scholar-royal-violet` / `--tier-4`, `5×`, paired with `.animate-scholar-shimmer`).

### Dark Mode (`Deep Library Obsidian` — `.dark`)
- **Canvas & Surfaces:** Deep slate-obsidian canvas (`oklch(0.155 0.008 250)`), recessed sidebar rail (`oklch(0.135 0.008 250)`), elevated slate cards (`oklch(0.205 0.01 250)`), popovers (`oklch(0.225 0.011 250)`), warm parchment ink (`oklch(0.955 0.006 85)`), and crisp `1px` borders (`oklch(0.285 0.01 250)`).
- **Accents & Status:** Luminous emerald primary (`oklch(0.66 0.13 162)`), deep forest accent well (`oklch(0.265 0.025 162)`), crimson (`oklch(0.65 0.20 25)`), and luminous amber (`oklch(0.76 0.15 72)`).

**The Semantic Token Rule.** Never hardcode hex, `rgb()`, or raw `oklch()` strings inside JSX/TSX components or Recharts props; always consume semantic Tailwind classes (`bg-card`, `text-foreground`, `border-border`, `text-primary`) or CSS custom properties (`var(--chart-1..5)`).

**The Quiet Accent Rule.** Oxford emerald is reserved for primary actions, active navigation states, and live focus rings so academic content and math notation remain the visual center of gravity.

## Typography

**Display Font:** `Newsreader` (serif, `next/font/google`, `--font-display`) with `Georgia, serif` fallback.
**Body / UI Font:** `Plus Jakarta Sans` (sans-serif, `next/font/google`, `--font-sans` & `--font-heading`) with `system-ui, sans-serif` fallback.
**Label / Mono Font:** `Geist Mono` (`geist/font/mono`, `--font-geist-mono`) with `ui-monospace, monospace` fallback.

**Character:** Editorial humanism meets structured engineering precision—`Newsreader` lends literary warmth to page headers and syllabus shelves, `Plus Jakarta Sans` keeps dense feeds and forms effortless to scan, and `Geist Mono` anchors syllabus codes, timers, and reputation telemetry.

### Hierarchy
- **Display** (`600`, `1.5rem–1.875rem` / `text-2xl sm:text-3xl`, line-height `1.2`, tracking `-0.02em`): `Newsreader` (`font-display`) for `PageHeader` titles, Home Hub welcome greeting, `EmptyState` titles (`text-xl sm:text-2xl`), and curriculum shelf headers.
- **Headline** (`600–700`, `1.125rem` / `text-base sm:text-lg`, line-height `1.35`, tracking `-0.02em`): `Plus Jakarta Sans` (`font-heading`) for `CardTitle`, section headings, right-rail headers, and dialog headers (`text-sm font-medium` on compact dialogs).
- **Title** (`600`, `1rem` / `text-base`, line-height `1.4`, tracking `-0.01em`): `Plus Jakarta Sans` for feed card headlines and compact navigation context titles.
- **Body** (`400`, `0.875rem` / `text-sm`, line-height `1.625` / `leading-relaxed`): `Plus Jakarta Sans` for card summaries, lesson prose, comments, and `MathRenderer` explanations (constrained to `max-w-3xl` in Read Mode).
- **Label** (`500`, `0.75rem` / `text-xs`, line-height `1.25`): `Plus Jakarta Sans` for filter chips, nav items, timestamps, and author bylines; drops to `10px–11px` uppercase (`tracking-wider`) for `PageHeader` eyebrows, sidebar section labels, and mobile tab captions.
- **Mono Telemetry** (`500–600`, `10px–12px`, `font-mono tabular-nums`): `Geist Mono` for syllabus codes (`9709`, `9702`), `#tag` chips, `X/7` pool gauges, `X/3` library counters, vote totals, `⌘K` keyboard caps, and exam countdowns.

**The Tabular Telemetry Rule.** Every numeric score, slot ratio (`X/7`, `X/3`), point delta, and exam timer must apply `font-mono tabular-nums` so numbers align vertically without layout jitter during updates.

**The Editorial Contrast Rule.** Reserve `Newsreader` (`font-display`) strictly for top-level page, shelf, and empty-state headlines; use `Plus Jakarta Sans` for all UI controls, cards, and dense metadata.

## Layout

Hinthar Education E2E separates everyday platform navigation from distraction-free past-paper practice through two sibling Next.js App Router shells:

- **Standard App Shell (`src/app/(app)/layout.tsx`):**
  - **Desktop Left Sidebar (`<AppSidebar />`):** Sticky full-height rail (`240px` / `w-60` expanded, `64px` / `w-16` icon-only collapsed, persisted via `e2e_sidebar_collapsed` in `useUIStore`), hidden below `md` (`768px`). Groups routes into **Workspace**, **My Library** (with live `X/3` counters), and role-gated **Staff Studio**.
  - **Slim Top Context Bar (`<AppTopBar />`):** Sticky `56px` (`h-14`) translucent bar (`bg-background/85 backdrop-blur-md`) housing mobile drawer button, context breadcrumb, centered `⌘K` / `Ctrl+K` Command Palette trigger (`max-w-md`), manual cold-start refresh button, and contextual primary `+ Create` CTA, with sanction/warning banners stacked above when active.
  - **Main Work Canvas (`<main id="main-content">`):** Centered `max-w-7xl` container with responsive horizontal padding (`px-4 sm:px-6 lg:px-8`), `py-6`, and `pb-24 md:pb-8` bottom clearance for `<MobileBottomNav />` (`md:hidden`, `min-h-[56px]` 5-tab bar with safe-area bottom inset). `AdminLayout` uses an inner `<div>` to preserve a single `<main>` landmark per route.
  - **Operate vs. Read Containers:** Feeds, hubs, shelves, resources, search, and admin surfaces span `max-w-7xl` (with `hidden xl:block w-72 shrink-0` right contextual rails on `/problems` and `/forum` at `>= 1280px`). Lesson readers, thread details, settings, and `/*/new` or `/edit` authoring studios constrain prose to `max-w-3xl`.
  - **Sticky Filter Strip (`<HorizontalFilterBar />`):** Sits horizontally above feeds (`Level`, `Subject`, `Type`, `Status`, `State`, `Tags`, removable active filter pills, and right-aligned `ContentSortToggle` / action slots).
- **Fullscreen Practice Workspace (`src/app/(workspace)/layout.tsx`):**
  - Dedicated exclusively to `/train/[resourceId]` with zero shell chrome, hosting dual Question Paper / Mark Scheme PDF panes, `TrainTopBar`, `TimerWidget`, `CurriculumTreeSidebar`, and `AskInSolveModal`.

- **Spacing Rhythm:** Base `4px` scale (`xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 20px`, `xl: 24px`, `2xl: 32px`), with `20px` (`p-5`) standard card padding (`24px` on `editorial` sm+ cards) and `32px` (`mb-8`) below `PageHeader`.

## Elevation & Depth

Surfaces rely primarily on **crisp `1px` warm stone borders and subtle tonal contrast** between canvas (`--background`) and paper (`--card`), reinforced by restrained ambient shadows that intensify smoothly on card hover and modal elevation.

### Shadow Vocabulary
- **Subtle Control Lift (`--shadow-sm`):** `0 1px 2px 0 rgb(28 25 23 / 0.05)` (dark: `0 1px 2px 0 rgb(0 0 0 / 0.28)`) — editorial cards at rest, search trigger, and subtle surface pills.
- **Resting Card Elevation (`--shadow-card`):** `0 1px 3px 0 rgb(28 25 23 / 0.07), 0 1px 2px -1px rgb(28 25 23 / 0.05)` (dark: `0 2px 6px -1px rgb(0 0 0 / 0.32), 0 1px 3px -1px rgb(0 0 0 / 0.24)`) — default feed cards, `ProblemCard`, and right-rail panels.
- **Card Hover Lift (`--shadow-card-hover`):** `0 10px 24px -6px rgb(28 25 23 / 0.11), 0 4px 10px -4px rgb(28 25 23 / 0.06)` (dark: `0 12px 28px -6px rgb(0 0 0 / 0.48), 0 4px 12px -4px rgb(0 0 0 / 0.3)`) — paired with `hover:border-primary/35` on interactive cards (`duration-200`).
- **Modal & Overlay (`--shadow-modal`):** `0 20px 30px -8px rgb(28 25 23 / 0.18), 0 8px 12px -6px rgb(28 25 23 / 0.1)` (dark: `0 24px 36px -8px rgb(0 0 0 / 0.56), 0 10px 16px -6px rgb(0 0 0 / 0.4)`) — popovers, dropdown menus, and dialogs over `bg-black/80 backdrop-blur-xs` scrims.

**The Flat-By-Default Rule.** Restrained single-layer surfaces never stack shadows inside shadows; nested containers inside cards use `Card variant="flat"` (`bg-card/75 shadow-none`) or tonal `bg-muted/25` wells separated by `1px` borders.

## Shapes

Derived from `--radius: 0.625rem` (`10px`) in `src/app/globals.css`, form geometry balances crisp architectural edges with approachable softness:
- **Micro (`6px` / `rounded-sm`):** Inline `<kbd>` shortcut caps and `icon-xs` buttons.
- **Compact Controls (`8px` / `rounded-md` & `rounded-lg`):** Standard buttons, `Input`, `Select`, `Textarea`, sidebar navigation links, and filter chip triggers (`8px–10px`).
- **Containers & Overlays (`14px` / `rounded-xl`):** Feed cards, `Card` variants, `EmptyState` dashed panels (`border-dashed`), right contextual rails, `DialogContent`, and split-rail `ProblemCard` containers (`overflow-hidden`).
- **Pills & Status (`9999px` / `rounded-full`):** `Badge`, `TagBadge`, `ContributorBadge`, user avatars, and `EmptyState` icon wells.
- **Structural Accents:** Threaded comment hierarchies are scoped inside `.comment-module-v2` (`src/components/features/comments/comment-module-v2.css`) with a `1.5px` vertical thread guide rail (`--cm-thread-line`), compact single-layer cards (`--cm-card-pad-y`/`x`), and footer-aligned overflow/staff controls (`.cm-footer-controls`). Active mobile tabs mark selection with a `2px` top emerald indicator bar (`h-0.5 rounded-full bg-primary`).

## Components

Every primitive is implemented in `src/components/ui/` and `src/components/layout/` using `@base-ui/react`, `class-variance-authority`, and `lucide-react`.

### Buttons
Tactile, unambiguous, and keyboard-safe with `duration-150 ease-out` transitions and subtle `active:scale-[0.99]` press feedback.
- **Shape:** Gently rounded control edges (`8px`–`10px`, `rounded-lg` on default/lg/icon; `6px`–`8px` on `xs`/`sm`).
- **Primary (`default`):** `bg-primary` (`oxford-emerald`), `text-primary-foreground`, `shadow-xs`, `px-4` (`h-10 min-h-[40px]`); `h-12 px-6` (`lg`), `h-8 px-3` (`sm`), `h-7 px-2` (`xs`), `44×44px` minimum touch box on mobile `icon` buttons (`md:min-h-[40px]`).
- **Hover / Focus:** `hover:bg-primary/90`; `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`.
- **Secondary / Outline / Ghost / Destructive / Link:** `secondary` (`warm-alabaster` with subtle border), `outline` (`bright-paper` card fill + `--input` stroke), `ghost` (`muted-foreground` transitioning to `bg-muted/80`), `destructive` (`academic-crimson`), and `link` (`text-primary` underline on hover).

### Chips
Compact pill indicators (`rounded-full`, `h-5`, `px-2 py-0.5`, `text-xs font-medium`) that separate taxonomy, lifecycle warnings, and contributor standing at a glance.
- **Status Badges (`<Badge />`):** `default` (soft emerald `bg-primary/10 text-primary border-primary/25`), `secondary`, `outline`, `destructive`, and `warning` (`bg-warning/10 text-warning border-warning/30` for 30-day Forum TTL `Expires in Xd` notices); `FINAL` 48h locked problem states use `border-chart-3/40 bg-chart-3/10 text-chart-3`.
- **Taxonomy Tags (`<TagBadge />`):** Monospace `#name` pills (`bg-secondary/70 border-border text-muted-foreground`), clamped to max 3 visible tags per feed card, shifting to `bg-accent text-accent-foreground border-primary/35` on hover and navigating to `/tags/[name]` without bubbling parent card clicks.
- **Contributor Standing (`<ContributorBadge />`):** Interactive tier pills (`sm: 18px`, `md: 22px`, `lg: 28px`) pairing Lucide tier icons (`Shield`, `Award`, `Zap`, `Crown`, `Sparkles`) with `--tier-0..4` tokens and `.animate-scholar-shimmer` on Tier 4 (`Scholar Fellow`).

### Cards / Containers
Calm archival paper containers with single-layer construction and clear typography hierarchy.
- **Corner Style:** Softly rounded frame (`14px` / `rounded-xl`).
- **Background:** `bright-paper` (`bg-card`) on `default` and `editorial` variants; `bg-card/75` on `flat` inset surfaces.
- **Shadow Strategy:** `shadow-card` -> `shadow-card-hover` (`default`), `shadow-sm` -> `shadow-card` (`editorial`), `shadow-none` (`flat`); see Elevation & Depth.
- **Border:** `1px solid` `--border`, shifting to `border-primary/35` on hover for `default` and `editorial` variants.
- **Internal Padding:** `20px` (`p-5`) default; `20px` mobile / `24px` (`sm:p-6`) desktop on `editorial`.

### Inputs / Fields
Crisp, full-width form surfaces sized to prevent mobile zoom (`text-base sm:text-sm`) with clear validation states.
- **Style:** `1px` `--input` border on `bg-card`, `8px–10px` radius (`rounded-lg`), `min-h-[44px] sm:min-h-[40px]` (`default`), `36px` (`sm`), `48px` (`lg`), and `min-h-[108px]` on `Textarea`. Paired with `<Select />`, `<Field />` (label + description + inline error), `<TagInput />` (max 3 tags), and `<FileDropzone />`.
- **Focus:** `border-primary` with `ring-2 ring-primary/20` (`duration-150` color transition).
- **Error / Disabled:** `aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20`; disabled reduces opacity to `50%` with `cursor-not-allowed`.

### Navigation
Dual-breakpoint shell pairing a collapsible desktop rail (`AppSidebar`) with a 5-tab mobile bottom bar (`MobileBottomNav`) and sticky filter strip (`HorizontalFilterBar`).
- **Desktop Sidebar (`AppSidebar`):** `w-60` (`240px`) expanded / `w-16` (`64px`) collapsed over `bg-sidebar` (`warm-stone-rail`) with `border-r border-sidebar-border`. Active items receive `bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-primary/20 shadow-2xs` with emerald icon tint.
- **Top Context Bar (`AppTopBar`):** `h-14` (`56px`) sticky translucent header with breadcrumb, `⌘K`/`Ctrl+K` search button (`h-9 rounded-lg border bg-card/80`), cold-start refresh button, and route-contextual `+ Create` CTA.
- **Filter Strip (`HorizontalFilterBar`):** Sticky multi-select popover chips (`min-h-[44px] sm:min-h-[34px] rounded-lg`) highlighting active selections with `border-primary/40 bg-primary/10 text-primary font-semibold`.
- **Mobile Bottom Bar (`MobileBottomNav`):** Fixed `md:hidden` 5-column bar (`bg-background/95 backdrop-blur-md`, `min-h-[56px]`, `11px` labels) marking the active tab with a `2px` top emerald bar (`bg-primary`).

### Academic Challenge Ticket (`ProblemCard`)
Signature asymmetric card for `Solve!` (`/problems`) combining peer voting, 7-slot pool capacity, and past-paper provenance in one scannable row.
- **Structure:** `flex-col sm:flex-row rounded-xl border bg-card shadow-card overflow-hidden`. Left rail (`sm:w-20`, `bg-muted/25`, `border-b sm:border-b-0 sm:border-r`) stacks the `44×44px` `ChevronUp` upvote button (`ProblemCardVote`) above the `X/7 slots` `font-mono tabular-nums` pool meter; right body holds Path B Past Paper provenance pill (`Open in Train!`), body excerpt, max 3 `<TagBadge />` pills, author standing, and inline save/more actions.

### Modals & Overlays (`Dialog`)
- **Overlay:** `bg-black/80` with `backdrop-blur-xs` and fast `100ms` fade/zoom entrance.
- **Panel:** `bg-popover rounded-xl p-4 ring-1 ring-foreground/10 sm:max-w-sm` (or wider per feature modal) with top-right `icon-sm` close trigger and `Escape` dismissal.

## Do's and Don'ts

### Do:
- **Do** consume semantic Tailwind tokens (`bg-card`, `text-foreground`, `border-border`, `text-primary`) and CSS custom properties (`var(--chart-1..5)`) exclusively; never hardcode hex, `rgb()`, or inline `oklch()` strings in components.
- **Do** apply `font-mono tabular-nums` to all vote counts, `X/7` solution pool gauges, `X/3` library meters, point deltas, and `Train!` timers.
- **Do** preserve `44×44px` (`min-h-[44px] min-w-[44px]`) touch targets on mobile controls, bottom nav tabs, upvote rail buttons, and inline comment reply triggers.
- **Do** separate Operate Mode (`max-w-7xl` feeds, hubs, shelves, admin) from Read & Authoring Mode (`max-w-3xl` articles, problem threads, creation studios) and keep a single `<main id="main-content">` landmark per route.
- **Do** use `lucide-react` exclusively for all UI iconography, status indicators, and tier emblems, and respect `@media (prefers-reduced-motion: reduce)`.
- **Do** clamp feed card tags to max 3 `<TagBadge />` items and enforce `X/3` capacity indicators and empty-collection guards on Study Plans and Saved Sessions.

### Don't:
- **Don't** nest cards inside cards or place floating negative-margin delete buttons over card thumbnails; use `Card variant="flat"` or inline metadata action rows instead.
- **Don't** render decorative emojis anywhere in UI chrome, status banners, tier badges, or empty states.
- **Don't** use `Newsreader` (`font-display`) for body paragraphs, table cells, form labels, or button captions; reserve it strictly for display, shelf, and empty-state titles.
- **Don't** introduce raw unstyled browser `<select>` elements; use `<Select />` (`src/components/ui/select.tsx`) for consistent focus rings and `aria-invalid` error styling.
- **Don't** hardcode light-only or dark-only ink assumptions (such as `text-slate-900` or `bg-white`); every surface must remain legible across both Warm Archival Paper and Deep Library Obsidian themes.
