# Screen Flows & Interaction Patterns

> **Status:** Authoritative Functional & UX Pattern Guide  
> **Target Scope:** All feature modules under `src/app/(app)/`, `src/app/(workspace)/`, and `src/components/features/*`  
> **Guardrail:** Strictly preserve existing data hooks, Clerk auth, and backend business rules.

---

## 1. Domain Flows Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      E2E PLATFORM DOMAIN MODULES                            │
│                                                                             │
│   1. Forum & Posts       ──> 30-day TTL, threaded comments, creator feeds   │
│   2. Solve! Problems     ──> 7-slot solution pool, consensus acceptance      │
│   3. Train! & Resources  ──> Past-papers tree, dual-PDF split workspace     │
│   4. Lessons & Plans     ──> Video lessons, max 3 collections limit         │
│   5. Profile & Tiers     ──> Contributor Tiers (0-4), reputation ledger     │
│   6. Admin & Moderation  ──> Triage queue, sanctions, taxonomy merge studio │
│   7. Cold-Start Defense  ──> 30-50s Render wake-up handling with skeletons  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Module Specifications

### 2.1 Forum & Posts Flow (`src/app/(app)/forum/*`)

1. **Sub-Route Navigation (`SubNav`):**
   - `/forum`: Main community discussion feed.
   - `/forum/announcements`: Official institutional announcements (staff-only authoring).
   - `/forum/creators`: Personalized feed showing posts from followed creators.
2. **Post Card Structure (`PostCard` in `content-cards.tsx`):**
   - Built on composable `<Card>` primitive.
   - **Header:** Author avatar, username, `<ContributorBadge tier={post.author.tier} />`, timestamp, and 30-day TTL countdown badge.
   - **Body:** Post title, rich LaTeX rendered snippet, and clickable `<TagBadge />` pills.
   - **Footer:** Vote counter widget with dynamic multiplier floating animation, comment count pill, bookmark `<SaveButton />`, and `<CardMoreMenu />`.
3. **30-Day TTL Expiration Indicator:**
   - Forum posts expire 30 days after creation.
   - Posts within 3 days of expiration display an amber warning badge:  
     `<Badge variant="warning">Expires in 2d</Badge>`.
4. **Threaded Comments Architecture:**
   - Top-level comments are fetched initially.
   - Replies are indented with a vertical guide line (`border-l-2 border-border/60 pl-4 mt-2`).
   - Deep reply trees are fetched on demand via a "View Replies" trigger calling `/api/v1/comments/:id/replies/`.
   - Long comment threads are virtualized via `react-virtuoso` to prevent DOM bloat.

---

### 2.2 Solve! Problem Solving Flow (`src/app/(app)/problems/*`)

The Solve! module is a competitive peer problem-solving engine with capacity-limited solution pools and consensus-driven verification.

1. **Problem Status Lifecycle:**
   - `OPEN`: Pool active, accepting peer solution attempts.
   - `SOLVED`: Consensus threshold reached ($S \ge 10$, $\ge 2$ peer upvoters, author endorsement).
   - `FINAL`: Locked after 48 hours or when score $S \ge 25$. Immutable reference solution.
2. **7-Slot Solution Pool Rules:**
   - Each problem has a maximum capacity of **7 active solutions**.
   - **Capacity Bar:** A visual progress meter displays pool saturation (`4 / 7 slots filled`).
   - **Tier 2+ Eviction Rule:** If the pool is full ($7/7$), a user with Contributor Tier $\ge 2$ can submit a new solution, which automatically evicts the lowest unendorsed attempt with score $\le 0$. A clear explanatory helper text is rendered when the pool is at capacity.
3. **Consensus Acceptance Checklist:**
   - Winning solutions receive a prominent emerald consensus card border (`border-primary ring-2 ring-primary/20`) and a checklist banner:
     - [x] Net score $S \ge 10$
     - [x] $\ge 2$ peer upvoters from Tier 1+ users
     - [x] Author endorsement or moderator verification
   - Upon acceptance, $+10\text{ reputation points}$ are credited to the solver's ledger.

---

### 2.3 Train! & Academic Resources Flow (`src/app/(workspace)/train/*`, `src/app/(app)/resources/*`)

1. **Resources Past Papers Explorer (`src/app/(app)/resources/page.tsx`):**
   - Hierarchical accordion folder tree:  
     `Academic Level` (e.g. Cambridge A-Level) $\to$ `Subject` (e.g. 9709 Mathematics) $\to$ `Year` (e.g. 2023) $\to$ `Session` (e.g. May/June).
   - Distinct badges for Question Papers (`QP` in primary emerald tone) and Mark Schemes (`MS` in secondary slate tone).
   - Direct pre-signed preview modal (`DocumentViewerModal`) and direct Backblaze B2 streaming download triggers.
2. **Train Distraction-Free Workspace (`src/app/(workspace)/train/[resourceId]/page.tsx`):**
   - Fullscreen zero-chrome viewport.
   - `TrainTopBar`:
     - Countdown examination timer with start/pause/reset controls.
     - Split-screen toggle (dual-PDF mode: QP on left, MS on right).
     - "Stuck? Ask in Solve!" button which pre-populates a problem creation modal with the paper's curriculum metadata.
   - `CurriculumTreeSidebar`: Quick drawer allowing students to navigate sibling past papers without leaving the active examination environment.

---

### 2.4 Lessons Board & Collections Flow (`src/app/(app)/lessons/*`, `study-plans/*`, `saved-sessions/*`)

1. **Lesson Cards (`LessonCard`):**
   - Rendered using composable `<Card>` kit.
   - Video indicator badge if an embedded YouTube video is present.
   - Attachment count pill (max 5 attachments, up to $20\text{MB}$ total).
   - Publication status badge (`Published` in green vs `Draft` in neutral gray).
2. **Collections Capacity Limits (Enforced UI Rule):**
   - Users are strictly limited to **3 Study Plans** and **3 Saved Sessions**.
   - **Capacity Counter:** Displays current count: `2 / 3 created`.
   - **Creation Guard:** The "Create New Collection" button is automatically disabled (with a tooltip) if:
     1. The user already owns 3 collections.
     2. An existing collection has zero items (preventing empty collection hoarding).

---

### 2.5 User Profile & Reputation Flow (`src/app/(app)/users/[id]/*`)

1. **Contributor Progression Meter (`tier-progress-bar.tsx`):**
   - Visual progress bar showing points accumulated toward the next Contributor Tier ($0 \to 4$).
   - Current vote weight multiplier badge displayed prominently ($1\times$ to $5\times$).
2. **Immutable Transaction Ledger:**
   - Table of all reputation events:
     - Upvote received ($+1$ or $+2$ depending on voter's tier multiplier)
     - Accepted solution milestone ($+10$ points)
     - Downvote deduction
   - Icon indicators for every transaction type.
3. **User Activity Tabs:**
   - Tabs for `Solutions`, `Problems`, `Posts`, and `Lessons` authored by the user.

---

### 2.6 Admin & Staff Moderation Flow (`src/app/(app)/admin/*`)

1. **Role-Based Access Control:**
   - Strictly restricted to `MODERATOR`, `ADMIN`, and `SUPERADMIN`.
2. **Reports Triage Queue (`admin/reports`):**
   - Tabular queue displaying reported posts, problems, and comments.
   - Priority badges: `HIGH_PRIORITY` (academic cheating, harassment) vs `NORMAL`.
   - Action dialogs: `<ManageSanctionModal />` (apply warning, 24h ban, 7d ban, permanent ban) and `<ChangeRoleModal />` using the standardized `<Dialog>` primitive.
3. **Taxonomy Merge Studio (`admin/taxonomy`):**
   - Interface for merging duplicate tags, reclassifying subjects, and managing academic levels.

---

### 2.7 Render Cold-Start UX Masking

The backend runs on Render free tier, entering sleep mode after 15 minutes of inactivity. Cold starts take **30 to 50 seconds** to wake up.

1. **Initial Page Load Orchestration (`InitialLoadingScreen`):**
   - If an initial query takes $> 3\text{ seconds}$, transition from a generic spinner to contextual reassuring copy:  
     *"Connecting to academic servers (waking up free tier container, may take ~30s)..."*
   - Display an animated subtle pulse bar to reassure the user that the request is actively progressing.
2. **Dimension-Matched Skeletons:**
   - Skeletons in `src/components/features/skeletons.tsx` must match the exact height, padding ($20\text{px}$), and border-radius ($12\text{px}$) of rendered cards.
   - Prevents Cumulative Layout Shift (CLS) when data arrives.

