<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend Agent Guidelines

This document outlines strict architectural, technical, and workflow rules for AI agents operating in this Next.js frontend repository.

## 1. Strict Folder Structure
Agents must respect the following architecture when creating or modifying files:
* `src/app/`: Strictly for routing (`page.tsx`, `layout.tsx`). No heavy business logic here.
* `src/components/ui/`: Reusable, generic UI primitives (Buttons, Inputs, Cards, Badges, Dialogs). Follow rules in `.agents/UI_UX_GUIDELINES.md`.
* `src/components/layout/`: Structural platform components (`AppHeader`, `AppFooter`, `MobileNav`, `FilterSidebar`).
* `src/components/features/`: Domain-specific components (`forum`, `problems`, `train`, `lessons`, `users`, `admin`).
* `src/components/providers/`: Global React providers (e.g., QueryClientProvider, ThemeProvider).
* `src/lib/`: Utility functions (`cn`, formatting, constants).
* `src/lib/middleware/`: Application-level middleware, HOCs, and wrappers (RBAC, validation).
* `src/lib/store/`: Zustand state stores.
* `src/hooks/`: Custom React hooks (TanStack Query hooks, UI state hooks).
* `src/services/`: All backend API calls must be defined here. Do not inline `fetch` or `axios` calls inside components.
* `src/types/`: TypeScript interfaces and models.
* `src/proxy.ts`: Next.js 16 Network Boundary proxy. Do not rename to `middleware.ts`.

## 2. User Roles & Contributor Tiers

### 2.1 Unified 4-Tier User Hierarchy
The platform uses a unified 4-tier role hierarchy. Legacy roles ("Creator", "Student") are deprecated:
1. `USER`: Standard verified community member. Can browse feeds, submit posts, create problems, post solutions, and author lessons.
2. `MODERATOR`: Community steward. Access to reports triage queue, can soft-delete or lock flagged content, and apply user warnings.
3. `ADMIN`: Platform administrator. Full access to taxonomy merge tools, user sanctions, audit logs, and category management.
4. `SUPERADMIN`: Executive administrator with role promotion/demotion privileges.

### 2.2 The 5 Contributor Tiers (0–4) & Dynamic Vote Weights
In addition to account roles, all users progress through 5 Contributor Tiers based on accepted solutions, peer reviews, and reputation points:
- **Tier 0 (Novice / Contributor):** $1\times$ vote weight multiplier.
- **Tier 1 (Bronze Explorer):** $2\times$ vote weight multiplier.
- **Tier 2 (Silver Solver):** $3\times$ vote weight multiplier. Can evict unendorsed $\le 0$ solution attempts when a 7-slot problem pool is full.
- **Tier 3 (Gold Master):** $4\times$ vote weight multiplier.
- **Tier 4 (Scholar Fellow):** $5\times$ vote weight multiplier. Features animated scholar badge styling.

## 3. Dual-Layout Architecture
The application is organized into two distinct layout shells:
1. **General Platform Shell (`src/app/(app)/layout.tsx`):**
   - Standard shell for `forum`, `lessons`, `problems`, `study-plans`, `saved-sessions`, `users`, and `admin`.
   - Includes `AppHeader`, `AppFooter`, `CommandPalette` (`Cmd/Ctrl + K`), and `GlobalFAB`.
   - Main container is constrained to `max-w-6xl mx-auto px-4 py-6 sm:px-6`. Child views must **not** duplicate this outer container.
2. **Distraction-Free Workspace Shell (`src/app/(workspace)/layout.tsx`):**
   - Fullscreen zero-chrome workspace for past paper training (`train/[resourceId]`).
   - Features dedicated `TrainTopBar`, dual-PDF split viewer, curriculum sidebar navigation, and session timer.

## 4. Architecture Constraints
* **Proxy Layer (`src/proxy.ts`)**: Pure network boundary executed at the edge. Only use for `clerkMiddleware()` checks, basic edge redirects, and global headers.
* **Application Middleware (`src/lib/middleware/`)**: Node.js/React environment logic. Use for RBAC (`USER`, `MODERATOR`, `ADMIN`, `SUPERADMIN` checks), TanStack Query prefetching, data validation, and deeper business logic.

## 5. API Endpoint Verification
**CRITICAL RULE:** Every time you add a new feature or fix an existing feature on the frontend, you MUST verify that the API endpoints in the frontend code and documentations are consistent with the API endpoints defined by the backend. 
- Always cross-reference your API calls with the documentation located in `docs/frontend_handoff/`.
- Ensure payloads and response types exactly match the backend models.

## 6. Technology Stack Integration
* **Auth**: Clerk (Identity Provider). Session JWT must be attached to every API request header as `Authorization: Bearer <token>`. Do not handle auth manually.
* **Backend API**: REST API. Endpoints are paginated.
* **Network/Server State**: TanStack Query MUST be used for all API fetching, caching, and mutation (optimistic updates). Do not use bare `useEffect` for data fetching.
  * **Strict Cache Limits**: Our custom `cache-manager.ts` strictly limits list queries to 35 items and detail queries to 10 items. When building new features, ensure query keys follow existing conventions (e.g., `["posts", ...]`, `["post", id]`) or update the cache manager if introducing entirely new high-volume feeds.
  * **Prefetch on Intent**: Secondary tabs and routes should use `PrefetchingSubNav` or custom `onTouchStart`/`onMouseEnter` logic to trigger background prefetching, preserving Free Tier database read limits. Do not eagerly prefetch everything on initial page load.
* **Client UI State**: Zustand MUST be used for global UI state (e.g. read-only modes, limits, initial loading state orchestration).
* **DOM Optimization**: `react-virtuoso` MUST be used for long lists and threaded comments.
* **Cold Starts**: The backend is on Render free tier (30–50s cold start). Always implement robust loading states, dimensioned skeletons matching card geometry, and appropriate timeouts (~60s) for initial API calls to handle server wake-ups gracefully.

## 7. Strict UI/UX Guardrails
All agents must adhere to the rules in `.agents/UI_UX_GUIDELINES.md` and `DESIGN.md`:
* **Single Form Primitives:** Banning `const inputClass = "..."`. Always use `<Input />`, `<Textarea />`, and `<Field />` from `@/components/ui/`.
* **Composable Cards:** Always use `@/components/ui/card` or `BaseFeedCard`. Never copy raw inline card classes.
* **Semantic Tokens Only:** Banning arbitrary OKLCH box-shadows and inline hex in JSX.
* **Natural Window Scrolling:** Banning nested desktop feed scroll locks (`calc(100vh - 160px) overflow-y-auto`).
* **Read-Only Mode**: Users can be banned or sanctioned (24h, 7d, permanent). Write requests will fail with `403`. Implement UI logic to disable input fields and show a "Read-Only Mode" warning for restricted users.
* **Idempotent Toggles**: Follow, Vote, and Report actions are idempotent. Do not implement toggle logic by repeatedly calling `POST`. Use `DELETE` to undo actions.
* **Threaded Comments**: Fetch top-level comments, and provide a "View Replies" button that calls the `/replies/` endpoint. Do not render deep trees immediately.
* **30-Day TTL**: Forum posts and problems expire after 30 days. Display countdown warning badges.
* **Resource Limits**: Users are strictly limited to 3 Study Plans and 3 Saved Sessions. Proactively disable creation buttons when limits are reached or an empty collection exists.
* **File Uploads**: Max 5MB for posts (1 file), Max 20MB for lessons (5 files). Do not build video upload UI; use URL inputs for YouTube links.
* **Search**: Do not use a unified global search endpoint. Search is context-dependent via query parameters on respective list endpoints.

## 8. Workflow
Always follow the process outlined in `.agents/agent_workflow.md` (Plan -> Confirm -> Execute).
