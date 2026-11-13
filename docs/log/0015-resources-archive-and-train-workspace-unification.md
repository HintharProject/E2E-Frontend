# 0015: Resources Archive & Train! Workspace Unification

- **Date:** 2026-11-13
- **Status:** Implemented & Verified
- **Scope:** `/train` to `/resources` browse consolidation, Year → Session → Paired QP+MS past-paper index, editorial `DocumentViewerModal` upgrade, problem-selection flow wiring, and `Train!` split-PDF workspace polish with resume persistence
- **Target Files:**
  - `src/app/(app)/train/page.tsx`
  - `src/app/(app)/resources/page.tsx`
  - `src/app/(app)/search/page.tsx`
  - `src/lib/constants.ts`
  - `src/components/features/problems/create-problem-form.tsx`
  - `src/components/features/resources/past-papers-folder-view.tsx`
  - `src/components/features/resources/document-viewer-modal.tsx`
  - `src/app/(workspace)/train/[resourceId]/page.tsx`
  - `src/components/features/train/train-top-bar.tsx`
  - `src/components/features/train/timer-widget.tsx`
  - `src/components/features/train/curriculum-tree-sidebar.tsx`
  - `src/components/features/train/dual-pdf-viewer.tsx`
  - `src/components/features/train/ask-in-solve-modal.tsx`
  - `src/components/features/train/solve-a-paper-modal.tsx`

---

## Summary of Changes

Consolidated exam browsing from the redundant `/train` browse route into a unified `/resources` archive, paired question papers (`QP`) with marking schemes (`MS`) inside `PastPapersFolderView`, aligned modals and selectors with Warm Editorial Academic tokens, and polished the distraction-free `/train/[resourceId]` workspace with client-side resume persistence.

### 1. `/train` Redirect & Cross-App Entry Point Unification

- **`src/app/(app)/train/page.tsx`:** Replaced the 636-line duplicate browse UI with a lean Server Component redirecting `/train` requests to `/resources` while forwarding `level`, `subject`, and `selectForProblem` query parameters.
- **`src/components/features/problems/create-problem-form.tsx`:** Updated `handleOpenTrainToSelectPaper` to `handleOpenResourcesToSelectPaper`, routing paper attachment pickers to `/resources?selectForProblem=true...` and updating CTA labels (`"Select a Paper in Resources"`, `"Change Paper"`).
- **`src/app/(app)/search/page.tsx` & `src/lib/constants.ts`:** Re-pointed legacy `/train` browse references and deep links to `/resources`.

### 2. Unified Resources Archive, Paired QP+MS Rows & Document Modal

- **`src/app/(app)/resources/page.tsx`:** Upgraded the archive into the single browse destination featuring:
  - A dedicated `selectForProblem=true` selection banner when choosing papers for a problem.
  - `HorizontalFilterBar` paired with a quick search input and segmented `Past Papers` / `Textbooks & Guides` tabs.
  - `Skeleton` loading states, a responsive `<Card>` + `<EmptyState />` textbooks grid, `DocumentViewerModal`, and `AskInSolveModal` (`openInSameTab={isSelectForProblem}`).
- **`src/components/features/resources/past-papers-folder-view.tsx`:** Reorganized past papers into **Year → Session → Paired QP+MS** rows with distinct emerald `QP` and stone `MS` pills, `"Train! ↗"`, `"Preview"`, `"Ask in Solve!"` / `"Select for Problem"`, `<SaveButton />`, and `<Download />` controls while preserving `variant="select"`.
- **`src/components/features/resources/document-viewer-modal.tsx`:** Migrated to `@/components/ui/dialog` with Warm Editorial surface tokens and a `"Train! ↗"` CTA for past papers.

### 3. `Train!` Workspace Polish & Resume Persistence

- **`src/app/(workspace)/train/[resourceId]/page.tsx`:** Persisted `e2e_last_train_paper` (`{ id, title, subject, level, subjectName, levelName, updatedAt }`) to `localStorage` so the Academic Hub can resume the most recent paper.
- **`src/components/features/train/train-top-bar.tsx` & `timer-widget.tsx`:** Updated back-navigation links to `/resources` carrying `level`/`subject` query parameters, refined Warm Editorial toolbar tokens, and added `motion-reduce:animate-none` support.
- **`src/components/features/train/curriculum-tree-sidebar.tsx` & `dual-pdf-viewer.tsx`:** Added keyboard navigation on sidebar rows and the `role="separator"` split-pane divider alongside refined border/surface tokens.
- **`src/components/features/train/ask-in-solve-modal.tsx` & `solve-a-paper-modal.tsx`:** Expanded `AskInSolveModal` dialog sizing (`sm:max-w-4xl lg:max-w-5xl`) with `openInSameTab` support, and standardized `SolveAPaperModal` controls onto `<Field>` and `<Textarea>`.

---

## Verification

1. **Impeccable Design Detector (`impeccable detect --json`):** Reported zero findings (`[]`) on `document-viewer-modal.tsx`, `past-papers-folder-view.tsx`, `resources/page.tsx`, and `solve-a-paper-modal.tsx`; dense toolbar badges in `train/*` retain only pre-existing `text-[9px]`/`text-[10px]`/`text-[11px]` `design-system-font-size` advisories.
2. **TypeScript (`npx tsc --noEmit`):** Exited `0` with no errors.
3. **Production Build (`npm run build`):** Exited `0`; compiled cleanly and generated `35/35` static routes alongside the dynamic `/train` redirect (`ƒ`).
