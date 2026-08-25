# UI Migration Specs

This document serves as the text-based UI blueprint for migrating the visual design and interactive layout from `E2E-Proto` to `E2E-frontend`. 

> **Important**: `E2E-Proto` is strictly a visual and UI reference. Do **not** migrate Prisma, database logic, Server Actions, API routes, or legacy data-fetching. Data fetching should use TanStack Query hooks interfacing with the `E2E-backend`.

## 1. Global Styling & Theme

> **Note on Shadcn Preset**: We are overwriting the overwritable components, UI, fonts, and colors migrated from `E2E-Proto` with the decided Shadcn preset. The preset code is --preset b6DIPqb1jW.

The prototype uses **Tailwind CSS v4** with a custom theme defined primarily in `src/app/globals.css` via inline `@theme`.

- **Colors (OKLCH)**:
  - Custom color palette including `brand`, `brand-dark`, `brand-soft`, `surface`, `surface-raised`, `ink`, `ink-muted`, `line`, `danger`, `warning`.
  - Supports `.dark` mode variable overrides.
- **Fonts**:
  - **Sans (Body)**: Outfit (mapped to `--font-body`)
  - **Display (Headings)**: Fraunces (mapped to `--font-display`)
- **Visual Patterns**:
  - Extensive use of glassmorphism / soft transparency (e.g., `bg-white/90`, `bg-background/90 backdrop-blur-md`).
  - Cards feature hover transitions (`hover:border-brand/35 hover:shadow-[...]`).
  - Standardized empty states with dashed borders (`border-dashed border-line`).

## 2. Reusable UI Components

The `E2E-Proto` contains core reusable components that should be migrated to `E2E-frontend/src/components/ui/` or similar structure.

### `components/ui.tsx`
- **Badge**: State/status indicators (`tone`: neutral, brand, warn, danger, muted).
- **Button**: Standard buttons and links (`variant`: primary, secondary, ghost, danger).
- **PageHeader**: Consistent page titling with title, description, and action slots.
- **EmptyState**: Standardized empty state indicator with a dashed border.
- **FilterBar**: Top bar for filters.
- **Field**: Form field label wrapper.
- **SubNav**: Horizontal scrolling secondary navigation (tabs).
- **Avatar**: User avatar with initial fallback.
- **inputClass**: Exported string of standard input styles.

### Domain-Specific Components
- **`AppHeader`** (`components/app-header.tsx`): Main sticky top navigation. Includes responsive search bar, role-specific nav links, user profile/avatar, and account warning/ban banners.
- **`FilterSidebar`** (`components/filter-sidebar.tsx`): A sticky sidebar for filtering content by Subject, Level, Type, and Tag. Uses URL search parameters for state (`?subject=...&level=...`).
- **`ContentCards`** (`components/content-cards.tsx`):
  - **PostCard**: Displays forum posts with author info, badges (type/tags), and vote/comment stats.
  - **LessonCard**: Displays lessons with author info, state badges (Published, Draft), tags, and edit actions.

## 3. Page Structure & Navigation

The application uses the Next.js App Router pattern.

### Layouts
- **Root Layout** (`app/layout.tsx`): HTML/Body wrappers, global fonts, ClerkProvider setup.
- **App Layout** (`app/(app)/layout.tsx`): Wraps authenticated/app routes with the `AppHeader`.

### Main Routes & Sub-routes
- `/forum`: Main forum view, sub-routes for `/announcements`, `/creators`.
- `/lessons`: Main lessons view, sub-routes for `/mine`, `/new`, `/[id]`, `/[id]/edit`.
- `/posts`: Sub-routes for `/new`, `/[id]`, `/[id]/edit`.
- `/study-plans`: Collections view, sub-routes for `/[id]`.
- `/saved-sessions`: Saved sessions, sub-routes for `/[id]`.
- `/users/[id]`: User profile views.
- `/search`: Search results page (driven by `?q=` query param).
- `/admin`: Admin dashboard, sub-routes for `/audit-logs`, `/reports/...`.
- `/sign-in` & `/sign-up`: Authentication pages.

## 4. Role-Based Access Control (RBAC) & UI States

### Application-Level RBAC
The frontend implements application-level RBAC distinct from the Next.js network boundary proxy (`proxy.ts`). 
- **Pattern**: A Higher-Order Component (HOC) or wrapper located at `src/lib/middleware/withRoleAuth.tsx`.
- **Function**: Restricts component rendering based on the user's role (`Admin`, `Creator`, `Student`). If unauthorized, it renders an "Access Denied" UI or redirects.

### Visible UI Differences
- **Nav Links**: 
  - `My Lessons` tab is only visible to users with the `CREATOR` role.
  - `Admin` tab is only visible to users with the `ADMIN` role.
- **Ban States & Warnings** (Rendered in `AppHeader`):
  - **Warning**: A top banner (`bg-brand-soft`) is shown if `user.banState === "WARNING"`.
  - **Write-Locked (Banned)**: A red warning banner (`bg-warning`) indicates read-only mode if `user.banState` is write-locked. 
- **Content Cards**:
  - `LessonCard` shows "Edit" button and Draft badges if the user owns the lesson and it is not published.

## 5. Responsive Behavior

- **Mobile First**: Utilizes Tailwind's mobile-first breakpoints.
- **Header/Search**: The search bar in the header is hidden on mobile (`hidden md:block`) in the main slot, and rendered below the nav items on mobile (`md:hidden`).
- **Navigation**: Uses `overflow-x-auto` to allow horizontal scrolling on small screens for tabs (`SubNav` and `AppHeader` nav links).
- **Sidebar**: The `FilterSidebar` takes full width on mobile but shrinks to a fixed width on large screens (`w-full lg:w-56`).

## 6. Migration Enhancements (Phase 1 Extensions)

Based on the discrepancies between the visual `E2E-Proto` and the final backend requirements (`SPECS.md`), the following UI behaviors must be structurally defined during the `E2E-frontend` implementation since they are either missing or overly simplified in the prototype:

### Loading States & Skeletons (Cold Start Handling)
- **Background**: The backend has a 30-50s cold start time, and Backblaze B2 introduces 200-300ms latency.
- **Spec**: Implement global and component-level skeletons. Use pulsing states (`animate-pulse`) for cards and text blocks. For long cold-start requests, include small contextual text (e.g., "Waking up server..." or "Processing...") alongside loading spinners to keep the user informed.

### Form Validation & Upload UI States
- **Background**: The prototype utilizes basic HTML `<input type="file">` and standard `required` attributes, which are insufficient for the strict rules in `SPECS.md` (e.g., max limits, sizes).
- **Spec**:
  - **Validation Errors**: Highlight inputs with a red border (`border-danger`), accompanied by helper text in `text-danger text-sm` directly below the field.
  - **Upload States**: Enhance the file input into a drag-and-drop zone using standard dashed borders (`border-dashed border-line`). Display active upload progress and explicitly list accepted file types/sizes.
  - **Disabled States**: For buttons that reach their limit (like the max 3 Study Plans), use a faded opacity (`opacity-50 cursor-not-allowed`) and add a small explanatory tooltip or text nearby.

### Threaded Comments Visuals
- **Background**: The prototype explicitly states: *"Flat comments only — no nested replies."* However, `SPECS.md` demands threaded/nested comments via lazy loading.
- **Spec**: Threaded replies should be indented with a left border (`border-l-2 border-line ml-4 pl-4`) to indicate hierarchy. Include a "Load replies" button (`variant="ghost" text-sm`) to trigger the `/replies/` endpoint. Use `react-virtuoso` to handle the virtualized rendering of these expanded lists cleanly.

### Animation Strategy (Shadcn vs Framer Motion)
- **Decision**: Avoid heavily relying on Framer Motion to maintain a fast, lightweight, and "minimal, robust" web app experience.
- **Spec**: Utilize Shadcn UI's built-in Radix animations and `tailwindcss-animate` for standard interactions (e.g., dropdowns, dialog fade-ins, accordion expansions). CSS transitions (`transition-all duration-200 ease-in-out`) are sufficient for hover effects and layout shifts. Framer Motion should be completely excluded to optimize bundle size and initial load speeds, unless complex physics-based layout orchestration becomes an absolute necessity later.
