# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Users:** Pre-university and high-school students (O-Level, A-Level, Years 7–9, OSSD, IB, and comparable secondary curricula) who are actively preparing for exams or working through difficult coursework and need fast, clear peer help on specific problems they are struggling with.
- **Secondary Audiences:** University students and pre-high-school learners (supported flexibly by the subject/level taxonomy), educators and community creators publishing structured lessons, and tiered staff (`MODERATOR`, `ADMIN`, `SUPERADMIN`) maintaining content quality, taxonomy, and academic resources.

## Product Purpose

Hinthar Education E2E is a peer-learning, problem-solving, and academic-resource web platform built to replace heavy traditional LMS workflows with fast knowledge retrieval. A student stuck on a concept or exam question can post the problem directly—from an uploaded photo or a past exam paper—and receive structured peer solutions, consult concise creator-led lessons, practice with paired past papers and mark schemes, and organize study materials without course-management overhead.

## Positioning

- **`Solve!` Dual-Route Problem Solving at the Core:** Both **Path A** (user-uploaded problem photos with OCR) and **Path B** (questions linked directly from curated past papers) are first-class entry points to get structured peer solutions.
- **Unified Past-Paper to Q&A Workflow:** The split-screen `Train!` workspace pairs Question Papers (`QP`) and Mark Schemes (`MS`) and bridges directly into `Solve!` threads (Path B), keeping exam practice and peer explanation in one flow.
- **Minimalist Creator-Led Hub Without LMS Bloat:** Replaces complex course-enrollment and module-gating systems with an open, flat Lessons Board, focused Forum Q&A/Sharing feeds, and lightweight personal Study Plans and Saved Sessions.

## Operating Context

- **Core Surfaces & Flows:** Home Hub (`/`) for resuming `Train!` sessions and tracking open bounties/collections; `Solve!` (`/problems`) for Path A and Path B problem threads with a 7-solution active pool; `Resources` (`/resources`) & `Train!` (`/train/[resourceId]`) for Year/Session/QP+MS past-paper practice with an exam timer; `Lessons` (`/lessons`) for articles, attachments, and embedded YouTube/Playlist learning; `Forum` (`/forum`) for ephemeral `QUESTION`, `SHARING`, and `ANNOUNCEMENT` threads; `Collections` (`/study-plans`, `/saved-sessions`); and `Admin Studio` (`/admin`, `/admin/triage`, `/admin/users`, `/admin/resources`).
- **Infrastructure & Latency Reality:** Frontend runs on Next.js (App Router) with Clerk authentication (`proxy.ts` network boundary) talking to a Django REST API (`e2e-backend`, hosted on Render free tier with 30–50s cold-start wakeups after 15+ minutes of inactivity) and Backblaze B2 pre-signed storage for documents and attachments.

## Capabilities and Constraints

- **Unified Role & Staff Hierarchy:** Single universal `USER` role (auto-provisioned via Clerk JIT) with 3-tier staff governance (`MODERATOR`, `ADMIN`, `SUPERADMIN`); Last SuperAdmin demotion/deactivation safeguard applies.
- **Meritocratic Reputation & Consensus Rules:** Contributor Tiers `0–4` (`contribution_points`) drive `1×–5×` vote weights with 10-point hysteresis, diminishing author vote yields, a 5 pts/day peer-curation cap, and 7-day reciprocal voting collusion guards. `Solve!` limits active solutions to 7 (Tier 2+ eviction of `S <= 0` attempts), automates acceptance via a 4-part consensus gate (manual accept endpoints return `410 Gone`), auto-prunes solutions at `S <= -5` with `>= 3` downvoters, and locks `FINAL` threads after 48h `SOLVED` or `S >= 25`.
- **Content Lifecycle & Caps:** Forum posts and problems expire permanently after a strict 30-day TTL (cascading to child comments/solutions and B2 files). Mandatory `subject_id` and `level_id` apply to standard posts, lessons, and problems (optional only on Admin/SuperAdmin announcements). Tags are capped at 0–3 per item and normalized (`2–30` chars). Collections are capped at 3 Study Plans (lessons only) and 3 Saved Sessions (posts + lessons) per user, blocking new creation while an empty collection of that type exists.
- **Upload & Media Rules:** Direct video hosting is prohibited (YouTube/Playlist embed URLs only). Upload caps: Posts (1 file, 5 MB: `.jpg`, `.png`, `.pdf`), Problems (1–3 images, 5 MB each), Solutions (0–3 images, 5 MB each), Lessons (max 5 files, 20 MB: `.pdf`, `.docx`, `.pptx`, `.zip`), Past Papers (50 MB, requiring `year`, `session`, `QP`/`MS`), Textbooks (300 MB, documents + `.zip`).
- **Moderation & Sanctions:** Accounts are never hard-deleted; progressive sanctions (`WARNING`, `BANNED_24H`, `BANNED_7D`, `PERMANENT_BAN`) enforce read-only mode (`403 USER_BANNED` on writes). One report per user per target; lazy-loaded threaded comments; 60 req/min voting rate limit; simple SQL `ILIKE` title/filename search.
- **Deferred / Out of Scope:** Collaborative Study Plans or Saved Sessions, notification boards, universal `"Ref to"` linkers, full-text body search, and free-form bookmarking boards.

## Brand Commitments

- **Identity:** Hinthar Education (`hinthar.education`) — E2E Platform.
- **Logo & Visual Asset State:** No custom Hinthar Education SVG/logo asset is currently committed in `public/` (only default framework placeholders exist); future work must not invent or substitute generic placeholder marks as official branding.

## Evidence on Hand

- **Codebase & Technical Specs:** Implemented Next.js frontend (`src/app/`), design documentation (`DESIGN.md`, `docs/design_system/*`), product & API handoff specs (`docs/frontend_handoff/*`), and implementation logs (`docs/log/*`).
- **Explicit Absences:** No customer testimonials, user-outcome metrics, learner counts, or press/partner proof exist on hand. Future work must not fabricate social proof, benchmarks, pricing, or deployment metrics.

## Product Principles

1. **Unblock the Struggling Student First:** Keep posting a question (via photo upload or past-paper reference) and reaching peer solutions fast and frictionless across desktop and mobile.
2. **Keep Exam Practice and Peer Explanation Together:** Maintain tight continuity between `Resources`, the split-pane `Train!` workspace, and `Solve!` rather than siloing them into disconnected tools.
3. **Prevent Platform Bloat by Design:** Preserve strict structural bounds (30-day post TTL, 7-solution pool cap, 3-collection cap, 3-tag max, title-only search) over sprawling LMS features.
4. **Reward Signal, Not Noise:** Protect community trust through meritocratic vote weighting, automated consensus acceptance, and transparent moderation/sanction states.
5. **Respect Real-World Constraints:** Design every interaction to handle 30–50s backend cold starts, bilingual English/Myanmar academic usage, and accessible keyboard/screen-reader flows gracefully.

## Accessibility & Inclusion

- **Target Standard:** WCAG 2.1 AA compliance across desktop and mobile responsive web (`44×44px` touch targets, single `<main id="main-content">` landmark, visible keyboard focus rings, modal `Escape` handling).
- **Script, Math & Language Support:** Primary English UI with KaTeX math rendering and required **bilingual / Myanmar script support** (typography, line-height/clipping safety, input handling, and regional accommodation where content or learners use Myanmar script).

