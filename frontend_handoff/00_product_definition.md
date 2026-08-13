# 1. Product Vision

E2E is a minimal, robust platform focused on creator-led learning and community-driven Q&A, optimizing for clarity and simplified knowledge retrieval without the complexity of traditional LMS systems.

# 2. Scope (In Scope / Out of Scope)

## In Scope
- **Core User Roles**: Admin (Superusers), Creator, Student
- **Role-Based Dashboards**: Specific interfaces for Admins, Creators, and Students.
- **Forum Dashboard**: Separated into 3 sections: Main Feed (Questions/Sharing), Announcements Feed (Admins only), and Creators Feed.
- **Lessons Board**: Repository for Creator-posted resources (documents, PDFs, zips, embedded YouTube/Playlist URLs). Prioritizes followed creators, but unfollowed content also appears.
- **Interactions**: Single flat-level comments with up/down votes for posts. Lessons do not have comments; they only have up/down votes. Each user is strictly limited to one vote per target, with values of +1 or -1. Changing a vote overwrites the previous value.
- **Collections**: Public and Private collections (Student Study Plans containing lessons, and saved sessions containing both posts and lessons), limited to 3 per user.
- **Content Lifecycle**: 30-day universal expiration period for all forum posts, which cascades to delete associated comments and attachments.
- **Moderation**: Immediate admin moderation queue triggered by a single user report (on Posts, Lessons, or Profiles). 
- **User Sanctions**: Banning system for users (Warning, 24 Hours, 7 Days, Permanent) instead of account deletion.
- **Search & Filtering**: Title-only text matching search, filterable by Subject, Level, Custom Tags, Post Types, and Lesson/Post option.

## Out of Scope
- **User Deletion**: No hard deletion of user accounts; replaced by a robust banning system.
- **Collaborative Study Plans & Saved Sessions**: Deferred to avoid complex permission and relationship mapping.
- **Threaded Discussions**: Replaced by robust context tags to avoid hierarchical comment depths.
- **Notification System / Noti Board**: Deferred to prevent database overhead.
- **Nested Comments / Replies**: Strictly flat comments implemented for MVP (posts only).
- **Universal "Ref to" Relinker**: Replaced with standard sharing links and save buttons.
- **General Bookmarking Boards**: Simplified down to strictly "Study Plans" (for lessons) and saved sessions.

# 3. User Roles

## 1. Admin (Superuser)
- **Role Management**: Can change the roles of other users (e.g., approving a user to become a Creator).
- **Forum Participation**: Can toggle between Question, Sharing, and Announcement post types. Subject and Level fields are optional.
- **Moderation**: Has access to the Moderation Queue to review reported posts, lessons, and user profiles.
- **Content Management**: Can Archive or Delete Lessons, and directly Delete posts (posts do not have an archived state).
- **User Sanctions**: Can issue bans (Warning, 24 Hours, 7 Days, Permanent) to users.

## 2. Creator
- **Approval Required**: Must be explicitly approved by an Admin to receive Creator privileges.
- **Lesson Management**: Can create, edit, and update lessons (including embedded YouTube/Playlist URLs).
- **Forum Participation**: Can toggle between Question, Sharing, and Announcement post types. Subject and Level fields are optional.
- **Lesson States**: Can manage the state of their lessons (Draft, Published, Archived).
- **Content Uploads**: Can include Lesson Docs and Resources within their published lessons.
- **Creator Feed**: Posts (Questions, Sharing, and Announcements) from Creators are aggregated into a dedicated "Creator Feed" for students who follow them, rather than the main feed.

## 3. Student
- **Engagement**: Can follow or unfollow Creators to prioritize their content in the Lessons Board and Creator Feed.
- **Forum Participation**: Can create, edit, and delete their own personal posts in the Forum Dashboard. Post type (Question or Sharing) is **mandatory** for students. Furthermore, **Subject** and **Level** fields are strictly required for student posts.
- **Interactions**: Can upvote and downvote posts and lessons.
- **Collections**: Can create and manage "Study Plans" (lists of lessons) and "Saved Sessions" (lists of posts and lessons, Public or Private), up to a maximum of 3 each.
- **Reporting**: Can report posts, lessons, and user profiles (limited to one report per user per item), which sends the item directly to the Admin moderation queue.

# 4. Core Modules

## 1. Authentication & Authorization (via Clerk)
Handles user registration, login, session management, and base identity. Role authorization (Admin, Creator, Student) is managed alongside the application logic, with Clerk serving as the primary identity provider. **Note**: The system will sync and store the user's display name and profile image URL in the backend database for efficient querying.

## 2. Forum Dashboard
The primary social feed where students and creators interact, separated into 3 sections:
- **Main Feed**: For general Question and Sharing posts.
- **Announcements Feed**: Strictly for Admin announcements.
- **Creators Feed**: Aggregates all posts (Questions, Sharing, Announcements) from a student's followed creators.
Architecturally, all feeds are powered by a **single `Post` table** and differentiated entirely through filtered database queries based on Post Types, User Roles, and follower relationships. It supports filtering by Subject, Level, and Custom Tags (where users can enter tags and the system provides autocomplete suggestions to prevent redundancy). Includes the upvote/downvote system and flat-level commenting functionality.

## 3. Lessons Board
A dedicated repository for educational content. It allows Creators to publish structured lessons containing rich text, document attachments, and embedded YouTube/Playlist URLs. Content here is heavily prioritized towards followed creators, but unfollowed creator content is also accessible. Searchable and filterable.

## 4. Study Plans & Saved Sessions
The user's personal organization space. It allows students to save posts and lessons for future reference and compile specific lessons into curated "Study Plans". These can be toggled between Public (visible on profile) or Private. Max 3 Study Plans and 3 Saved Sessions per user.

## 5. Admin & Moderation Queue
The administrative control center. It processes incoming user reports in real-time, categorized into separated **Profile**, **Post**, and **Lesson** sessions. Reports flow through three minimal states: **Pending**, **Resolved**, and **Dismissed**. Allows Admins to review reported items, archive/delete lessons, directly delete posts, and issue user bans (Warning, 24h, 7d, Permanent). It also mandates immutable audit logs for all critical admin actions (e.g., deletions, bans). 

## 6. Search & Filtering
A lightweight discovery module focused strictly on simple string matching (e.g., standard SQL `ILIKE`) against Post and Lesson titles. To strictly avoid overengineering, this module will not use external search services (like Elasticsearch) or complex full-text indexing. It includes filtering options by Context Tags, Post Types, and Lesson/Post category to refine results.

# 5. Functional Requirements

## 1. Authentication & Authorization
- The system must integrate with Clerk for user signup, login, and session management.
- The system must sync and store the user's display name and profile image URL in the local database.
- The system must assign a default "Student" role to all new registrations.
- The system must allow Admins to manually toggle a user's role to "Creator".
- The system must support banning states (Warning, 24 Hours, 7 Days, Permanent) instead of account deletion.

## 2. Forum Dashboard
- The system must display three separated feed sections: Main Feed, Announcements (Admin only), and Creators Feed.
- The system must enforce the selection of a post type ("Question" or "Sharing"), along with a "Subject" and "Level", for all student uploads.
- The system must allow Admins to post Announcements that remain in the Admin Announcements feed.
- The system must allow Admins and Creators to optionally omit the Subject and Level fields in their posts.
- The system must allow Creators to post Announcements, Questions, and Sharing posts, which all route to the Creators Feed of their followers.
- The system must allow users to upvote or downvote posts (excluding Announcements).
- The system must allow users to add flat-level comments to posts.

## 3. Lessons Board
- The system must allow Creators to create, edit, and manage states (Draft, Published, Archived) of lessons.
- The system must prioritize and display lessons from a student's followed Creators at the top of the board, while still showing unfollowed content below.
- The system must allow Creators to include embedded YouTube video or playlist URLs in lessons.
- The system must allow Creators to attach approved file types to lessons.
- The system must ensure lessons are searchable and filterable by tags.

## 4. Study Plans & Saved Sessions
- The system must allow students to save forum posts and lessons into multiple "Saved Sessions" (max 3 per user).
- The system must allow students to save lessons into multiple "Study Plans" (max 3 per user).
- The system must prevent the creation of a new Study Plan or Saved Session if the user already has an empty one of the same type.
- The system must allow users to toggle their Study Plans and Saved Sessions between "Public" and "Private" visibility.
- The system must generate a shareable URL for Public Study Plans and Saved Sessions.

## 5. Admin & Moderation Queue
- The system must provide a "Report" button on all Posts, Lessons, and User Profiles.
- The system must immediately route reported content to an Admin Moderation Queue dashboard.
- The Mod Queue must have separated sessions for Profiles, Posts, and Lessons.
- The system must manage reports using a simple state machine: **Pending** -> **Resolved** (action taken) or **Dismissed** (no action taken).
- The system must allow Admins to view, archive, or permanently delete reported Lessons, and directly delete Posts.
- The system must allow Admins to issue bans (Warning, 24 Hours, 7 Days, Permanent) to users based on Profile reports or severe content violations.
- The system must generate immutable audit logs for all bans and hard deletions performed by Admins, capturing the Admin ID, Action, Target, and Timestamp.

## 6. Search & Filtering
- The system must provide a search bar that executes a text match query exclusively against Post and Lesson titles.
- The system must provide filtering options by Subject, Level, Custom Tags, Post Types, and whether the item is a Lesson or Post.

# 6. Business Rules

## 1. Operational Logic

*   **Content Lifecycle (30-Day Rule)**: All forum posts expire and are permanently deleted 30 days after their creation date. This deletion cascades to the post's comments and attachments. If a post is in a "Saved Session", it will disappear from that session upon expiration.
*   **Reporting Threshold**: A user is limited to reporting a specific post, lesson, or profile **only once**. A single report immediately flags the item and sends it to the respective section in the Admin Moderation Queue.
*   **Admin Announcements**: When posted by an Admin, announcements appear in the dedicated Announcements feed.
*   **Creator Feed**: Posts (including announcements) from Creators are not pinned in the main feed. Instead, all posts from Creators a student follows are aggregated into the "Creator Feed".
*   **Study Plan & Saved Session Constraints**: A user can have a maximum of 3 Study Plans (containing only Lessons) and 3 Saved Sessions (containing both Posts and Lessons). A new Study Plan or Saved Session cannot be created if an empty one of the same type already exists.
*   **Post & Lesson Constraints**: Every post created by a student must be explicitly typed as either a "Question" or "Sharing" and must include a Subject and Level. Admins and Creators can toggle between all three post types and can omit Subject and Level on Posts. However, **Subject and Level are mandatory for all Lessons**. Custom tags are optional for all users.
*   **Banning System**: Users cannot be deleted. Rule violations result in bans with progressive durations: Warning, 24 Hours, 7 Days, and Permanent.

## 2. Text Constraints

| Content Type | Title Limit | Body Limit | Justification |
| :--- | :--- | :--- | :--- |
| **Forum Posts** | 100 characters | 3,000 characters | Accommodates detailed questions while preventing spam. |
| **Comments** | N/A | 1,000 characters | Enforces concise responses and prevents visual bloat. |
| **Lessons** | 100 characters | 5,000 characters | Provides space for comprehensive context and instructions. |

## 3. Upload Constraints

*Directly hosting large video files incurs significant costs. External links (embedded YouTube/Playlist URLs) must be used for videos.*

| Upload Type | Max Size | Allowed Formats | Quantity Limit |
| :--- | :--- | :--- | :--- |
| **Post Attachments** | 5 MB | `.jpg`, `.png`, `.pdf` | Max 1 file per Post |
| **Lesson Resources** | 20 MB | `.pdf`, `.docx`, `.pptx`, `.zip` | Max 5 files per Lesson |

# 7. Open Questions / Future Enhancements

## Open Questions
*None currently open. The MVP scope is strictly defined and ready for architecture planning.*

## Future Enhancements Backlog
The following features were explicitly discussed but deferred to future phases to keep the MVP scope minimal and avoid unnecessary database complexity:

- **Collaborative Study Plans & Saved Sessions**: Allowing multiple users to add to or manage a shared list (deferred due to complex permission and relationship mapping).
- **Advanced Notifications**: A comprehensive notification board alerting users of comments, upvotes, or new lessons (deferred due to database overhead).
- **Universal "Ref to" Relinker**: A system to universally link lessons, posts, and comments dynamically within other text (replaced by standard share URLs).
- **Threaded Discussions**: Nested comment replies or sub-threads (deferred; implemented flat-level comments).
- **Advanced Full-Text Search**: Indexing the body content of posts, comments, and lessons for deeper searchability (deferred; implemented title-only search).
- **General Bookmarking Boards**: Allowing free-form bookmarking of disparate items (streamlined to strictly "Study Plans" and "Saved Sessions").

# 8. System Glossary

* **Lesson**: Creator-posted educational resources (docs, PDFs, zips, embedded YouTube links). Lessons do not support comments; they only have up/down votes and are collected into Study Plans. They can be Drafted, Published, or Archived.
* **Post**: A user-generated entry in the Forum Dashboard. Must be categorized as a "Question", "Sharing", or "Announcement" (subject to a strict 30-day expiration TTL). Posts do not have an "Archived" state, they are only active or deleted.
* **Post Types**:
  * **Question**: A request for help or clarification, mandatory option for students.
  * **Sharing**: Sharing knowledge or resources, mandatory option for students.
  * **Announcement**: Official updates. Admins post to the Announcements Feed; Creators post to their followers' Creator Feed.
* **Study Plan**: A curated list exclusively for storing *Lessons* (maximum 3 per student).
* **Saved Session**: A list for storing both *Posts* and *Lessons* (maximum 3 per student).
* **Creator Feed**: A dedicated, aggregated feed of posts (all types) specifically from a student's followed Creators.
* **Admin Announcements Feed**: A dedicated feed section for Admin-created announcements.
* **Main Feed**: A feed section for student-created Questions and Sharing posts.
* **Subject & Level**: Required fields for student posts and **all** lessons. Optional for Admin and Creator posts. Used for core filtering.
* **Custom Tag**: Optional user-entered text tags used for additional filtering. The system suggests existing tags to minimize redundancy.
* **Moderation Queue Sections**: The Admin dashboard is split into **Profile**, **Post**, and **Lesson** queues to categorize incoming reports.
* **Banning**: The system action taken against rule-breaking users instead of account deletion (Warning, 24 Hours, 7 Days, Permanent).

# 9. State Diagrams

**Lesson State Flow**
```text
Draft
  ↓↑
Published
  ↓↑
Archived
```
*(Note: Lessons can transition from Draft to Published, Published to Archived, and Archived back to Published).*

**Post State Flow**
```text
Created
  ↓
Reported
  ↓
Deleted
```
*(Note: Posts do not have an Archived state. They automatically transition to Deleted when the 30-day TTL expires, or manually by an Admin/Owner).*

**User Status Flow**
```text
Active
  ↓↑
Warning / 24h Ban / 7d Ban
  ↓
Permanent Ban
```

# 10. Domain Boundaries

These logical boundaries define our modules moving into System Design:

* **Identity & Access (Users)**: Users, Roles (Clerk mapping), User Profiles, Banning Logic
* **Learning (Lessons)**: Lessons, Lesson Attachments, Embedded Videos (YouTube/Playlists)
* **Community (Posts)**: Posts (Questions/Sharing/Announcements), Feeds (Main/Announcements/Creators)
* **Interactions**: Comments (Posts only), Upvotes/Downvotes (Posts and Lessons)
* **Moderation**: Reports, Admin Queue (Profile/Post/Lesson sessions)
* **Study Plans & Saved Sessions**: Study Plans, Saved Sessions
* **Discovery (Search)**: Search, Filtering (Subject, Level, Custom Tags, Post Types, Lesson/Post)
