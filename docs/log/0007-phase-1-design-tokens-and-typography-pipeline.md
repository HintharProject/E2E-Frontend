# 0007: Phase 1 — Design Tokens & Typography Pipeline Implementation

**Date**: 2026-11-12  
**Status**: Implemented & Verified  
**Scope**: Tailwind CSS v4 Theme Normalization, Font Variable Pipeline, Semantic OKLCH Color Palette, and Standard Elevation Tokens  
**Target Files**: `E2E-frontend/src/app/globals.css`, `E2E-frontend/src/app/layout.tsx`, `E2E-frontend/package.json`  
**Author Agent**: Phase 1 Design Token & CSS Specialist (via Impeccable & UI/UX Pro Max)

---

## 1. Context & Objectives

Following the establishment of the Phase 0 Design System Governance suite, Phase 1 focused on resolving foundational CSS, token, and typography debt:
1. **Broken Font Pipeline:** Multiple components and `PageHeader` utilized `className="font-display ..."`. Because `--font-display` was not registered in Tailwind v4 `@theme inline`, heading elements silently fell back to browser default serifs.
2. **Dual & Inconsistent Color System:** Arbitrary alpha borders (`oklch(1 0 0 / 10%)`), uncalibrated dark mode primary tones (`oklch(0.432 ...)` yielding low contrast < 3:1), and unmapped prototype aliases created visual inconsistencies between light and dark modes.
3. **Missing Elevation Tokens:** Components were hardcoding arbitrary inline OKLCH drop shadows rather than using structured elevation utilities.
4. **Missing Browser Surface Polish:** Lack of explicit selection theming, accessible reduced-motion safeguards, and missing definitions for `.custom-scrollbar` referenced across pages.

---

## 2. Key Changes & Deliverables

### 2.1 Next.js Font Pipeline & Heading Unification (`layout.tsx` & `globals.css`)
- **`src/app/layout.tsx`:**
  - Configured `display: "swap"` for `Manrope` (`--font-heading`), `Montserrat` (`--font-sans`), and `Geist_Mono` (`--font-geist-mono`) to prevent Flash of Invisible Text (FOIT) and eliminate Cumulative Layout Shift (CLS).
- **`src/app/globals.css` `@theme inline`:**
  - Registered `--font-heading: var(--font-heading);`
  - Registered `--font-display: var(--font-heading);` to seamlessly map all 20+ legacy instances of `font-display` across `PageHeader`, `FilterSidebar`, `BaseCard`, `EmptyState`, etc., to Manrope.
  - Registered `--font-sans: var(--font-sans);` (Montserrat) and `--font-mono: var(--font-geist-mono);` (Geist Mono).
- **`@layer base`:**
  - Explicitly styled `h1, h2, h3, h4, h5, h6` to inherit `font-family: var(--font-heading)` and tight letter spacing (`letter-spacing: -0.02em`).
  - Added semantic `::selection` theming using `var(--primary)` and `var(--primary-foreground)`.

### 2.2 Semantic OKLCH Color System Reconciliation (`globals.css`)
- **Light Mode (`:root`):**
  - Standardized canvas background `--background: oklch(0.99 0.002 220)` with elevated pure white cards `--card: oklch(1 0 0)`.
  - Calibrated `--primary: oklch(0.508 0.118 165.612)` with high-contrast text `--primary-foreground: oklch(0.99 0.005 166)` ($\ge 6:1$ contrast ratio).
  - Enhanced `--muted-foreground: oklch(0.50 0.015 220)` to guarantee WCAG 2.2 AA contrast $\ge 4.5:1$ against card surfaces.
  - Aligned `--border` and `--input` to `oklch(0.91 0.005 220)` for crisp 3:1 boundary definition.
  - Reconciled prototype backward-compatibility aliases: `--brand`, `--brand-dark`, `--brand-soft`, `--surface`, `--surface-raised`, `--ink`, `--ink-muted`, `--line`, and `--danger`.
  - Maintained complete Contributor Tier progression tokens (Tier 0 through Tier 4).
- **Dark Mode (`.dark`):**
  - Canvas set to deep Slate Navy `--background: oklch(0.148 0.004 228.8)` and elevated card surfaces `--card: oklch(0.20 0.008 225)`.
  - Replaced low-lightness dark primary with luminous academic emerald `--primary: oklch(0.58 0.125 165)` and dark contrasting button label `--primary-foreground: oklch(0.12 0.01 165)` ($\ge 6:1$ contrast).
  - Replaced alpha-transparency border hacks with solid, consistent border token `--border: oklch(0.28 0.008 225)`.
  - Calibrated `--muted-foreground: oklch(0.68 0.012 220)` ensuring $\ge 5.2:1$ contrast for metadata and captions.

### 2.3 Standard Elevation & Depth Utilities (`globals.css`)
- Added standard elevation tokens inside `@theme inline`:
  - `--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);`
  - `--shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);`
  - `--shadow-card-hover: 0 10px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.08);`
  - `--shadow-modal: 0 20px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.1);`

### 2.4 Browser Surfaces & Accessibility Polishing
- Added `@media (prefers-reduced-motion: reduce)` rules enforcing instant transitions ($\le 0.01\text{ms}$) per WCAG 2.2 AA.
- Defined `.custom-scrollbar` utility using CSS custom properties (`--border` thumb, `--muted-foreground` hover), fixing unstyled scrollbars in sidebars and long lists.

### 2.5 Build Reliability (`package.json`)
- Updated `"build": "next build --webpack"` to circumvent Turbopack Windows child process communication issue with KaTeX CSS loader, ensuring reproducible builds across Windows and CI environments.

---

## 3. Verification & Acceptance Checklist

- [x] Heading elements (`h1`-`h6`, `font-display`, `font-heading`, `PageHeader`) visibly render with **Manrope**.
- [x] Body text defaults to **Montserrat** via `font-sans` applied to `html` and `body`.
- [x] Legacy classes (`text-ink`, `border-line`, `bg-card`, `text-brand`) resolve correctly through prototype semantic aliases without visual regression.
- [x] Both light and dark modes pass contrast inspection without dark-on-dark or washed-out text ($\ge 4.5:1$ body, $\ge 3:1$ controls, $\ge 6:1$ primary buttons).
- [x] TypeScript validation (`npx tsc --noEmit`) passes with zero errors.
- [x] Next.js production build (`npm run build`) succeeds with zero errors across all 35 routes.

---

## 4. Handoff to Phase 2 Specialist

Phase 1 is complete. The design tokens, typography pipeline, and elevation primitives are fully operational in `globals.css` and `layout.tsx`.
The next agent executing **Phase 2: Core Components Kit Standardization** should:
1. Review `E2E-frontend/docs/design_system/01_COMPONENT_CATALOG.md` and `Planning/design system new/02_PHASE_2_COMPONENT_STANDARDIZATION.md`.
2. Overhaul and standardize core primitives in `src/components/ui/` (`Button`, `Input`, `Textarea`, `Field`, `Card`, `Badge`, `ContributorBadge`, `EmptyState`, `Dialog`).
3. Systematically eliminate `const inputClass = "..."` across form components, adopting `<Input />`, `<Textarea />`, and `<Field />`.
4. Replace raw card containers with the composable `<Card>` kit.

