# 0010: Phase 4 — Screen Flows Refactoring (Module-by-Module)

**Date**: 2026-11-13  
**Status**: Implemented & Verified  
**Scope**: Module-by-Module screen flows refactoring aligning with Swiss Academic Clean design system tokens, WCAG 2.2 AA accessibility standards, composable `<Card>` kits, capacity meters, and non-destructive backend contracts.  
**Target Modules**:
- **4.1: Forum & Posts Flow**: `src/components/features/content-cards.tsx`, `src/components/features/posts/post-detail-view.tsx`, `src/components/features/comments/threaded-comment.tsx`, `src/components/features/forum/announcements-feed.tsx`
- **4.2: Solve! Problem Solving Flow**: `src/components/features/problems/problem-card.tsx`, `src/app/(app)/problems/page.tsx`, `src/app/(app)/problems/[id]/page.tsx`, `src/components/features/problems/solution-pool-container.tsx`, `src/components/features/problems/solution-item.tsx`
- **4.3: Train! & Academic Resources Flow**: `src/components/features/resources/past-papers-folder-view.tsx`, `src/app/(app)/resources/page.tsx`, `src/app/(app)/train/page.tsx`, `src/components/features/train/train-top-bar.tsx`, `src/components/features/train/curriculum-tree-sidebar.tsx`, `src/app/(workspace)/train/[resourceId]/page.tsx`
- **4.4: Lessons Board & Collections Flow**: `src/app/(app)/study-plans/page.tsx`, `src/app/(app)/study-plans/[id]/page.tsx`, `src/app/(app)/saved-sessions/page.tsx`, `src/app/(app)/saved-sessions/[id]/page.tsx`, `src/components/features/lessons/lesson-detail-client.tsx`, `src/components/features/content-cards.tsx` (`LessonCard`)
- **4.5: User Profiles, Settings & Staff Administration**: `src/components/features/contributions/tier-progress-bar.tsx`, `src/components/features/users/user-profile-view.tsx`, `src/components/features/users/profile-activity-tabs.tsx`, `src/components/features/contributions/contribution-ledger-table.tsx`, `src/app/(app)/admin/reports/page.tsx`, `src/app/(app)/admin/taxonomy/page.tsx`, `src/components/features/admin/manage-sanction-modal.tsx`, `src/components/features/admin/change-role-modal.tsx`  
**Author Agent**: Phase 4 Screen Flows Specialist (via Impeccable & UI/UX Pro Max)

---

## 1. Context & Objectives

Phase 4 transforms all platform user flows into polished, accessible, production-grade interfaces adhering to the **Swiss Academic Clean** design system, while strictly preserving backend contracts, Clerk authentication, TanStack Query hooks, Zustand stores, and Zod schemas:

1. **Non-Destructive Modernization**:
   - Zero changes to API queries, mutations, route contracts, or data formats.
   - Absolute elimination of legacy tokens (`border-line`, `text-ink`, `text-ink-muted`, `bg-surface`, `font-display`, `text-brand`).
2. **Standardized Card Architecture & Composable Kit**:
   - Replaced all monolithic card blocks with composable primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
3. **Academic Clarity & Capacity Feedback**:
   - 30-day post/problem TTL expiration indicators.
   - 7-slot visual segmented capacity meter and Tier 2+ eviction engine explanation in Solve!.
   - Collections capacity enforcement (strictly $X / 3$ allowed for Study Plans and Saved Sessions).
   - Consensus verification badges and checklist criteria for verified academic solutions.
   - Contributor tier progress bar ($0 \to 4$), dynamic multiplier badges ($1\times$ to $5\times$), and hysteresis demotion buffer transparency.
4. **Accessible Micro-Interactions**:
   - Replacement of unicode arrow glyphs (`▲`/`▼`) with accessible Lucide icons (`<ChevronUp />`, `<ChevronDown />`) featuring distinct `aria-label` tags.
   - Proper interactive tap targets ($\ge 44\times 44\text{px}$) and clear focus rings.

---

## 2. Key Changes & Deliverables

### 2.1 Module 4.1: Forum & Posts Flow
- **Composable `PostCard` (`src/components/features/content-cards.tsx`)**:
  - Migrated to composable `<Card>` kit (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
  - Added author metadata with avatar fallback, contributor tier badge, and formatted timestamp.
  - Added 30-day TTL expiration indicator (`Expires in Xd`) highlighting community retention rules.
  - Standardized tag row with `<TagBadge>` and footer interaction metrics.
- **Post Detail (`src/components/features/posts/post-detail-view.tsx`)**:
  - Added prominent 30-day TTL warning badge.
  - Cleaned container hierarchy to `max-w-3xl space-y-8`.
  - Replaced legacy tokens with `border-border`, `text-foreground`, and `text-muted-foreground`.
- **Threaded Comments (`src/components/features/comments/threaded-comment.tsx`)**:
  - Replaced raw textareas with `<Textarea />` from `@/components/ui/textarea`.
  - Replaced unicode glyphs with Lucide `<ChevronUp />` / `<ChevronDown />` with accessible `aria-label`s.
  - Polished nested reply guide lines (`border-l-2 border-border/60 pl-4 mt-2`).
- **Announcements Feed (`src/components/features/forum/announcements-feed.tsx`)**:
  - Standardized typography and borders to semantic tokens.

### 2.2 Module 4.2: Solve! Problem Solving Flow
- **Status Visual Language (`src/components/features/problems/problem-card.tsx`)**:
  - `OPEN` $\to$ `Active Pool` badge with live slot countdown.
  - `SOLVED` $\to$ `Solved (+10 pts)` emerald badge.
  - `FINAL` $\to$ `<Lock /> Final Consensus` lock badge.
  - Cleaned past paper ribbon and photo attachment indicator tokens.
- **Problem Detail (`src/app/(app)/problems/[id]/page.tsx`)**:
  - Cleaned layout container to `max-w-3xl space-y-8`.
  - Updated status indicators and past paper badges to standard tokens.
- **7-Slot Solution Pool (`src/components/features/problems/solution-pool-container.tsx`)**:
  - Added visual 7-segment capacity meter reflecting real-time active slots.
  - Added Tier 2+ eviction engine explanation callout clarifying anti-squatting rules.
- **Consensus Verification (`src/components/features/problems/solution-item.tsx`)**:
  - Added distinct emerald consensus styling (`border-primary ring-2 ring-primary/20 bg-primary/5`).
  - Added Consensus Verification Checklist banner: Score $\ge 10$, Peer Review $\ge 2$ Upvoters, and Author Endorsement.
  - Replaced unicode vote glyphs with Lucide icons.

### 2.3 Module 4.3: Train! & Academic Resources Flow
- **Past Papers Folder View (`src/components/features/resources/past-papers-folder-view.tsx`)**:
  - Clean Level $\to$ Subject $\to$ Year $\to$ Session accordion tree.
  - Distinct badges for Question Paper (`QP` in primary tone) vs. Mark Scheme (`MS` in secondary/emerald tone).
- **Resources Store (`src/app/(app)/resources/page.tsx`)**:
  - Updated tab switcher and textbooks grid to semantic tokens and shadow vocabulary.
- **Train Overview & Workspace (`src/app/(app)/train/page.tsx` & `src/app/(workspace)/train/[resourceId]/page.tsx`)**:
  - Retained 100% full-screen zero-chrome practice canvas.
  - Polished `TrainTopBar` with timer engine, split-screen toggle, and "Ask in Solve!" triggers.
  - Polished `CurriculumTreeSidebar` for seamless document switching without reloading.
  - Cleaned loading skeletons and error state fallbacks.

### 2.4 Module 4.4: Lessons Board & Collections Flow
- **Composable `LessonCard` (`src/components/features/content-cards.tsx`)**:
  - Composable `<Card>` architecture with video indicator badge (when YouTube embedded URL exists) and attachment count badge.
  - Published vs. Draft badge indicators.
- **Study Plans (`src/app/(app)/study-plans/page.tsx` & `study-plans/[id]/page.tsx`)**:
  - Enforced strict capacity limit: **3 Study Plans** per account (`mine.length >= 3`).
  - Display user collection count (`X / 3 allowed`).
  - Disabled creation trigger button with tooltip when limit is reached or an empty plan exists.
  - Sequential syllabus progression playlist with public/private share toggle and shareable link trigger.
- **Saved Sessions (`src/app/(app)/saved-sessions/page.tsx` & `saved-sessions/[id]/page.tsx`)**:
  - Enforced capacity limit: **3 Saved Sessions** per account (`mine.length >= 3`).
  - Categorized tabs (All, Discussions, Problems, Solutions, Lessons, Past Papers) with quick-remove actions.
  - Public/Private toggle switch with shareable URL button.
- **Lesson Detail (`src/components/features/lessons/lesson-detail-client.tsx`)**:
  - Replaced unicode buttons with Lucide `<ChevronUp />` / `<ChevronDown />`.
  - Cleaned container to `max-w-3xl space-y-6`.

### 2.5 Module 4.5: User Profiles, Settings & Staff Administration
- **Reputation & Tier Card (`src/components/features/contributions/tier-progress-bar.tsx`)**:
  - Modernized progress bar showing progress toward the next Contributor Tier ($0 \to 4$).
  - Dynamic vote weight multiplier badge ($1\times$ to $5\times$).
  - Hysteresis demotion grace buffer transparency banner (10-point anti-flickering buffer).
- **User Profile View (`src/components/features/users/user-profile-view.tsx`)**:
  - Embedded `TierProgressBar` directly into profile view.
  - Cleaned container and typography tokens.
- **Immutable Transaction Ledger (`src/components/features/contributions/contribution-ledger-table.tsx`)**:
  - Integrated into new "Ledger" tab in `ProfileActivityTabs`.
  - Displays immutable point deltas with icon indicators (`+` emerald upvote, `-` rose deduction), resulting balances, event types, and content targets.
- **Staff Moderation & Taxonomy (`src/app/(app)/admin/reports/page.tsx` & `taxonomy/page.tsx`)**:
  - Triage queue with priority badges (`HIGH_PRIORITY`, `CRITICAL`), faceted filter bar, and batch action dock.
  - Standardized `<ManageSanctionModal />` and `<ChangeRoleModal />` dialogs using the core `<Dialog>` primitive.

---

## 3. Verification & Acceptance Results

| Verification Item | Status | Result |
| :--- | :--- | :--- |
| **All pages use standardized UI components** | PASS | `Card`, `Badge`, `Button`, `Input`, `Textarea`, `Dialog`, `PageHeader` |
| **Zero regressions in API / Clerk contracts** | PASS | All fetch hooks, queries, and mutations preserved intact |
| **30-day post/problem TTL countdown displays** | PASS | Formatted `Expires in Xd` indicator on cards and detail views |
| **Solve! 7-slot pool & consensus indicators** | PASS | Segmented visual meter and verification checklist active |
| **Train dual-PDF workspace full-screen** | PASS | Zero-chrome layout renders cleanly |
| **Collections capacity limit** | PASS | Enforced at 3 items max with clear disabled tooltips |
| **TypeScript compilation (`npx tsc --noEmit`)** | PASS | **0 errors** across entire codebase |

