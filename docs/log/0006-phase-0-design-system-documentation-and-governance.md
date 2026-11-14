# 0006: Phase 0 — Design System Documentation & Governance Architecture

**Date**: 2026-11-12  
**Status**: Implemented & Verified  
**Scope**: Frontend Design System Governance, Guardrails, and Authoritative Documentation Suite  
**Author Agent**: Phase 0 Documentation & Governance Specialist

---

## 1. Context & Motivation

Before modifying any production code in `E2E-frontend`, an architectural audit revealed multiple systemic visual and styling inconsistencies:
1. **Dual / Conflicting Tokens:** Standard Shadcn tokens (`--primary`, `--card`, `--border`) co-existed alongside prototype aliases (`--brand`, `--surface`, `--line`, `--ink`), resulting in 1,183 instances of `text-ink` vs 19 of `text-foreground`.
2. **Broken Heading Font Pipeline:** `src/app/layout.tsx` imported Manrope as `--font-heading`, but `@theme inline` in `globals.css` lacked `--font-display`, causing headings across multiple pages to fall back to browser default serifs.
3. **Fragmented UI Primitives:** `const inputClass = "..."` was manually duplicated across 10+ form files, and raw inline card classes (`rounded-2xl border border-line bg-card p-5...`) were copied across 40+ pages.
4. **Layout Collisions:** Redundant outer containers caused negative margin hacks (`-mt-3`), and desktop feed containers forced viewport scroll locks (`lg:h-[calc(100vh-160px)] lg:overflow-y-auto`), resulting in dual scrollbars and mouse-wheel traps.

Phase 0 establishes the **Single Source of Truth** and non-negotiable coding guardrails across the repository before Phase 1 begins code edits.

---

## 2. Key Deliverables Authored & Updated

### 2.1 Impeccable Design Blueprint: `E2E-frontend/DESIGN.md`
- Created `E2E-frontend/DESIGN.md` following the Impeccable and Stitch specifications.
- **Modes:** Defined `Operate` (Dashboard, Forum, Solve!, Train!, Admin) and `Read` (Lessons, Exam Papers, Documentation).
- **Aesthetic Direction:** *Swiss Academic Clean* — high contrast, authoritative Manrope headings, subtle structural borders, and calibrated dark mode (`oklch(0.148 0.004 228.8)` canvas, `oklch(0.20 0.008 225)` elevated cards).
- **Normative YAML Frontmatter:** Encodes tokens, typography, radii, and container constraints.
- **Canonical Eight Sections:** Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do's and Don'ts.

### 2.2 Agent Guardrails: `E2E-frontend/.agents/UI_UX_GUIDELINES.md`
- Established strict, non-negotiable rules for all AI agents:
  1. **Rule of Single Primitive:** Banning `const inputClass = "..."`. Mandating `<Input />`, `<Textarea />`, and `<Field />` from `@/components/ui/`.
  2. **Rule of Composable Cards:** Banning raw inline card classes. Mandating the composable `<Card>` primitive kit.
  3. **Rule of Semantic Tokens:** Banning raw OKLCH/hex strings in JSX (e.g. `hover:shadow-[0_12px_40px...oklch...]`).
  4. **Layout Rule:** Banning negative margins (`-mt-3`, `-mt-4`) and duplicate container wrappers.
  5. **Scroll Rule:** Banning desktop nested scroll locks on primary feeds.
  6. **WCAG 2.2 AA Invariants:** Requiring $\ge 4.5:1$ text contrast, $\ge 44\times 44\text{px}$ touch targets, visible focus rings, and explicit `aria-label` attributes on icon buttons.

### 2.3 Updated Agent Architecture: `E2E-frontend/.agents/AGENTS.md`
- Replaced deprecated roles ("Creator", "Student") with the unified **4-Tier User Hierarchy**: `USER`, `MODERATOR`, `ADMIN`, `SUPERADMIN`.
- Documented the **5 Contributor Tiers (0–4)** and dynamic vote weight multipliers ($1\times$ to $5\times$).
- Removed obsolete references to Tiptap for rich text editing.
- Documented the **Dual-Layout Convention**:
  - `(app)/layout.tsx`: General platform shell with `AppHeader`, `AppFooter`, `CommandPalette`, and `GlobalFAB`.
  - `(workspace)/layout.tsx`: Distraction-free full-screen workspace for `train/[resourceId]`.

### 2.4 Design System Documentation Suite (`E2E-frontend/docs/design_system/`)
1. **`00_DESIGN_TOKENS.md`**: Complete OKLCH color token specification (Light vs Dark), 5 contributor tier tokens, typography scale with Manrope and Montserrat, elevation tokens (`shadow-card`, `shadow-card-hover`), and radii scale.
2. **`01_COMPONENT_CATALOG.md`**: Detailed specifications for core primitives (`Button`, `Input`, `Textarea`, `Field`, `Card`, `Badge`, `ContributorBadge`, `TagBadge`, `EmptyState`, `Dialog`).
3. **`02_LAYOUT_AND_NAVIGATION.md`**: Container standards (`max-w-6xl mx-auto`), dual-shell layout mechanics, `AppHeader`, `FilterSidebar` sticky behavior, and eradication of negative margins and scroll traps.
4. **`03_SCREEN_FLOWS_AND_PATTERNS.md`**: Comprehensive domain interaction flows across Forum (30d TTL, threaded comments), Solve! (7-slot pool, consensus rules), Train! (past paper tree, dual PDF), Lessons (collection limits: 3 max), User Profiles, Admin Moderation, and Render 30–50s cold-start masking.

---

## 3. Verification & Acceptance Checklist

- [x] `E2E-frontend/DESIGN.md` exists and contains Impeccable mode, palette, typography, and craft floor rules.
- [x] `E2E-frontend/.agents/UI_UX_GUIDELINES.md` exists and clearly states prohibitions on `inputClass` and raw OKLCH inline strings.
- [x] `E2E-frontend/.agents/AGENTS.md` is updated to remove deprecated roles and outdated libraries.
- [x] `E2E-frontend/docs/design_system/` contains files:
  - [x] `00_DESIGN_TOKENS.md`
  - [x] `01_COMPONENT_CATALOG.md`
  - [x] `02_LAYOUT_AND_NAVIGATION.md`
  - [x] `03_SCREEN_FLOWS_AND_PATTERNS.md`
- [x] Zero functional code has been modified or broken.

---

## 4. Handoff to Phase 1 Specialist

Phase 0 is complete. The repository is governed by clear, authoritative documentation.
The next agent executing **Phase 1: Design Tokens & Typography Pipeline** should:
1. Target: `E2E-frontend/src/app/globals.css` and `E2E-frontend/src/app/layout.tsx`.
2. Map `--font-display: var(--font-heading);` in `@theme inline`.
3. Reconcile OKLCH color tokens and elevation classes as documented in `docs/design_system/00_DESIGN_TOKENS.md`.
4. Verify build with `npm run build`.

