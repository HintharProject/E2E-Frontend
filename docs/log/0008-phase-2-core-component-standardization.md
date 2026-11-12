# 0008: Phase 2 — Core Component Standardization (The UI Kit)

**Date**: 2026-11-12  
**Status**: Implemented & Verified  
**Scope**: Core UI Primitives Overhaul, Complete Eradication of `inputClass`, Composable `<Card>` Primitive Kit, and Removal of Inline Raw OKLCH Shadows  
**Target Files**: 
- Primitives: `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/components/ui/field.tsx`, `src/components/ui/card.tsx`, `src/components/ui/base-card.tsx`, `src/components/ui/page-header.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/tag-badge.tsx`, `src/components/ui/contributor-badge.tsx`, `src/components/ui/fab.tsx`
- Forms & Features: `create-post-form.tsx`, `update-post-form.tsx`, `create-problem-form.tsx`, `update-problem-form.tsx`, `create-solution-form.tsx`, `update-solution-form.tsx`, `create-lesson-form.tsx`, `update-lesson-form.tsx`, `profile-form.tsx`, `post-comments.tsx`, `solution-comments.tsx`, `contribution-card.tsx`, `solution-fab.tsx`  
**Author Agent**: Phase 2 Component System Specialist (via Impeccable & UI/UX Pro Max)

---

## 1. Context & Objectives

Following Phase 1 (Design Tokens & Typography Pipeline normalization), Phase 2 targeted component fragmentation, raw HTML duplication, and styling debt across the presentation layer:

1. **Eradicate `const inputClass` Duplication:**
   Over 10 separate feature forms had duplicated arbitrary styling strings (`const inputClass = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm..."` and `const errorClass = "border-danger focus:ring-danger/20"`), bypassing design tokens and creating brittle form UX.
2. **Standardize Core Primitives:**
   Upgrade `<Input />`, create `<Textarea />`, create `<Select />`, upgrade `<Field />` with accessible label/error/description slots, modernize `<Button />` (sizes, CVA variants, WCAG focus rings, $\ge 44\text{px}$ touch target compliance), `<Badge />` (adding `warning` for 30-day TTL), `<PageHeader />`, and `<EmptyState />`.
3. **Build Composable `<Card>` Kit & Modernize Feed Cards:**
   Establish composable `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>` primitives and eliminate inline raw OKLCH box-shadow strings (`hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)]`) across cards and floating action buttons.

---

## 2. Key Changes & Deliverables

### 2.1 Upgraded Form Primitives Kit (`@/components/ui/`)
- **`<Input />` (`src/components/ui/input.tsx`):**
  - Upgraded to accept `sizeVariant?: "default" | "sm" | "lg"`.
  - Replaced legacy miniature `h-7 bg-input/20` styling with Swiss Academic Clean standards (`h-10 px-3 text-sm rounded-lg border border-border bg-card text-foreground`).
  - Added visible high-contrast focus rings (`focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`).
  - Added accessible error states (`aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20`).
- **`<Textarea />` (`src/components/ui/textarea.tsx`):**
  - Created standardized multi-line text input primitive with identical focus and `aria-invalid` bindings, defaulting to `min-h-[100px] resize-y`.
- **`<Select />` (`src/components/ui/select.tsx`):**
  - Created native select wrapper providing standardized borders, background, focus rings, and sizing variants matching `<Input />`.
- **`<Field />` (`src/components/ui/field.tsx`):**
  - Upgraded to support `label`, `htmlFor`, `required`, optional `description`, and `error` banner with `role="alert"`.
  - Fully backward-compatible with legacy simple wrapper usages.

### 2.2 Complete Eradication of Duplicated `inputClass` Across 11 Form Files
All instances of `const inputClass` and `const errorClass` were systematically eliminated across all 11 form files:
1. `src/components/features/posts/create-post-form.tsx`
2. `src/components/features/posts/update-post-form.tsx`
3. `src/components/features/problems/create-problem-form.tsx`
4. `src/components/features/problems/update-problem-form.tsx`
5. `src/components/features/problems/create-solution-form.tsx`
6. `src/components/features/problems/update-solution-form.tsx`
7. `src/components/features/lessons/create-lesson-form.tsx`
8. `src/components/features/lessons/update-lesson-form.tsx`
9. `src/components/features/users/profile-form.tsx`
10. `src/components/features/comments/post-comments.tsx`
11. `src/components/features/comments/solution-comments.tsx`

**Preserved Invariants:**
- All `react-hook-form` registrations (`{...register("field")}`) and controllers (`<Controller />`) preserved verbatim.
- Zod schemas, validation triggers, and custom resolvers preserved.
- Background submission stores (`useFormSubmissionStore`), recovery mechanisms, and TanStack Query cache mutations remain intact.

### 2.3 Composable `<Card />` Kit & Card Normalization
- **`src/components/ui/card.tsx`:**
  - Implemented `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
  - Configured with semantic elevation tokens (`shadow-card`, `hover:border-primary/30`, `hover:shadow-card-hover`).
- **`src/components/ui/base-card.tsx`:**
  - Refactored `BaseFeedCard` and `BaseDetailedCard`.
  - Removed raw OKLCH string `hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)]` in favor of semantic `hover:border-primary/40 hover:shadow-card-hover`.
  - Replaced prototype aliases (`border-line`, `text-ink`, `text-ink-muted`, `hover:text-brand-dark`) with canonical tokens (`border-border`, `text-foreground`, `text-muted-foreground`, `hover:text-primary`).
  - Standardized feed card heading typography to `font-heading font-semibold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors`.
- **`src/components/features/users/contribution-card.tsx`:**
  - Replaced legacy card clone and raw OKLCH shadow with `shadow-card`, `border-border`, and `hover:shadow-card-hover`.

### 2.4 Modernization of `<Button />`, `<Badge />`, `<PageHeader />`, & `<EmptyState />`
- **`<Button />` (`src/components/ui/button.tsx`):**
  - Updated sizes: `xs` (28px), `sm` (32px), `default` (40px), `lg` (48px), and `icon` (40px desktop, min 44px on mobile viewports for WCAG 2.2 touch targets).
  - High contrast focus rings: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
  - CVA variants aligned with Swiss Academic Clean palette (`default`, `secondary`, `outline`, `ghost`, `destructive`, `link`).
  - Added support for `asChild` prop alongside Base-UI `render` prop.
- **`<Badge />` (`src/components/ui/badge.tsx`):**
  - Added `warning` variant (`bg-warning/10 text-warning border-warning/20`) for 30-day TTL problem expiration badges.
- **`<TagBadge />` & `<ContributorBadge />`:**
  - Standardized `<TagBadge>` hover colors to `hover:border-primary/40 hover:bg-primary/10 hover:text-primary`.
  - Created `@/components/ui/contributor-badge.tsx` re-exporting `ContributorBadge` from feature directory for clean universal imports.
- **`<PageHeader />` (`src/components/ui/page-header.tsx`):**
  - Standardized heading typography: `font-heading font-bold text-3xl sm:text-4xl text-foreground tracking-tight`.
  - Replaced `text-ink-muted` with `text-muted-foreground`.
  - Added mobile responsive flex wrapping for action buttons.
- **`<EmptyState />` (`src/components/ui/empty-state.tsx`):**
  - Updated dashed border container: `border border-dashed border-border rounded-xl bg-card/50 p-8 sm:p-12 text-center`.
  - Added optional Lucide icon slot (`rounded-full bg-muted p-3 inline-flex text-muted-foreground mx-auto mb-3`) and action button slot.
- **Floating Action Buttons (`src/components/ui/fab.tsx`, `solution-fab.tsx`):**
  - Eradicated all raw OKLCH shadows (`hover:shadow-[0_8px_30px_-6px_oklch(...)]`), replacing with `shadow-card-hover` and `hover:shadow-modal`.

---

## 3. Verification & Acceptance Checklist

- [x] Zero files in `src/` contain `const inputClass` or `const errorClass`.
- [x] All 11 form files use `<Input />`, `<Textarea />`, and `<Select />` from `@/components/ui/`.
- [x] All form submission logic, react-hook-form bindings, Zod validations, B2 direct uploads, and error banners continue to work without modification.
- [x] `BaseFeedCard`, `ContributionCard`, `GlobalFAB`, and `SolutionFAB` have zero hardcoded OKLCH strings.
- [x] TypeScript compilation (`npx tsc --noEmit`) passes with zero errors.
- [x] Next.js production build (`npm run build`) passes with zero errors across all 35 routes.

---

## 4. Handoff to Phase 3 Specialist

Phase 2 is complete. The standardized UI Primitives Kit and form inputs are fully operational and verified.
The next agent executing **Phase 3: Layout & Navigation Shell** should:
1. Review `Planning/design system new/03_PHASE_3_LAYOUT_AND_NAVIGATION.md` and `E2E-frontend/docs/design_system/02_LAYOUT_AND_NAVIGATION.md`.
2. Refactor `AppLayout` (`src/app/(app)/layout.tsx`) to enforce single container discipline (`max-w-6xl mx-auto px-4 sm:px-6`).
3. Eliminate duplicate child containers and negative margin compensations (`-mt-3`) in pages such as `forum/page.tsx`.
4. Overhaul `AppHeader`, responsive mobile navigation, and sticky desktop filter sidebars while eliminating desktop feed scroll locks (`lg:h-[calc(100vh-160px)] lg:overflow-y-auto`).

