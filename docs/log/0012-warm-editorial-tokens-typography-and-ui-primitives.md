# 0012: Warm Editorial Academic Tokens, Typography & Core UI Primitives

- **Date:** 2026-11-13
- **Status:** Implemented & Verified
- **Scope:** OKLCH palette calibration, `Newsreader` + `Plus Jakarta Sans` + `Geist Mono` typography pipeline, and `@/components/ui/` primitives upgrade
- **Target Files:**
  - `src/app/globals.css`
  - `src/app/layout.tsx`
  - `src/components/ui/page-header.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/ui/base-card.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/ui/tag-badge.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/textarea.tsx`
  - `src/components/ui/select.tsx`
  - `src/components/ui/sub-nav.tsx`
  - `src/components/ui/empty-state.tsx`
  - `src/components/ui/field.tsx`

---

## Summary of Changes

Established the **Warm Editorial Academic** visual foundation across light and dark themes, replaced `Montserrat` / `Manrope` with an editorial serif + UI sans + tabular mono pairing, and refined the core UI primitive kit in `src/components/ui/` without altering `src/hooks/`, `src/services/`, `src/lib/store/`, or `src/types/`.

### 1. OKLCH Color System & Elevation Tokens (`src/app/globals.css`)

- **Light Mode (`:root`):**
  - Warm archival paper canvas `--background: oklch(0.978 0.006 85)` paired with deep charcoal ink `--foreground: oklch(0.19 0.015 250)` and elevated ivory `--card: oklch(0.996 0.003 85)`.
  - Oxford/Forest emerald `--primary: oklch(0.45 0.115 162)` with `--primary-foreground: oklch(0.99 0.004 85)`.
  - Warm stone `--secondary` / `--muted` (`oklch(0.945 0.008 85)`), `--border` (`oklch(0.895 0.009 85)`), `--input` (`oklch(0.88 0.009 85)`), sage `--accent` (`oklch(0.935 0.025 162)`), and scholarly amber `--warning` (`oklch(0.55 0.15 62)`).
  - Dedicated sidebar surface `--sidebar: oklch(0.965 0.007 85)` with matching `--sidebar-*` semantic tokens.
- **Dark Mode (`.dark`):**
  - Deep library obsidian `--background: oklch(0.155 0.008 250)`, warm parchment ink `--foreground: oklch(0.955 0.006 85)`, and slate-charcoal `--card: oklch(0.205 0.01 250)`.
  - Luminous emerald `--primary: oklch(0.66 0.13 162)` with `--primary-foreground: oklch(0.14 0.015 162)`, `--border: oklch(0.285 0.01 250)`, `--input: oklch(0.30 0.01 250)`, and `--sidebar: oklch(0.135 0.008 250)`.
- **Compatibility & Browser Surfaces:**
  - Preserved all Contributor Tier tokens (`--tier-0` through `--tier-4` plus shimmer tokens) and backward-compatible aliases (`--brand`, `--brand-dark`, `--brand-soft`, `--surface`, `--surface-raised`, `--ink`, `--ink-muted`, `--line`, `--danger`).
  - Tuned warm-tinted `--shadow-sm`, `--shadow-card`, `--shadow-card-hover`, and `--shadow-modal` elevation variables, themed `caret-color: var(--primary)`, and enabled `text-wrap: balance` on headings.

### 2. Editorial Typography Pipeline (`src/app/layout.tsx` & `src/app/globals.css`)

- Loaded `Newsreader` (`--font-display`, normal and italic), `Plus_Jakarta_Sans` (`--font-sans`), and `Geist_Mono` (`--font-geist-mono`) via `next/font/google` with `display: "swap"`.
- Mapped `--font-sans` and `--font-heading` to `Plus Jakarta Sans`, `--font-display` to `Newsreader`, and `--font-mono` to `Geist Mono` inside `@theme inline`.

### 3. Core UI Primitives Upgrade (`src/components/ui/`)

- **`page-header.tsx`:** Added optional `eyebrow?: string` (`font-mono uppercase tracking-wider text-muted-foreground`) above a `font-display text-2xl sm:text-3xl font-semibold tracking-tight text-balance` heading.
- **`card.tsx` & `base-card.tsx`:** Added `variant?: "default" | "editorial" | "flat"` support across `Card`, `BaseFeedCard`, and `BaseDetailedCard`, refined hover border/elevation transitions (`hover:border-primary/35`), added `tabular-nums` metadata alignment, focus-visible rings on card links, and `[overflow-wrap:anywhere]` long-token wrapping.
- **`button.tsx`:** Added `cursor-pointer`, crisp border contrast on `outline` and `secondary` variants, `active:not-aria-[haspopup]:scale-[0.99]` micro-press feedback, and `--ring` / `--background` offset focus rings.
- **`badge.tsx` & `tag-badge.tsx`:** Normalized badge weight (`font-medium`) and `text-xs` legibility; refined `TagBadge` into neutral stone `#tag` chips (`bg-secondary/70`) with sage-emerald hover feedback.
- **`input.tsx`, `textarea.tsx`, `select.tsx`, & `field.tsx`:** Unified resting borders on `border-input`, enforced `min-h-[44px]` mobile / `min-h-[40px]` desktop sizing (`text-base sm:text-sm` to prevent mobile focus zoom), consistent `focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`, `aria-invalid` states, and `aria-live="polite"` error output in `Field`.
- **`sub-nav.tsx`:** Upgraded `"underline"` (flush bottom bar via `after:` pseudo-element) and `"pill"` (segmented control container) with `min-h-[44px]` / `40px` mobile touch targets.
- **`empty-state.tsx`:** Applied dashed stone border, `bg-muted/50` circular icon medallion, `font-display` heading, and centered action slot.

---

## Verification

1. **Impeccable Design Detector (`impeccable detect --json` across modified `.tsx` primitives):** Exited `0` (resolved `border-accent-on-rounded` on `sub-nav.tsx`; 1 intentional `11px` advisory remains on `page-header.tsx` eyebrow).
2. **TypeScript (`npx tsc --noEmit`):** Exited `0` with no errors.
3. **Production Build (`npm run build`):** Exited `0`; compiled cleanly and generated all `35/35` static routes.
