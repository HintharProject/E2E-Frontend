# 0004: Modernized Tag System & Combobox Input Architecture

**Date**: 2026-11-03  
**Status**: Implemented  
**Scope**: Frontend & Backend Integration across Posts, Lessons, Problems

---

## 1. Context & Motivation
Previously, tag selection on content authoring forms relied on a single-select `<select>` dropdown populated with pre-existing tags. Content creators could only attach 1 tag (`tag_id`), could not search dynamically, could not create new tags on the fly, and `Problem` entities lacked tag relationships entirely.

## 2. Key Changes & Architecture
1. **Interactive Combobox Input (`TagInput`)**:
   - Built reusable `<TagInput />` in `@/components/ui/tag-input.tsx` featuring badge chips, accessible keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `,`, `Backspace`, `Escape`), and typeahead suggestions with frequency counters.
   - Inline tag creation call-to-action (`Create "#tag" (New tag)`) allows users to stage novel tags on the fly.
   - Enforces visual and input limit of maximum 3 tags per item (`3/3` counter, read-only clamp).
2. **Typeahead Query Hook (`useTagSuggestions`)**:
   - Debounced TanStack Query hook calling `/api/v1/tags/?q={query}&limit=15`.
3. **Unified Entity Symmetry**:
   - Extended tags across `Post`, `Lesson`, and `Problem` forms and detail views.
   - Ingestion payload accepts `tags: string[]` (array of tag names or UUIDs).
   - Responses provide structured `tags_data: Tag[]`.
4. **Backend Ingestion & Normalization**:
   - DRF `TagListField` enforces string formatting, normalization regex, length clamps (2–30 chars), and reserved word rejection.
   - Atomic `TagService.bind_tags_to_instance` resolves tags with concurrency savepoints and audit logging (`TAG_CREATE_INLINE`).
   - Triple-layer 3-tag limit enforcement across UI, Serializer, and `m2m_changed` signals.
