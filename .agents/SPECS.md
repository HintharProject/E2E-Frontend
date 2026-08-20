# Frontend Technical Specifications (E2E Project)

## 1. Project Overview
E2E is a minimal, robust platform focused on creator-led learning and community-driven Q&A. The application is centered around a Forum Dashboard for questions/sharing and a Lessons Board for structured creator content.

## 2. API Integration & Environment
- **Base URL**: `https://e2e-backend-4t9p.onrender.com/api/v1` (Production) / `http://localhost:8000/api/v1` (Local)
- **Authentication**: Stateless via Clerk. All authenticated requests must include `Authorization: Bearer <Clerk_JWT>`.
  - JIT Provisioning: The backend automatically creates a User record upon the first authenticated request.
- **Cold Starts**: The free-tier backend sleeps after 15m. The frontend **must** implement robust loading states and long timeouts (~60s) to handle 30-50s cold start wakeups on the first request.
- **Storage Latency**: File attachments are served via Backblaze B2. Use optimistic UI updates and skeleton loaders to mask 200-300ms latencies.

## 3. Data Flow & Endpoints
- **Response Format**: Paginated list endpoints return `{ count, next, previous, results: [...] }`. TanStack Query MUST be used to manage this pagination and handle `useInfiniteQuery` where appropriate.
- **Error Format**: `{ "error": { "code": "...", "message": "...", "details": {...} } }`.
- **Idempotency**: Voting, following, and reporting are idempotent `POST` endpoints. Do not POST twice to toggle. Send a `DELETE` request to undo an action. Optimistic updates should be implemented via TanStack Query.
- **Search**: Do not use a unified search endpoint. Use `?search=keyword` on `/posts/` or `/lessons/` endpoints depending on the active UI view.
- **Comments**: Comments are threaded (nested). **Crucial**: Use lazy-loading. Fetch top-level comments from `/comments/?post_id={id}`, and only fetch replies from `/replies/?parent_id={id}` when requested by the user. Use `react-virtuoso` for virtualized rendering of long lists.

## 4. User Roles & Capabilities
- **Student (Default)**: Can view, follow, create Questions/Sharing posts, comment, vote, and manage 3 Study Plans + 3 Saved Sessions.
- **Creator**: Requires Admin approval. Can publish Lessons, make Announcements, and manage their content.
- **Admin**: Can delete content, ban users, update roles, and manage the moderation queue.

## 5. Strict Business Rules & UI Constraints
- **Content Creation**: Students **must** select a `subject_id` and `level_id` for posts. These are mandatory for Lessons across all roles.
- **Upload Constraints**: 
  - Posts: Max 1 file (5MB, .jpg, .png, .pdf). 
  - Lessons: Max 5 files (20MB, .pdf, .docx, .pptx, .zip).
  - Videos: Direct video upload is prohibited. The UI must only provide a URL input for embedded videos (YouTube).
- **Collection Limits**: Max 3 Study Plans (Lessons only) and 3 Saved Sessions (Posts + Lessons). The UI must disable the "Create New" button if the limit is reached or if an empty collection exists.
- **30-Day TTL**: All posts expire in 30 days. The UI should display an "expires in X days" badge.
- **Banned Users**: Users progress through `WARNING` -> `BANNED_24H` -> `BANNED_7D` -> `PERMANENT_BAN`. Banned users receive `403 Forbidden` on write actions. The frontend should display a "Read-Only Mode" banner or disable inputs.

## 6. Test Accounts (Password: `123teste2e123`)
- **Admin**: `dev.admin.e2e@gmail.com`
- **Creator**: `dev.admin.e2e+creator1@gmail.com`
- **Student**: `dev.admin.e2e+student1@gmail.com`

> **Note on Endpoints**: For full API and product details, reference the `.md` documents in `docs/frontend_handoff/`.
