# 0005: Clickable Tags & Unified Tag Hub Architecture

**Date**: 2026-11-09  
**Status**: Implemented  
**Scope**: Frontend Navigation & Content Aggregation across Posts, Lessons, and Problems

---

## 1. Context & Motivation
Previously, tags on content cards (`PostCard`, `ProblemCard`, and `LessonCard`) and detail views were rendered as non-clickable visual pills or omitted entirely (e.g. `LessonCard`). Users could not explore related content sharing the same tag, nor view an aggregated feed of posts, problems, and lessons under a unified topical micro-taxonomy.

## 2. Key Changes & Architecture
1. **Propagation-Safe Interactive Tag Badges (`TagBadge`)**:
   - Created reusable `<TagBadge />` in `@/components/ui/tag-badge.tsx`.
   - Links to `/tags/[name]` while invoking `e.stopPropagation()` to prevent triggering parent card navigation (`BaseFeedCard`).
   - Standardizes `#` prefixing, lowercase normalization, hover states, and focus rings.

2. **Full Entity Coverage**:
   - Integrated `<TagBadge />` across all content cards: `PostCard`, `ProblemCard`, and `LessonCard`.
   - Added missing tag rendering in `LessonCard` and `ProblemDetailPage`.
   - Updated detail views (`PostDetailView`, `LessonDetailClient`, `ProblemDetailPage`) to use `<TagBadge />`.

3. **Unified Tag Hub (`/tags/[name]`)**:
   - Built a dedicated content discovery route at `src/app/(app)/tags/[name]/page.tsx`.
   - Implemented `TagDetailClient` recycling component patterns from `SavedSessionDetailPage` (`saved-sessions/[id]/page.tsx`):
     - **Category Filter Tabs**: `All`, `Discussions` (`post`), `Problems` (`problem`), and `Lessons` (`lesson`) with live count badges.
     - **Unified Card Wrappers**: Contextual badge headers identifying content types in mixed feed mode.
     - **Empty States**: Reused `EmptyState` component for empty tag feeds.
     - **Header Actions**: Quick URL sharing to clipboard.

4. **Multi-Entity Parallel Fetching (`useTagContent`)**:
   - Created `@/hooks/use-tag-content.ts` leveraging existing backend `filter_by_tags` capabilities across `/posts/?tags=...`, `/problems/?tags=...`, and `/lessons/?tags=...`.
   - Queries metadata from `/tags/?q=...` to display aggregate tag counters.

