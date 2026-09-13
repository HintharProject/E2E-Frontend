# Hinthar Education — E2E Platform (Frontend)

The student-facing learning and community portal for **[Hinthar Education](https://hinthar.education/)**. This platform provides a robust, minimal experience focused on creator-led learning and community-driven Q&A, optimizing for clarity and simplified knowledge retrieval without the complexity of traditional LMS systems.

---

## Tech Stack

| Category          | Technology                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| Framework         | [Next.js](https://nextjs.org/)                                             |
| Styling           | [Tailwind CSS](https://tailwindcss.com/)                                   |
| UI Components     | [Shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Icons             | [Lucide React](https://lucide.dev/)                                        |
| Animations        | [Framer Motion](https://www.framer.com/motion/)                            |
| Authentication    | [Clerk](https://clerk.com/)                                                |
| Hosting           | [Vercel](https://vercel.com/)                                              |
| Video             | YouTube Player API                                                         |

---

## Team

| Role                 | Member                  |
| -------------------- | ----------------------- |
| Coordinator          | Htun Tauk               |
| UI / UX Design       | Ent Tayza (Steven)      |
| Front End Dev        | Swam Naing              |
| Back End Dev         | Bhone Thwin             |

---

## Prerequisites

Before you begin, ensure your machine has the following installed:

- **Node.js** `>= 18.x` (LTS recommended)
- **npm** `>= 9.x` (ships with Node.js)
- **Git**

Verify your environment:

```bash
node -v   # ≥ 18
npm -v    # ≥ 9
git --version
```

---

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/HintharProject/E2E-Frontend.git
cd E2E-Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment

Copy the example env file and fill in Clerk keys:

```bash
cp .env.example .env.local
```

By default the app talks to the **hosted API** on Render:

| Setting | Value |
| ------- | ----- |
| API Base | `https://e2e-backend-4t9p.onrender.com/api/v1` |
| Swagger UI | [OpenAPI / Swagger](https://e2e-backend-4t9p.onrender.com/api/docs/) |

**Important Integration Caveat:**
- The backend is hosted on Render's free tier. If the backend is inactive for 15+ minutes, the first API request will take **up to 30-50 seconds** to wake up. Implement robust loading states for this.

Restart `npm run dev` after changing `.env.local`.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Hot reload is enabled by default.

---

## Project Structure (Overview)

```
E2E-Frontend/
├── src/
│   ├── app/            # Next.js App Router pages & layouts
│   ├── components/     # Reusable UI components (Shadcn/ui, custom)
│   ├── lib/            # Utility functions & API integrations
│   ├── proxy.ts        # Next.js 16 Middleware (formerly middleware.ts)
├── public/             # Static assets
├── next.config.mjs     # Next.js configuration
└── tsconfig.json       # TypeScript configuration
```

> [!NOTE]
> **Next.js 16 Convention**: The Next.js middleware file is intentionally named `proxy.ts` (instead of `middleware.ts`). This is a new convention introduced in Next.js 16 to emphasize its role as a network boundary. Do not rename this back to `middleware.ts`.

---

## Key Features

- **Forum Dashboard** — A dynamic community hub with a Main Feed for Q&A and sharing, an Announcements Feed, and a curated Feed. 
- **Lessons Board** — A repository for community- and educator-published educational resources (videos, documents) with prioritized visibility for followed authors.
- **Problems & Solutions** — Interactive STEM problem-solving with image attachments, community solutions, and accepted solution milestones (+10 reputation points).
- **Dynamic Reputation (Tiers 0–4)** — Merit-based progression decoupled from static roles, awarding 1x to 5x dynamic vote weighting based on contribution points.
- **Academic Resources** — Searchable repository for Past Exam Papers and Textbook bundles with direct streaming and downloads.
- **Collections** — Users can curate "Study Plans" (for lessons) and "Saved Sessions" (for posts and lessons), with public sharing capabilities.
- **Content Lifecycle** — A strict 30-day expiration rule for all forum posts to maintain freshness and prevent platform bloat.
- **Staff Moderation & Auditing** — Tiered staff governance (`MODERATOR`, `ADMIN`, `SUPERADMIN`) with fast report triage, user suspensions, and immutable audit logging.

---

## Backend API & Integration

The frontend uses Clerk session JWTs (`Authorization: Bearer <token>`) against the E2E REST API (`/api/v1/`). 

| Resource | URL |
| -------- | --- |
| Hosted API base | `https://e2e-backend-4t9p.onrender.com/api/v1` |
| Swagger UI | `https://e2e-backend-4t9p.onrender.com/api/docs/` |
| OpenAPI Schema | `https://e2e-backend-4t9p.onrender.com/api/schema/` |

### Core Roles (4-Tier Architecture)
- **`USER`**: Universal end-user role. Auto-assigned on JIT provisioning. Can post questions, author lessons, submit problems, solve challenges, vote (1x–5x weight), and create collections.
- **`MODERATOR`**: Community safety staff. Triage reports, issue warnings, and hide/lock/soft-delete violating content.
- **`ADMIN`**: Platform administrators. Issue suspensions, manage role elevations (`USER` $\leftrightarrow$ `MODERATOR`), adjust points, and manage academic resources.
- **`SUPERADMIN`**: Supreme system authority. Manages `ADMIN`/`SUPERADMIN` roles and accesses immutable audit logs.

---

## Deployment

This project is deployed on **Vercel**. Pushes to the `main` branch trigger automatic deployments. Preview deployments are created for every pull request.

Ensure Vercel env vars include `NEXT_PUBLIC_API_BASE_URL` and the respective Clerk keys.

---

## Related Links

- [Hinthar Education Website](https://hinthar.education/)
- [Backend Documentation & Schema](https://e2e-backend-4t9p.onrender.com/api/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [YouTube Player API Reference](https://developers.google.com/youtube/iframe_api_reference)
