# Design Tokens Specification

> **Status:** Authoritative Design Token Single Source of Truth (**Warm Editorial Academic**, Phases 1–5)
> **Target Files:** `src/app/globals.css`, `src/app/layout.tsx`
> **Color Space:** OKLCH (Perceptually Uniform Contrast)
> **Framework:** Tailwind CSS v4 (`@theme inline`)

---

## 1. Color System Architecture

All color tokens in Hinthar Education E2E are authored in **OKLCH** inside `src/app/globals.css`. Components consume Tailwind v4 semantic utility classes (`bg-card`, `text-foreground`, `border-border`, `text-primary`, `bg-warning/10`, etc.) or CSS custom properties (`var(--chart-1..5)`)—never raw hex, `rgb()`, or inline `oklch()` strings.

### 1.1 Core Semantic Token Palette

#### Light Mode (`:root` — Warm Editorial Academic)

| CSS Variable | OKLCH Value | Role / Usage |
| :--- | :--- | :--- |
| `--background` | `oklch(0.978 0.006 85)` | Warm ivory parchment canvas (`#FAF8F3` equiv.) |
| `--foreground` | `oklch(0.19 0.015 250)` | Deep slate charcoal ink (`#19202B` equiv.) |
| `--card` | `oklch(0.996 0.003 85)` | Crisp bright paper cards (`#FFFEFB` equiv.) |
| `--card-foreground` | `oklch(0.19 0.015 250)` | Body and header text inside cards |
| `--popover` | `oklch(0.998 0.002 85)` | Elevated menus, tooltips, dialogs |
| `--popover-foreground` | `oklch(0.19 0.015 250)` | Text inside popover elements |
| `--primary` | `oklch(0.45 0.115 162)` | Oxford academic emerald brand accent |
| `--primary-foreground` | `oklch(0.99 0.004 85)` | Text on primary buttons ($\ge 4.5:1$) |
| `--secondary` | `oklch(0.945 0.008 85)` | Warm alabaster subtle surfaces & secondary controls |
| `--secondary-foreground` | `oklch(0.24 0.015 250)` | Text on secondary surfaces |
| `--muted` | `oklch(0.945 0.008 85)` | Skeleton loaders, quiet pill backgrounds |
| `--muted-foreground` | `oklch(0.46 0.014 250)` | Subtitles, meta tags, timestamps ($\ge 4.5:1$) |
| `--accent` | `oklch(0.935 0.025 162)` | Selected item highlights, active tabs |
| `--accent-foreground` | `oklch(0.25 0.04 162)` | Text on accent surfaces |
| `--border` | `oklch(0.895 0.009 85)` | Warm stone card borders & structural dividers |
| `--input` | `oklch(0.88 0.009 85)` | Form input borders |
| `--ring` | `oklch(0.45 0.115 162)` | Accessible keyboard focus ring |
| `--destructive` | `oklch(0.56 0.21 25)` | Error alerts, ban banners, destructive actions |
| `--destructive-foreground` | `oklch(0.99 0 0)` | Text on destructive elements |
| `--warning` | `oklch(0.55 0.15 62)` | Expiration badges (30d TTL), caution callouts |
| `--sidebar` | `oklch(0.965 0.007 85)` | Left navigation rail surface |

#### Dark Mode (`.dark` — Deep Warm Slate)

| CSS Variable | OKLCH Value | Role / Usage |
| :--- | :--- | :--- |
| `--background` | `oklch(0.155 0.008 250)` | Deep warm slate canvas |
| `--foreground` | `oklch(0.955 0.006 85)` | Warm parchment primary text |
| `--card` | `oklch(0.205 0.01 250)` | Elevated dark card surfaces |
| `--card-foreground` | `oklch(0.955 0.006 85)` | Text inside cards |
| `--popover` | `oklch(0.225 0.011 250)` | Elevated menus and modal dialogs |
| `--popover-foreground` | `oklch(0.955 0.006 85)` | Text inside popover elements |
| `--primary` | `oklch(0.66 0.13 162)` | Luminous academic emerald for dark theme |
| `--primary-foreground` | `oklch(0.14 0.015 162)` | Dark contrasting text on primary |
| `--secondary` | `oklch(0.255 0.01 250)` | Secondary button surfaces in dark mode |
| `--secondary-foreground` | `oklch(0.93 0.006 85)` | Text on dark secondary surfaces |
| `--muted` | `oklch(0.24 0.009 250)` | Dark skeleton loaders, inactive tabs |
| `--muted-foreground` | `oklch(0.70 0.012 85)` | Subtitles, meta tags, timestamps |
| `--accent` | `oklch(0.265 0.025 162)` | Active subnav pills, subtle hover fills |
| `--accent-foreground` | `oklch(0.94 0.012 162)` | Text on dark accent elements |
| `--border` | `oklch(0.285 0.01 250)` | Visible card borders |
| `--input` | `oklch(0.30 0.01 250)` | Form input borders |
| `--ring` | `oklch(0.66 0.13 162)` | Keyboard focus ring |
| `--destructive` | `oklch(0.65 0.20 25)` | Error states and destructive buttons |
| `--destructive-foreground` | `oklch(0.99 0 0)` | Text on destructive elements |
| `--warning` | `oklch(0.76 0.15 72)` | Expiration countdowns, advisory badges |
| `--sidebar` | `oklch(0.135 0.008 250)` | Dark navigation rail surface |

---

### 1.2 Contributor Tier Progression & Chart Tokens

The 5 contributor tiers dictate voting weight multipliers (`1×` to `5×`) and community peer-review authority via `--tier-0`..`--tier-4` and `--tier-0-bg`..`--tier-4-bg`:

- **Tier 0 (`1×`):** Novice (Neutral Stone/Slate)
- **Tier 1 (`2×`):** Bronze Explorer (Amber)
- **Tier 2 (`3×`):** Silver Solver (Sky — unlocks 7-slot eviction override)
- **Tier 3 (`4×`):** Gold Master (Emerald)
- **Tier 4 (`5×`):** Scholar Fellow (Royal Violet + `animate-scholar-shimmer`)

Analytics charts and `FINAL` consensus states consume semantic chart variables (`var(--chart-1)` through `var(--chart-5)`), never hardcoded hex values.

---

### 1.3 Backward Compatibility Mapping

Legacy prototype tokens remain mapped to canonical tokens in `src/app/globals.css`, while Phase 5 migrated all active screens to semantic classes (`text-foreground`, `bg-card`, `border-border`, `text-primary`):

- `--brand` → `var(--primary)`
- `--brand-soft` → `var(--accent)`
- `--surface` → `var(--background)`
- `--surface-raised` → `var(--card)`
- `--ink` → `var(--foreground)`
- `--ink-muted` → `var(--muted-foreground)`
- `--line` → `var(--border)`
- `--danger` → `var(--destructive)`

---

## 2. Typography Token Pipeline

Configured in `src/app/layout.tsx` and bound in `src/app/globals.css`:

- **Editorial Display (`font-display` — `Newsreader`):** PageHeader display titles, Home Hub hero greeting, Curriculum shelf titles, long-form article headers.
- **UI & Subheadings (`font-heading`, `font-sans` — `Plus Jakarta Sans`):** Card titles (`CardTitle`), navigation links, buttons, form controls, body copy (`text-sm leading-relaxed`), descriptions.
- **Monospace (`font-mono` — `Geist Mono`):** Syllabus codes (`9709`, `9702`), numeric counters (`font-mono tabular-nums`), `X/7` / `X/3` slot telemetry, timers, keyboard shortcuts (`⌘K`).

### Typographic Hierarchy Scale

| Token Class | Role | Weight | Notes |
| :--- | :--- | :--- | :--- |
| `font-display text-2xl sm:text-3xl` | Display Headline / Page Header | `600` (`font-semibold`) | Tight tracking (`tracking-tight`) |
| `font-heading text-lg` | Section / Dialog Title | `600` | Editorial card & modal headers |
| `font-heading text-base` | Feed Card Title | `600` | Scannable challenge / post headline |
| `text-sm` (`leading-relaxed`) | Primary Body Copy | `400` | Excerpts, comments, explanations |
| `text-xs font-medium` | Chips, Author Meta & Filter Pills | `500` | Status pills, timestamps, nav items |
| `text-[10px]` / `text-[11px]` | Micro Eyebrows & Telemetry | `500–600` | `font-mono` syllabus codes, slot badges (`X/7`), `OP`/`ACCEPTED`, mobile tab labels |

---

## 3. Elevation, Shadows & Radii

- **Shadow Tokens (`@theme inline`):**
  - `--shadow-sm`: Subtle separation on filter chips, tag pills, and inputs.
  - `--shadow-card`: Resting card surface elevation.
  - `--shadow-card-hover`: Smooth hover lift (`hover:border-primary/35 hover:shadow-card-hover`).
  - `--shadow-modal`: Popovers, menus, and dialogs.
- **Radii:** `rounded-sm` (`<kbd>`), `rounded-md` (pills, tags, badges), `rounded-lg` (inputs, standard buttons), `rounded-xl` (feed cards, right rail panels, modals), `rounded-full` (avatars, status indicators).
