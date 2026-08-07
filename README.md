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
├── public/             # Static assets
├── next.config.mjs     # Next.js configuration
└── tsconfig.json       # TypeScript configuration
```

---

## Key Features

- **Forum Dashboard** — A dynamic community hub with a Main Feed for Q&A and sharing, an Announcements Feed, and a curated Creators Feed. 
- **Lessons Board** — A repository for creator-published educational resources (videos, documents) with prioritized visibility for followed creators.
- **Interactions & Feedback** — Flat-level comments and a strict one-vote up/down system for all posts and lessons.
- **Collections** — Students can curate "Study Plans" (for lessons) and "Saved Sessions" (for posts and lessons), with public sharing capabilities.
- **Content Lifecycle** — A strict 30-day expiration rule for all forum posts to maintain freshness and prevent platform bloat.
- **Role-Based Moderation** — A fast, Admin-controlled Moderation Queue driven by community reports and enforced through user bans.

---

## Backend API & Integration

The frontend uses Clerk session JWTs (`Authorization: Bearer <token>`) against the E2E REST API (`/api/v1/`). 

| Resource | URL |
| -------- | --- |
| Hosted API base | `https://e2e-backend-4t9p.onrender.com/api/v1` |
| Swagger UI | `https://e2e-backend-4t9p.onrender.com/api/docs/` |
| OpenAPI Schema | `https://e2e-backend-4t9p.onrender.com/api/schema/` |

### Core Roles
- **Admin**: Has superuser privileges, can post announcements globally, manages the Moderation Queue, and can issue bans.
- **Creator**: Specifically approved users who can publish/draft lessons and have their posts prioritized in followers' Creator Feeds. 
- **Student**: Default role. Can follow creators, manage collections, post questions/sharing (with mandatory subject/level tags), and report content.

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
