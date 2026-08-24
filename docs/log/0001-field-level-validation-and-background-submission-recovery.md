---
created_at: 2026-08-25T03:10:00Z
last_modified_at: 2026-08-25T03:10:00Z
---

# Field-Level Validation and Background Submission Recovery Across Posts, Lessons, Problems, and Solutions

## Date
2026-08-25

## Status
Completed

## Context
1. **Premature Optimistic Navigation Loss**:
   - Creating/updating posts and problems previously navigated away (`router.push`) immediately upon clicking submit without preserving form state or error context.
   - When background API calls returned 400 validation failures, the user only saw a generic toast (`"Failed to publish: Validation failed"`) with no indication of which fields failed.
2. **Missing Field-Level Mapping**:
   - Backend field names (`subject`, `level`, `tags`, `uploaded_attachments`, `file`) were not mapped to React Hook Form field names (`subject_id`, `level_id`, `tag_id`, `attachments`, `resources`).
   - None of the forms called `setError` or highlighted invalid inputs.
3. **Loss of In-Memory Attachments on Recovery**:
   - `localStorage` draft serialization could not store `File` objects, causing attachments to be lost on draft recovery.

## Decision
1. **Background Submission Store (`src/lib/store/form-submission-store.ts`)**:
   - Implemented a Zustand store managing background form submissions across Posts, Lessons, Problems, and Solutions.
   - Preserves complete form values and in-memory `File` objects.
   - On error: Persists `fieldErrors` and `serverMessage`, shows a toast alerting the user of specific failed fields with an **"Open & Fix"** action.
2. **Field Error Extraction & Application (`src/lib/form-errors.ts`)**:
   - `extractApiFieldErrors`: Maps backend error dictionary keys to form field keys.
   - `applyFieldErrorsToForm`: Applies field errors to React Hook Form (`setError`).
3. **Error Summary Banner (`src/components/ui/form-error-banner.tsx`)**:
   - Renders a clean error banner displaying the server message and bulleted list of failed fields.
4. **Form Integration**:
   - Integrated `CreatePostForm`, `UpdatePostForm`, `CreateLessonForm`, `UpdateLessonForm`, `CreateProblemForm`, `UpdateProblemForm`, and `CreateSolutionForm` with automatic state and field error restoration.

## Consequences
- **Positive**: Instant, responsive UX where forms minimize on submit while preserving full state and files in memory.
- **Positive**: Upon validation failure, users can restore the form with a single click, seeing red-bordered inputs, precise error strings, and a top-level error summary.
