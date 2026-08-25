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
* `src/components/ui/`: Reusable, generic UI components (Buttons, Inputs) generated primarily via Shadcn.
* `src/components/layout/`: Structural components (Navbars, Footers).
* `src/components/features/`: Domain-specific components.
* `src/components/providers/`: Global React providers (e.g., QueryClientProvider).
* `src/lib/`: Utility functions.
* `src/lib/middleware/`: Application-level middleware, HOCs, and wrappers (RBAC, validation).
* `src/lib/store/`: Zustand state stores.
* `src/hooks/`: Custom React hooks.
* `src/services/`: All backend API calls must be defined here. Do not inline `fetch` or `axios` calls inside components.
* `src/types/`: TypeScript interfaces and models.
* `src/proxy.ts`: Next.js 16 Network Boundary proxy. Do not rename to `middleware.ts`.

## 6. Architecture Constraints
* **Proxy Layer (`src/proxy.ts`)**: Pure network boundary executed at the edge. Only use for `clerkMiddleware()` checks, basic edge redirects, and global headers.
* **Application Middleware (`src/lib/middleware/`)**: Node.js/React environment logic. Use for RBAC (Admin, Creator, Student checks), TanStack Query prefetching, data validation, and deeper business logic.

## 2. API Endpoint Verification
**CRITICAL RULE:** Every time you add a new feature or fix an existing feature on the frontend, you MUST verify that the API endpoints in the frontend code and documentations are consistent with the API endpoints defined by the backend. 
- Always cross-reference your API calls with the documentation located in `docs/frontend_handoff/`.
- Ensure payloads and response types exactly match the backend models.

## 3. Technology Stack Integration
* **Auth**: Clerk (Identity Provider). Session JWT must be attached to every API request header as `Authorization: Bearer <token>`. Do not handle auth manually.
* **Backend API**: REST API. Endpoints are paginated.
* **Network/Server State**: TanStack Query MUST be used for all API fetching, caching, and mutation (optimistic updates). Do not use bare `useEffect` for data fetching.
  * **Strict Cache Limits**: Our custom `cache-manager.ts` strictly limits list queries to 35 items and detail queries to 10 items. When building new features, ensure query keys follow existing conventions (e.g., `["posts", ...]`, `["post", id]`) or update the cache manager if introducing entirely new high-volume feeds.
  * **Prefetch on Intent**: Secondary tabs and routes should use `PrefetchingSubNav` or custom `onTouchStart`/`onMouseEnter` logic to trigger background prefetching, preserving Free Tier database read limits. Do not eagerly prefetch everything on initial page load.
* **Client UI State**: Zustand MUST be used for global UI state (e.g. read-only modes, limits, initial loading state orchestration).
* **Rich Text Editing**: Tiptap is used for all rich text inputs.
* **DOM Optimization**: `react-virtuoso` MUST be used for long lists and threaded comments.
* **Cold Starts**: The backend is on a free tier. You must always implement robust loading states, skeletons, and appropriate timeouts (~60s) for initial API calls to handle server wake-ups gracefully.

## 4. Strict UI/UX Rules
* **Read-Only Mode**: Users can be banned (24h, 7d, permanent). Write requests will fail with `403`. Implement UI logic to disable input fields and show a "Read-Only Mode" warning for restricted users.
* **Idempotent Toggles**: Follow, Vote, and Report actions are idempotent. Do not implement toggle logic by repeatedly calling `POST`. Use `DELETE` to undo actions.
* **Threaded Comments**: Fetch top-level comments, and provide a "View Replies" button that calls the `/replies/` endpoint. Do not render deep trees immediately.
* **30-Day TTL**: Forum posts expire after 30 days. Display countdown badges.
* **Resource Limits**: Users are strictly limited to 3 Study Plans and 3 Saved Sessions. Proactively disable creation buttons when limits are reached.
* **Forms and Validation**:
  * Posts require `subject_id` and `level_id`. Lessons require them for all users.
  * File uploads: Max 5MB for posts (1 file), Max 20MB for lessons (5 files). Do not build video upload UI; use URL inputs for YouTube links.
  * Error Handling: Catch backend errors (`{"error": {"code": "...", "details": {...}}}`) and bind detailed field errors to the UI forms.
* **Search**: Do not use a unified global search endpoint. Search is context-dependent via query parameters on respective list endpoints.

## 5. Workflow
Always follow the process outlined in `.agents/agent_workflow.md` (Plan -> Confirm -> Execute).
