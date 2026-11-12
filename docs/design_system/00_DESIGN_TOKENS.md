# Design Tokens Specification

> **Status:** Authoritative Design Token Single Source of Truth  
> **Target Files:** `src/app/globals.css`, `src/app/layout.tsx`  
> **Color Space:** OKLCH (Perceptually Uniform, Wide Gamut, Predictable Contrast)  
> **Framework:** Tailwind CSS v4 (`@theme inline`)

---

## 1. Color System Architecture

All color tokens in Hinthar Education E2E are authored in **OKLCH**. OKLCH decouples Lightness ($L$), Chroma ($C$), and Hue ($H$), allowing exact mathematical contrast calibration between light and dark themes.

### 1.1 Core Semantic Token Palette

These tokens represent the primary surfaces, text layers, and functional accents used across standard UI components:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SURFACE HIERARCHY                              │
│                                                                        │
│   Page Background: var(--background)                                  │
│   ├── Card / Content Panel: var(--card) + border: var(--border)       │
│   │   ├── Heading: var(--foreground)                                   │
│   │   ├── Subtitle / Meta: var(--muted-foreground)                    │
│   │   └── Interactive Primary: var(--primary)                         │
│   └── Elevated Popover / Modal: var(--popover)                         │
└────────────────────────────────────────────────────────────────────────┘
```

#### Light Mode (`:root`) Token Definitions

| CSS Variable | OKLCH Value | Approximate Hex | Role / Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.99 0.002 220)` | `#fafbfc` | Platform canvas background |
| `--foreground` | `oklch(0.18 0.015 230)` | `#192028` | Primary text (WCAG AAA contrast 14:1) |
| `--card` | `oklch(1 0 0)` | `#ffffff` | Content cards, feed items, sidebars |
| `--card-foreground` | `oklch(0.18 0.015 230)` | `#192028` | Body and header text inside cards |
| `--popover` | `oklch(1 0 0)` | `#ffffff` | Menus, tooltips, dialogs |
| `--popover-foreground`| `oklch(0.18 0.015 230)` | `#192028` | Text inside popover elements |
| `--primary` | `oklch(0.508 0.118 165.612)` | `#027a60` | Academic Emerald Brand primary |
| `--primary-foreground`| `oklch(0.99 0.005 166)` | `#f5fdf9` | Text on primary buttons (contrast $\ge 6:1$) |
| `--secondary` | `oklch(0.96 0.005 220)` | `#f1f4f6` | Secondary button surfaces, subtle pills |
| `--secondary-foreground`| `oklch(0.22 0.015 230)` | `#212933` | Text on secondary buttons |
| `--muted` | `oklch(0.955 0.005 220)` | `#f0f3f5` | Skeleton loaders, disabled pills |
| `--muted-foreground` | `oklch(0.50 0.015 220)` | `#637080` | Subtitles, meta tags, timestamps ($\ge 4.5:1$) |
| `--accent` | `oklch(0.95 0.01 166)` | `#eef8f4` | Selected item highlights, active tabs |
| `--accent-foreground`| `oklch(0.22 0.02 166)` | `#143d2f` | Text on accent surfaces |
| `--border` | `oklch(0.91 0.005 220)` | `#e2e7ec` | Card borders, structural dividers |
| `--input` | `oklch(0.91 0.005 220)` | `#e2e7ec` | Form input borders |
| `--ring` | `oklch(0.508 0.118 165.612)` | `#027a60` | Accessible keyboard focus ring |
| `--destructive` | `oklch(0.58 0.22 25)` | `#d92635` | Error alerts, ban banners, deletions |
| `--destructive-foreground`| `oklch(0.99 0 0)` | `#ffffff` | Text on destructive elements |
| `--warning` | `oklch(0.72 0.16 70)` | `#d97706` | Expiration badges (30d TTL), warnings |

#### Dark Mode (`.dark`) Token Definitions

| CSS Variable | OKLCH Value | Approximate Hex | Role / Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.148 0.004 228.8)` | `#11161d` | Dark Slate Navy canvas background |
| `--foreground` | `oklch(0.97 0.005 220)` | `#f4f6f8` | Primary text (WCAG AAA contrast 13:1) |
| `--card` | `oklch(0.20 0.008 225)` | `#19222c` | Elevated dark card surfaces |
| `--card-foreground` | `oklch(0.97 0.005 220)` | `#f4f6f8` | Text inside cards |
| `--popover` | `oklch(0.20 0.008 225)` | `#19222c` | Elevated menus and modal dialogs |
| `--popover-foreground`| `oklch(0.97 0.005 220)` | `#f4f6f8` | Text inside popover elements |
| `--primary` | `oklch(0.58 0.125 165)` | `#169b7c` | Luminous academic emerald for dark theme |
| `--primary-foreground`| `oklch(0.12 0.01 165)` | `#0b1a15` | Dark contrasting text on primary |
| `--secondary` | `oklch(0.25 0.008 225)` | `#232d39` | Secondary button surfaces in dark mode |
| `--secondary-foreground`| `oklch(0.95 0.005 220)` | `#eef1f4` | Text on dark secondary surfaces |
| `--muted` | `oklch(0.24 0.008 225)` | `#212b36` | Dark skeleton loaders, inactive tabs |
| `--muted-foreground` | `oklch(0.68 0.012 220)` | `#97a6b6` | Subtitles, meta tags, timestamps ($\ge 5.2:1$) |
| `--accent` | `oklch(0.25 0.02 165)` | `#1d332c` | Active subnav pills, subtle hover fills |
| `--accent-foreground`| `oklch(0.95 0.01 165)` | `#ebfaf4` | Text on dark accent elements |
| `--border` | `oklch(0.28 0.008 225)` | `#2b3644` | Crisp, visible card borders |
| `--input` | `oklch(0.28 0.008 225)` | `#2b3644` | Form input borders |
| `--ring` | `oklch(0.58 0.125 165)` | `#169b7c` | Keyboard focus ring |
| `--destructive` | `oklch(0.65 0.20 25)` | `#f04452` | Error states and destructive buttons |
| `--destructive-foreground`| `oklch(0.99 0 0)` | `#ffffff` | Text on destructive elements |
| `--warning` | `oklch(0.75 0.16 70)` | `#f59e0b` | Expiration countdowns, advisory badges |

---

### 1.2 Contributor Tier Progression Tokens

The 5 contributor tiers dictate voting weight multipliers ($1\times$ to $5\times$) and community peer-review authority. Each tier features dedicated text and background tokens:

```
Tier 0 (1x)       Tier 1 (2x)       Tier 2 (3x)       Tier 3 (4x)       Tier 4 (5x)
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│   SLATE   │ ──> │   AMBER   │ ──> │    SKY    │ ──> │  EMERALD  │ ──> │  SCHOLAR  │
│  Novice   │     │  Explorer │     │  Solver   │     │  Master   │     │  Fellow   │
└───────────┘     └───────────┘     └───────────┘     └───────────┘     └───────────┘
```

| Tier Level | Multiplier | Light Mode Text | Light Mode Bg | Dark Mode Text | Dark Mode Bg |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Tier 0** (Novice) | $1\times$ | `oklch(0.55 0.015 220)` | `oklch(0.96 0.005 220)` | `oklch(0.70 0.015 220)` | `oklch(0.24 0.01 220)` |
| **Tier 1** (Explorer) | $2\times$ | `oklch(0.62 0.16 65)` | `oklch(0.96 0.04 65)` | `oklch(0.75 0.16 65)` | `oklch(0.26 0.05 65)` |
| **Tier 2** (Solver) | $3\times$ | `oklch(0.58 0.15 230)` | `oklch(0.95 0.04 230)` | `oklch(0.72 0.15 230)` | `oklch(0.25 0.05 230)` |
| **Tier 3** (Master) | $4\times$ | `oklch(0.55 0.18 150)` | `oklch(0.95 0.04 150)` | `oklch(0.70 0.18 150)` | `oklch(0.24 0.05 150)` |
| **Tier 4** (Scholar) | $5\times$ | `oklch(0.52 0.22 300)` | `oklch(0.95 0.05 300)` | `oklch(0.70 0.22 300)` | `oklch(0.26 0.06 300)` |

---

### 1.3 Backward Compatibility Mapping

To allow phased migration without breaking unmigrated screens, prototype semantic aliases are bound to the new canonical tokens in `src/app/globals.css`:

```css
/* Prototype Semantic Aliases (Preserves backward compatibility) */
--brand: var(--primary);
--brand-dark: oklch(0.42 0.11 165);
--brand-soft: var(--accent);
--surface: var(--background);
--surface-raised: var(--card);
--ink: var(--foreground);
--ink-muted: var(--muted-foreground);
--line: var(--border);
--danger: var(--destructive);
```

---

## 2. Typography Token Pipeline

```
  ┌────────────────────────────────────────────────────────┐
  │                 NEXT.JS FONT PIPELINE                  │
  │                                                        │
  │  layout.tsx:                                           │
  │  ├── Manrope      ──> --font-heading                   │
  │  ├── Montserrat   ──> --font-sans                      │
  │  └── Geist Mono   ──> --font-geist-mono                │
  │                                                        │
  │  globals.css (@theme inline):                          │
  │  ├── --font-heading: var(--font-heading)               │
  │  ├── --font-display: var(--font-heading)  [FIX ALIAS]  │
  │  ├── --font-sans:    var(--font-sans)                  │
  │  └── --font-mono:    var(--font-geist-mono)            │
  └────────────────────────────────────────────────────────┘
```

### 2.1 Typeface Assignments

- **Headings & Display (`font-heading`, `font-display`):** `Manrope, sans-serif`  
  Geometric, confident, clean legibility for academic titles and card headings.
- **Body & Controls (`font-sans`):** `Montserrat, sans-serif`  
  Neutral, human, high readability at small text sizes ($12\text{px}$–$14\text{px}$).
- **Monospace (`font-mono`):** `Geist Mono, monospace`  
  Curriculum codes, KaTeX math expressions, transaction IDs, keyboard shortcuts.

### 2.2 Typographic Hierarchy Scale

| Token Class | Desktop Size / Leading | Mobile Size / Leading | Weight | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| `text-4xl` | $36\text{px}$ / $44\text{px}$ | $30\text{px}$ / $36\text{px}$ | Bold (`700`) | `-0.025em` (`tracking-tight`) |
| `text-3xl` | $30\text{px}$ / $38\text{px}$ | $24\text{px}$ / $30\text{px}$ | Bold / SemiBold | `-0.02em` (`tracking-tight`) |
| `text-2xl` | $24\text{px}$ / $32\text{px}$ | $20\text{px}$ / $26\text{px}$ | SemiBold (`600`) | `-0.015em` |
| `text-xl` | $20\text{px}$ / $28\text{px}$ | $18\text{px}$ / $24\text{px}$ | SemiBold (`600`) | `-0.01em` |
| `text-lg` | $18\text{px}$ / $26\text{px}$ | $16\text{px}$ / $22\text{px}$ | SemiBold (`600`) | `0` |
| `text-base` | $16\text{px}$ / $24\text{px}$ | $15\text{px}$ / $22\text{px}$ | Medium / Regular | `0` |
| `text-sm` (Default Body) | $14\text{px}$ / $22\text{px}$ | $14\text{px}$ / $22\text{px}$ | Regular (`400`) | `0` (`leading-relaxed`) |
| `text-xs` (Meta/Chips) | $12\text{px}$ / $16\text{px}$ | $12\text{px}$ / $16\text{px}$ | Medium (`500`) | `0` |
| `text-[11px]` (Captions) | $11\text{px}$ / $14\text{px}$ | $11\text{px}$ / $14\text{px}$ | Medium (`500`) | `+0.01em` |

---

## 3. Elevation & Shadow Tokens

Instead of arbitrary inline shadow strings, elevation uses unified Tailwind shadow tokens:

```css
@theme inline {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 10px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.08);
  --shadow-modal: 0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

- **`shadow-sm`**: Subtle separation for input fields, filter chips, and tag pills.
- **`shadow-card`**: Standard resting state for content cards, forum posts, and solution items.
- **`shadow-card-hover`**: Smooth interactive hover state (`transition-all duration-200 hover:shadow-card-hover hover:border-primary/40`).
- **`shadow-modal`**: High elevation for modal dialogs and dropdown menus.

---

## 4. Radii & Shape Tokens

| Token | Computed Rem | Pixel Value | Applied Elements |
| :--- | :--- | :--- | :--- |
| `rounded-sm` | `0.25rem` | $4\text{px}$ | Keyboard badges (`<kbd>`), micro indicators |
| `rounded-md` | `0.375rem` | $6\text{px}$ | Filter pills, small action buttons, tag badges |
| `rounded-lg` | `0.5rem` | $8\text{px}$ | Form inputs, textareas, standard buttons, dropdown menus |
| `rounded-xl` | `0.75rem` | $12\text{px}$ | Feed cards, solution boxes, modal dialogs, sheets |
| `rounded-2xl`| `1.0rem` | $16\text{px}$ | Callout highlight banners |
| `rounded-full`| `9999px` | Pill | User avatars, tier multiplier pills, status dots |

---

## 5. Token Linting & Verification Checklist

When executing future phases, verify:
- [ ] No JSX file contains `oklch(...)` or `#[0-9a-fA-F]{3,6}` color strings.
- [ ] All headings render with Manrope (`font-heading`).
- [ ] Light mode contrast meets $\ge 4.5:1$ for body text and $\ge 3:1$ for UI controls.
- [ ] Dark mode cards are visibly elevated from the background canvas without harsh borders.

