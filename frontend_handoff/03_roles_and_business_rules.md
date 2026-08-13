# Roles, Business Rules & Constraints

This document outlines the strict business rules the frontend must accommodate in its UI and validation logic.

## 1. User Roles & Capabilities
- **`STUDENT`**: Default role. Can view content, create Posts (Question/Sharing), comment, vote, follow, and report.
- **`CREATOR`**: Can create Lessons, post Announcements, and manage their own content.
- **`ADMIN`**: Can delete any content, ban users, update roles, and manage reports.

## 2. Ban States & API Restrictions
Users are never hard-deleted. They progress through ban states (`ACTIVE` -> `WARNING` -> `BANNED_24H` -> `BANNED_7D` -> `PERMANENT_BAN`).
- If a user is restricted (24h, 7d, or Permanent), any state-changing (write) requests (`POST`, `PUT`, `PATCH`, `DELETE`) will return `403 Forbidden` with a `USER_BANNED` error code. 
- The frontend should hide/disable input fields or show a "Read-Only Mode" banner for restricted users.

## 3. Content Creation Constraints
- **Posts (by Students)**:
  - `post_type` must be explicitly `QUESTION` or `SHARING`.
  - `subject_id` and `level_id` are **strictly mandatory**.
- **Posts (by Creators/Admins)**:
  - Can use `ANNOUNCEMENT`.
  - Can optionally omit `subject_id` and `level_id` (the UI can leave them blank).
- **Lessons**:
  - `subject_id` and `level_id` are **strictly mandatory** for everyone.

## 4. Content Lifecycle (30-Day TTL)
- All `Post` entities have a strict 30-day expiration. They will be permanently deleted 30 days after their `created_at` timestamp.
- The UI should reflect this temporary nature (e.g., showing a "expires in X days" badge).

## 5. Collection Limits
- **Study Plans**: Maximum of 3 per user. Can ONLY contain Lessons.
- **Saved Sessions**: Maximum of 3 per user. Can contain BOTH Posts and Lessons.
- **Empty Rule**: A user cannot create a new Study Plan or Saved Session if they already have an empty one.
- **Frontend action**: Disable the "Create New" button if the user already has 3 collections of that type, or if one is empty.

## 6. Upload & File Constraints
File uploads use standard `multipart/form-data`.
- **Posts**: Max 1 file attachment per post. Max size: 5MB. Allowed: `.jpg`, `.png`, `.pdf`.
- **Lessons**: Max 5 attachments per lesson. Max size: 20MB. Allowed: `.pdf`, `.docx`, `.pptx`, `.zip`.
- **Videos**: Direct video upload is prohibited. The frontend must only provide an input field for an `embedded_video_url` (YouTube/Playlist URL).

## 7. Comments
- Comments are strictly flat. There are no nested comments to reduce overhead. Do not build UI for deeply threaded replies.
