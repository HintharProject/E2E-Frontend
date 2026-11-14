# Core UI Component Catalog

> **Scope:** Standardized UI Primitives & Domain Layout Components
> **Source Directories:** `src/components/ui/`, `src/components/layout/`, `src/components/features/`
> **Aesthetic Standard:** Warm Editorial Academic (Phases 1–5)
> **Accessibility Standard:** WCAG 2.2 AA (Keyboard, Focus, ARIA, Touch $\ge 44\text{px}$)

---

## 1. Primitive & Shell Directory Overview

```
src/components/ui/
├── avatar.tsx              # User avatar image + initials fallback
├── badge.tsx               # State, status, and role badges (default/secondary/outline/destructive/warning)
├── base-card.tsx           # BaseFeedCard & BaseDetailedCard (single-layer warm editorial cards)
├── button.tsx              # Universal CVA button/link primitive
├── card-more-menu.tsx      # Accessible report/edit/archive dropdown menu
├── card.tsx                # Composable Card kit (variant: "default" | "editorial" | "flat")
├── content-sort-toggle.tsx # Default / Top / Newest + Timeframe segmented controls
├── contributor-badge.tsx   # Tier 0–4 standing badge + vote multiplier
├── dialog.tsx              # Base-UI accessible modal dialog
├── dropdown-menu.tsx       # Accessible menu popover
├── empty-state.tsx         # Dashed warm-stone empty view placeholder
├── field.tsx               # Accessible form field wrapper (label + description + error)
├── file-dropzone.tsx       # Drag-and-drop validated uploader primitive
├── input.tsx               # Base text input primitive
├── math-renderer.tsx       # KaTeX + rich HTML safe academic prose renderer
├── page-header.tsx         # Editorial PageHeader with optional mono eyebrow, Newsreader title & actions
├── select.tsx              # Styled accessible <select> primitive replacing raw browser selects
├── skeleton.tsx            # Dimension-matched pulse loading skeleton
├── sub-nav.tsx             # Underline/segmented tab navigation
├── tag-badge.tsx           # Clickable taxonomy chip linking to /tags/[name]
├── tag-input.tsx           # Max-3 taxonomy tag selector & creator
└── textarea.tsx            # Auto-styled multi-line editorial input

src/components/layout/
├── app-sidebar.tsx         # Desktop collapsible left navigation rail (w-60 / w-16)
├── app-top-bar.tsx         # Slim h-14 sticky context bar (⌘K search, refresh, contextual Create CTA)
├── horizontal-filter-bar.tsx # Sticky Level/Subject/Type/Status/State/Tags bar with active filter pills
├── mobile-bottom-nav.tsx   # Fixed mobile 5-tab bar (Home, Solve!, Lessons, Resources, Forum)
└── mobile-nav.tsx          # Slide-out mobile drawer for Library, Staff Studio & Profile
```

---

## 2. Key Primitive Specifications

### 2.1 `<PageHeader />` (`src/components/ui/page-header.tsx`)
- Renders optional `eyebrow?: string` in uppercase `font-mono text-[11px] tracking-wider text-muted-foreground`.
- Heading renders in editorial serif `font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground`.
- Supports right-aligned `actions?: React.ReactNode` slot for mode-specific CTAs.

### 2.2 `<Card />` & `<BaseDetailedCard />` (`card.tsx`, `base-card.tsx`)
- Warm editorial surface (`bg-card border border-border rounded-xl shadow-card`).
- Supports `variant?: "default" | "editorial" | "flat"` to distinguish catalog shelves, discussion detail panes, and quiet inset panels without nesting cards inside cards.

### 2.3 `<Button />` (`src/components/ui/button.tsx`)
- Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`.
- Sizes: `xs`, `sm`, `default`, `lg`, `icon` (touch-safe targets on mobile).

### 2.4 Form Primitives (`<Input />`, `<Textarea />`, `<Select />`, `<Field />`, `<TagInput />`, `<FileDropzone />`)
- `<Select />` (`src/components/ui/select.tsx`) standardizes native select styling with chevron alignment, focus ring, and `aria-invalid` error ring—used across `ContributionLedgerTable`, `SearchPage`, and creation/admin forms.
- `<Field />` pairs label, optional `required` indicator, `description`, and inline validation error message.
- `<TagInput />` enforces the platform max-3 tag limit.
- `<FileDropzone />` handles drag-and-drop and click uploads with MIME/size validation.

### 2.5 `<Badge />`, `<TagBadge />`, `<ContributorBadge />`
- `<Badge />` includes `warning` variant (`bg-warning/10 text-warning border-warning/20`) for 30-day Forum TTL warnings and Tier 2+ solution notices.
- `<Badge variant="outline">` or semantic `border-chart-3/40 bg-chart-3/10 text-chart-3` is used for `FINAL` 48h locked problem consensus states.
- `<TagBadge />` is strictly clamped to max 3 visible tags on compact feed cards.
- `<ContributorBadge />` renders Tier `0–4` standing badges (`tier-0..4` tokens) and `1×–5×` vote weight multipliers.

---

## 3. Domain Format & Rail Components (`src/components/features/`)

1. **`ProblemCard` & `ProblemCardVote` (`components/features/problems/`):**
   - Asymmetric **Academic Challenge Ticket** with left vertical `ChevronUp` upvote + `X/7` pool slot rail (`sm:w-20`), Path B Past Paper provenance pill (`Open in Train!`), max 3 tags, author metadata, and `<SaveButton />`.
2. **`SolutionPoolContainer` & `SolutionFAB` (`components/features/problems/`):**
   - Visual `7`-slot meter in the pool header, Tier 2+ eviction / locked pool state notice, inline `Submit Solution` dialog trigger (`variant="inline"`), accepted solution banner, and `<MathRenderer />` body formatting inside `<SolutionItem />`.
3. **`ProblemsRightRail` (`components/features/problems/problems-right-rail.tsx`):**
   - Sticky `xl:w-72` contextual rail with Path A vs Path B creation guidance and Consensus Rules summary (`7`-slot pool, Tier 2+ eviction, `+10 pt`, `48h FINAL` lock).
4. **`PostCard` (`components/features/content-cards.tsx`) & `ForumRightRail` (`components/features/forum/forum-right-rail.tsx`):**
   - Distinct treatment for `QUESTION`, `SHARING`, and `ANNOUNCEMENT`, 30-day TTL remaining/warning badges, attachment chip, and `ForumRightRail` displaying quick CTAs and the latest 3 active notices.
5. **`CollectionCapacityStrip` (`components/features/collections/collection-capacity-strip.tsx`):**
   - Visual `3`-slot binder indicator used at the top of `/study-plans` and `/saved-sessions` reflecting `X / 3 slots used` plus empty-collection creation guard guidance.

---

## 4. Component Quality Invariants

1. **No Nested Cards or Floating Corner Deletes:** Saved collection items and tag hubs render native cards cleanly with inline metadata rows rather than card-inside-card wrappers or floating negative-margin delete icons.
2. **No Decorative Emoji Icons:** All UI indicators come from `lucide-react` (even warning/ban statuses in profiles and star badges in solutions).
3. **Tabular Numerics:** Vote counts, `X/7` slot gauges, `X/3` binder meters, countdown timers, and admin KPIs use `font-mono tabular-nums`.
4. **No Raw Hex/OKLCH in JSX:** Use semantic Tailwind tokens or `var(--chart-*)` variables (including inside Recharts components).
