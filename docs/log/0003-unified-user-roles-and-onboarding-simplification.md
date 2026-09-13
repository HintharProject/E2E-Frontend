---
created_at: 2026-09-06T10:36:00Z
last_modified_at: 2026-09-06T10:36:00Z
---

# Unified User Roles, Universal Authoring, and Onboarding Simplification

## Date
2026-09-06

## Status
Accepted / Architecture Approved

## Context
The legacy role architecture partitioned users across static personas (`STUDENT`, `SENIOR_STUDENT`, `TEACHER`, `CREATOR`, `ADMIN`). This introduced significant architectural debt and friction:
1. **Onboarding Friction**: New users were blocked by a mandatory `/onboarding/role` selection screen before accessing the platform.
2. **Artificial Authoring Silos**: Students were forbidden from authoring lessons, while teachers/creators were blocked from posting problems, limiting community engagement.
3. **High Operational Overhead**: Teacher applications required manual admin review queues and dynamic rejection cooldowns; account graduation required dual-account linking and archiving.
4. **Static Role-Based Influence**: Voting power was hardcoded to static roles rather than earned community merit.

## Decision
1. **Unified 4-Tier Platform Role Model**:
   - **`USER`**: Universal end-user role. Auto-assigned on Just-In-Time (JIT) provisioning.
   - **`MODERATOR`**: Community safety staff with report queue triage, warning issuance, and content takedown capabilities.
   - **`ADMIN`**: Platform administrators with user suspension authority, role management (`USER` $\leftrightarrow$ `MODERATOR`), point adjustments, academic resource governance, and global announcements.
   - **`SUPERADMIN`**: Supreme system authority managing staff roles with last-active SuperAdmin safety invariant protection.
2. **Universal Authoring & Participation**:
   - All active `USER`s have full authoring rights across Posts (Question/Sharing), Lessons, Problems (with image attachment), and Solutions.
   - `subject_id` and `level_id` are strictly mandatory across all authored content (except Admin/SuperAdmin announcements).
3. **Merit-Based Dynamic Reputation (Tiers 0–4)**:
   - Vote weight is computed from `contribution_points` (Tier 0: 1x, Tier 1: 2x, Tier 2: 3x, Tier 3: 4x, Tier 4: 5x) with 10-point hysteresis protection.
4. **Decommissioned Workflows & UI Simplification**:
   - Removed `/onboarding/role` route and gate. JIT directly provisions `USER`.
   - Removed Teacher Application forms, status tracking, review queues, and cooldown handlers.
   - Removed Account Graduation flows and legacy account linking modals.
   - Removed role-based creation blocks on Problems and Lessons.

## Consequences
- Clean, friction-free onboarding directly into the application.
- Simplified frontend permission guards (`canModerate`, `canAdmin`, `canSuperAdmin`).
- Equal participation and merit-driven community hierarchy.
