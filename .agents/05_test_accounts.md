# Test Accounts

For testing different roles and permissions within the application, use the following pre-configured test accounts.

The password for **all** accounts is: `123teste2e123`

## SuperAdmin Account
- **SuperAdmin**: `dev.superadmin.e2e@gmail.com`
  - *Role*: `SUPERADMIN` — Full access to admin actions, role elevation/demotion of Admins/Moderators, audit log inspection, and safety invariants.

## Admin Account
- **Admin**: `dev.admin.e2e@gmail.com`
  - *Role*: `ADMIN` — Access to moderation queues, user suspension management, promotion/demotion of `USER` $\leftrightarrow$ `MODERATOR`, point adjustments, and Academic Resource management.

## Moderator Account
- **Moderator**: `dev.moderator.e2e@gmail.com`
  - *Role*: `MODERATOR` — Access to moderation triage queue, warning issuance, and content takedown (hides/locks/soft-deletions).

## Standard User Accounts
- **User 1 (Novice)**: `dev.user1.e2e@gmail.com`
  - *Role*: `USER` — Standard platform participant. Can create posts, author lessons, submit problems, solve questions, vote, and report.
- **User 2 (Contributor)**: `dev.user2.e2e@gmail.com`
  - *Role*: `USER` — High-reputation contributor testing Tier 1–4 vote multipliers.
