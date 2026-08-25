---
created_at: 2026-08-25T04:00:00Z
last_modified_at: 2026-08-25T04:00:00Z
---

# Problems & Solutions UX Refinements, Optimistic Updates, and Filter Consistency

## Date
2026-08-25

## Status
Completed

## Context
Multiple UX issues and feature requests were identified in the Problems & Solutions module and global feeds:
1. **Filter Inconsistency**: Problems page used a separate dropdown bar instead of the unified `FilterSidebar` component used in Forum and Lessons. Problem status options (`Open`, `Solved`, `Closed`) were missing in the sidebar, and tags were irrelevant for Problems.
2. **Creator Role Enforcement**: Creators needed to be blocked from creating problem posts both on the frontend UI and backend API.
3. **Optimistic Feed Updates**: Newly created posts, lessons, and problems by the current logged-in user needed to immediately appear at the top of the user's feed on their device.
4. **5-Solution Limit**: When a problem reaches 5 solutions, the submission form should be hidden and replaced with an informative notice.
5. **Mark as Incorrect Confirmation**: Replaced native `window.confirm` browser dialog with an accessible, styled `<Dialog>` modal.
6. **Solution Editing**: Solution authors can edit their solution as long as it is not marked as `WORKED` (Solved).

## Decision
1. **FilterSidebar Unification (`src/components/layout/filter-sidebar.tsx` & `src/app/(app)/problems/page.tsx`)**:
   - Added `hideTags` and `showProblemStatus` props to `FilterSidebar`.
   - Updated `ProblemsPage` to use `FilterSidebar` with `useSearchParams` across a responsive layout matching the Forum.
2. **Role Restrictions (`src/app/(app)/problems/page.tsx` & `src/app/(app)/problems/new/page.tsx`)**:
   - Conditioned "Post a Problem" button visibility on `user.role !== "CREATOR"`.
   - Blocked access to `/problems/new` for creators with an informative warning banner.
3. **Feed Cache Prepending**:
   - Updated `CreateProblemForm`, `CreatePostForm`, and `CreateLessonForm` to optimistically prepend the newly created item to the infinite query cache `queryClient.setQueryData` on success before background invalidation.
4. **Solution Limit UI (`src/app/(app)/problems/[id]/page.tsx`)**:
   - When `problem.solution_count >= 5`, replaces `CreateSolutionForm` with a clean card informing users that the maximum limit has been reached.
5. **Dialog Modal Replacement (`src/app/(app)/problems/[id]/solutions/[solutionId]/page.tsx`)**:
   - Integrated `shadcn/ui` `<Dialog>` component for confirming "Mark as Incorrect" action.
6. **Solution Update Form & Route (`src/components/features/problems/update-solution-form.tsx` & `src/app/(app)/problems/[id]/solutions/[solutionId]/edit/page.tsx`)**:
   - Implemented solution editing supporting description modification, existing attachment deletion, and new attachment uploads.
   - Added "Edit" button to solution detail view for the author, conditionally rendered when `solution.status !== "WORKED"`.

## Consequences
- Unified filter experience across all three primary tabs (Forum, Lessons, Problems).
- Smoother content creation experience with instant feed feedback for the user.
- Consistent, modern modal dialogs and clear lifecycle guardrails for problem solutions.
