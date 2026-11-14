# UI/UX & Styling Guidelines for AI Agents

> **Audience:** All AI Agents and Developers writing or refactoring frontend code in `E2E-frontend`.  
> **Status:** Strictly Enforced Guardrails.  
> **Non-Negotiable Rule:** Violations of these rules will cause PR rejections and rollback of code.

---

## 1. The Core Invariants

### 1.1 Rule of Single Primitive (Ban on `const inputClass`)
- **NEVER** declare `const inputClass = "..."` or copy raw input styling into feature components.
- **NEVER** write raw `<input className="..." />` or `<textarea className="..." />`.
- **ALWAYS** import and use standardized form primitives from `@/components/ui/`:
  - `<Input />` (from `@/components/ui/input`)
  - `<Textarea />` (from `@/components/ui/textarea`)
  - `<Field />` (from `@/components/ui/field`)
- **Preserve Form Hooks:** Always forward `react-hook-form` registrations (`{...register("fieldName")}`) and bind validation errors to `aria-invalid` and `<Field error={errors.fieldName?.message} />`.

### 1.2 Rule of Composable Cards (Ban on Inline Card Class Clones)
- **NEVER** duplicate raw card classes across multiple files:
  ```tsx
  // ❌ STRICTLY FORBIDDEN:
  <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_12px_40px_...oklch...]">
  ```
- **ALWAYS** use the standardized composable `<Card>` primitive kit from `@/components/ui/card` or `BaseFeedCard`:
  ```tsx
  // ✅ REQUIRED PATTERN:
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{content}</CardContent>
    <CardFooter>{actions}</CardFooter>
  </Card>
  ```

### 1.3 Rule of Semantic Tokens (Ban on Raw OKLCH / Hex in JSX)
- **NEVER** write arbitrary OKLCH, RGB, or hex color values in component JSX:
  ```tsx
  // ❌ STRICTLY FORBIDDEN:
  hover:shadow-[0_12px_40px_-24px_oklch(0.508_0.118_165.612_/_0.45)]
  bg-[#0d1520]
  text-[oklch(0.987_0.002_197.1)]
  ```
- **ALWAYS** use canonical Tailwind utility classes backed by semantic CSS variables:
  - Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
  - Text: `text-foreground`, `text-muted-foreground`, `text-primary`
  - Borders: `border-border`, `border-border/50`
  - Elevation: `shadow-sm`, `shadow-card`, `shadow-card-hover`
  - Badges: `bg-tier-X-bg text-tier-X border-tier-X/30`

### 1.4 Layout Rule (Ban on Negative Margins & Double Containers)
- **NEVER** use negative margins (`-mt-3`, `-mt-4`, `-mx-4`) to compensate for parent padding.
- **NEVER** wrap page content in a redundant `max-w-6xl mx-auto px-4` container if `AppLayout` already provides it.
- **ALWAYS** structure layouts so that padding is managed cleanly at the layout boundary (`src/app/(app)/layout.tsx`) and spacing between components is handled with natural flex/grid gaps (`gap-6`, `space-y-6`).

### 1.5 Scroll Rule (Ban on Desktop Feed Scroll Traps)
- **NEVER** place desktop feed lists inside fixed-height scroll containers:
  ```tsx
  // ❌ STRICTLY FORBIDDEN:
  <div className="lg:h-[calc(100vh-160px)] lg:overflow-y-auto lg:custom-scrollbar">
  ```
- **ALWAYS** allow feeds to occupy their natural DOM height so that the browser window scrolls.
- **STICKY SIDEBARS:** When sidebars or filter panels need to remain visible while scrolling, make the sidebar sticky instead of locking the feed:
  ```tsx
  // ✅ REQUIRED PATTERN:
  <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20">
    <FilterSidebar />
  </aside>
  ```

---

## 2. Accessibility Invariants (WCAG 2.2 AA)

Every user interface created or edited in this repository must comply with WCAG 2.2 Level AA requirements:

1. **Text Contrast Ratio:**
   - Body text, button labels, and input values must achieve at least **4.5:1** contrast against their background.
   - Large text ($\ge 18\text{pt}$ or $\ge 14\text{pt}$ bold) must achieve at least **3:1** contrast.
   - Placeholder text must achieve at least **4.5:1** against the input surface.
2. **Keyboard Focus Management:**
   - All interactive controls (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, tabs) must display a high-contrast focus indicator when navigated via keyboard:
     ```tsx
     className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
     ```
   - Never suppress focus rings with `outline-none` unless accompanied by an explicit `focus-visible:ring-*` definition.
3. **Touch Targets for Mobile:**
   - On viewports $< 768\text{px}$, every clickable element must have a minimum target size of **44 × 44px**.
   - If visual text or icons are smaller, use padding or pseudo-elements (`after:absolute after:-inset-2`) to enlarge the tap boundary.
4. **Accessible Labels for Icon Controls:**
   - Every icon button lacking visible text must provide an explicit `aria-label`:
     - Bookmark / Save button: `aria-label="Save to study plan or session"`
     - Vote up: `aria-label="Upvote this post"`
     - Vote down: `aria-label="Downvote this post"`
     - More menu: `aria-label="More options"`
     - Theme switcher: `aria-label="Toggle color theme"`
     - Hamburger toggle: `aria-label="Open mobile navigation menu"`
5. **Reduced Motion Respect:**
   - All animated transitions must be disabled or shortened to $\le 0.01\text{ms}$ when `@media (prefers-reduced-motion: reduce)` is active.

---

## 3. Visual & Aesthetic Standards (Swiss Academic Clean)

- **Icons:** Always use `lucide-react`. Never use raw emoji glyphs (e.g. 📚, ✍️, 💡) as functional icons.
- **No Decorative Gradients on Text:** Keep headers solid in `text-foreground` or `text-primary`.
- **No Heavy Drop Shadows:** Use clean, subtle directional shadows with soft ambient blur (`shadow-sm`, `shadow-card`).
- **Cold-Start Masking:** The backend runs on Render free-tier and experiences 30–50s cold starts. Always render dimensioned skeleton placeholders (`<Skeleton />`) matching the exact bounding box of the incoming card to keep Cumulative Layout Shift (CLS) $< 0.1$.
- **Error States:** Display field validation errors immediately below the field with high-contrast text (`text-destructive text-xs mt-1.5`) and an `aria-live="polite"` or `role="alert"` container.

---

## 4. Preservation of Business Logic

Under no circumstances may UI refactoring alter:
1. Data fetching hooks in `src/hooks/` or API clients in `src/services/`.
2. Clerk authentication logic (`useAuth`, `UserButton`, `clerkMiddleware`).
3. TanStack Query query keys, cache limits (35 list items, 10 detail items), or mutation handlers.
4. Form validation schemas (Zod models in `src/types/` or feature folders).
5. Dynamic vote weight calculations ($1\times$ to $5\times$) or consensus acceptance criteria ($S \ge 10$, $\ge 2$ peer upvoters).

