# Screen Flows & Domain Patterns

> **Scope:** Shipped Phase 1–5 Screen Architecture & Non-Destructive Invariants  
> **Status:** Complete across all user, creator, and staff routes

---

## 1. Personalized Academic Hub (`/`)

- Authenticated visitors landing on `/` render `<AcademicHub />` inside the standard App Shell (unauthenticated users continue to `/sign-in`).
- Organized as an editorial bento command center:
  1. Top Newsreader greeting + standing pill (`<ContributorBadge />`, `contribution_points`, vote weight).
  2. Quick launch tiles (**Ask a Problem**, **Practice Past Papers**, **Write a Lesson**).
  3. Main bento column: **Open `Solve!` Bounties** (with `X/7` pool slots) and **Fresh Lessons**.
  4. Side column: **Resume `Train!` Practice** (hydrated from `e2e_last_train_paper` in `localStorage`), **My Library** live slot meters (`X/3`), and latest **Announcements**.

---

## 2. Separated Curriculum Shelves (`/lessons`)

- Opens in **Categorized Subject Shelves Mode** when browsing broadly (`Level` pill switcher across the top + 3-card preview shelves per subject).
- Selecting **"View all in [Subject] →"** (or choosing subject/tag/mine filters) switches smoothly into **Focused Drill-Down Mode** with a **"← Back to All Subject Shelves"** trigger.
- Lesson reading (`/lessons/[id]`) adopts `max-w-3xl` Read Mode with clean `LessonMediaViewer`, resource attachments, and Study Plan saving.

---

## 3. Unified Exams & Resources (`/resources` & `/train/[resourceId]`)

- `/train` redirects on the server to `/resources` while forwarding `level`, `subject`, and `selectForProblem` query parameters.
- `/resources` houses two segmented modes (**Past Papers** grouped by Year & Session with `QP`/`MS` sibling chips, and **Textbooks & Guides** grid), inline PDF preview (`DocumentViewerModal`), direct download, **Train! ↗** launcher (`/train/[resourceId]`), and `selectForProblem=true` Path B problem creation bridge via `AskInSolveModal`.
- `/train/[resourceId]` runs fullscreen in `src/app/(workspace)/layout.tsx` and writes `e2e_last_train_paper` to `localStorage` for one-click resume from Home.

---

## 4. `Solve!` Academic Challenge Flow (`/problems`, `/problems/[id]`)

- **Feed (`/problems`):** Asymmetric **Academic Challenge Ticket** cards paired with `<ProblemsRightRail />` (Path A Self-Typed vs. Path B Past Paper provenance guidance and Consensus summary).
- **Detail (`/problems/[id]`):** `max-w-3xl` reading column + `<SolutionPoolContainer />` displaying the `7`-slot meter, Tier 2+ eviction / locked pool state notice, inline `Submit Solution` dialog trigger (`SolutionFAB variant="inline"`), accepted solution banner, `<MathRenderer />` solution bodies, and `FINAL` consensus indicator (`border-chart-3/40 bg-chart-3/10 text-chart-3`).

---

## 5. Community Forum & Threads (`/forum`, `/posts/[id]`)

- **Feed (`/forum`, `/forum/creators`, `/forum/announcements`):** Sub-navigation + sticky `<HorizontalFilterBar />` + `<ForumRightRail />` (quick CTAs, latest 3 active notices, Question/Sharing format legend).
- **Cards (`PostCard`):** Differentiates `QUESTION`, `SHARING`, and `ANNOUNCEMENT` badges, attachment pill, max 3 tags, and `30-day TTL` warning badge (`Expires in Xd` when `<= 3` days left).
- **Threads (`ThreadedComment`):** Clean left guide line (`border-l-2 border-border/70 pl-4`), `ChevronUp` upvote button (`font-mono tabular-nums`), and accessible reply toggle targets.

---

## 6. Curated Binders (`/study-plans`, `/saved-sessions`)

- Both collection hubs feature `<CollectionCapacityStrip />` (`3`-slot capacity binder `X / 3 slots used`) and retain the empty-collection guard disabling `+ New Plan` / `+ New Session` when slot cap is reached or an empty collection exists.
- `/saved-sessions/[id]` renders mixed saved content cleanly without nested cards, keeping `Remove` buttons inline in card meta headers.

---

## 7. Profiles, Creation Studios, Search & Admin (`/users/[id]`, `/*/new`, `/search`, `/admin`)

- **Profile & Ledger (`UserProfileView`, `ContributionCard`, `TierProgressBar`, `ContributionLedgerTable`):** Clean semantic tokens, Lucide icons for warning/ban banners (`AlertTriangle`, `Ban`, `ShieldBan`), `<Select />` filters, and `font-mono tabular-nums` point deltas.
- **Creation & Edit Studios (`/posts/new`, `/problems/new`, `/lessons/new`, `/problems/[id]/edit`, `/problems/[id]/solutions/[solutionId]/edit`, `/settings/*`):** Unified `max-w-3xl` editorial cards with `<Field error={...}>`, `<TagInput />` (max 3 tags), and corrected `returnUrl: "/posts/new"`.
- **Global Search (`/search`) & Command Palette (`⌘K`):** `<Select />` filters, clean category pills, and instant keyboard navigation.
- **Admin Studio (`/admin/*`):** Accessible single-landmark layout (nested `<main>` fixed), 4-card KPI telemetry strip, curriculum health matrix, and Recharts stacked depth chart consuming CSS variables (`var(--chart-1..5)`, `var(--primary)`, `var(--warning)`, `var(--destructive)`).
