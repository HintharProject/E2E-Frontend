# Endpoints Reference

This is a concise list of the implemented endpoints. For detailed payload schemas, refer to the backend's `/api/docs/` Swagger UI.

## 1. Identity (`/users/`)
- `GET /users/me/`: Get current user profile (Authenticated).
- `GET /users/{id}/`: Get public profile (Authenticated).
- `PATCH /users/{id}/role/`: Update user role (Admin only).
- `PATCH /users/{id}/ban/`: Update user ban status (Admin only).

## 2. Core Metadata (`/subjects/`, `/levels/`, `/tags/`)
- `GET /subjects/`: List all subjects (Public).
- `GET /levels/`: List all levels (Public).
- `GET /tags/`: Autocomplete for custom tags. Supports `?search=...` (Authenticated).

## 3. Community Forum (`/posts/`, `/comments/`)
- `GET /posts/`: List posts. Filterable by `subject`, `level`, `tags`, and feeds (`?feed=main|creator|announcement`). Supports search `?search=keyword`. (Authenticated).
- `POST /posts/`: Create a post.
- `GET /posts/{id}/`: Get post details.
- `DELETE /posts/{id}/`: Delete post (Owner/Admin).
- `GET /comments/?post_id={id}`: List comments on a post.
- `POST /comments/`: Add a flat-level comment.
- `PATCH /comments/{id}/`: Update a comment (Owner).
- `DELETE /comments/{id}/`: Delete a comment (Owner/Admin).

## 4. Learning (`/lessons/`)
- `GET /lessons/`: List lessons. Filterable by state (`?state=DRAFT|PUBLISHED|ARCHIVED`). Supports search `?search=keyword`. (Authenticated).
- `POST /lessons/`: Create lesson (Creator/Admin only).
- `GET /lessons/{id}/`: Get lesson details.
- `PUT /lessons/{id}/`: Update lesson content/state (Owner/Admin).
- `DELETE /lessons/{id}/`: Delete lesson (Owner/Admin).

## 5. Interactions (`/posts/{id}/vote/`, `/users/{id}/follow/`, etc.)
- `POST /posts/{id}/vote/`: Cast +1/-1 vote (Overwrites existing). Payload: `{"value": 1}`.
- `DELETE /posts/{id}/vote/`: Remove vote.
- `POST /lessons/{id}/vote/`: Cast +1/-1 vote.
- `DELETE /lessons/{id}/vote/`: Remove vote.
- `POST /users/{id}/follow/`: Follow a creator.
- `DELETE /users/{id}/follow/`: Unfollow a creator.

## 6. Collections (`/study-plans/`, `/saved-sessions/`)
- `GET /study-plans/`: List user's study plans.
- `POST /study-plans/`: Create a study plan (Max 3).
- `GET /study-plans/{id}/`: Retrieve plan details (Public if `is_public`=true, else Owner).
- `PATCH /study-plans/{id}/`: Update plan details.
- `DELETE /study-plans/{id}/`: Delete plan.
- `POST /study-plans/{id}/items/`: Add a lesson.
- `DELETE /study-plans/{id}/items/{item_id}/`: Remove item.
*(Saved Sessions follow the exact same pattern under `/saved-sessions/` but can accept both Posts and Lessons).*

## 7. Moderation (`/reports/`, `/audit-logs/`)
- `POST /reports/`: Submit a report against a Post, Lesson, or User. Payload requires exactly one target ID. `409` on duplicate.
- `GET /reports/`: List pending reports. Supports `?target_type=POST|LESSON|USER` (Admin only).
- `PATCH /reports/{id}/status/`: Resolve/dismiss report (Admin only).
- `GET /audit-logs/`: List immutable audit logs (Admin only).

## Search Strategy
Search functionality is exposed via query parameters on the respective resource list endpoints:
- **Post Search**: `GET /api/v1/posts/?search=keyword`
- **Lesson Search**: `GET /api/v1/lessons/?search=keyword`
Do not use a unified search endpoint. The frontend must query the appropriate endpoint based on the active UI context (e.g. Lesson/Post toggle).
