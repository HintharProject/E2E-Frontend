# Core UI Component Catalog

> **Scope:** Standardized UI Primitives Kit  
> **Source Directory:** `src/components/ui/`  
> **Aesthetic Standard:** Swiss Academic Clean  
> **Accessibility Standard:** WCAG 2.2 AA (Keyboard, Focus, ARIA, Touch $\ge 44\text{px}$)

---

## 1. Component Directory Overview

```
src/components/ui/
├── button.tsx              # Universal button & link primitive (CVA variants)
├── input.tsx               # Base-UI text input primitive
├── textarea.tsx            # Multi-line textarea primitive (Phase 2 target)
├── field.tsx               # Form control wrapper (label + description + error)
├── card.tsx                # Composable Card container kit (Phase 2 target)
├── base-card.tsx           # Legacy feed card wrapper (refactored to use Card kit)
├── badge.tsx               # State, status, and role badges
├── contributor-badge.tsx   # Contributor Tier (0–4) badge with vote multiplier
├── tag-badge.tsx           # Clickable micro-taxonomy tag (/tags/[name])
├── page-header.tsx         # Standardized page title, description & actions
├── empty-state.tsx         # Dashed-border empty view placeholder
├── dialog.tsx              # Base-UI accessible modal dialog wrapper
├── dropdown-menu.tsx       # Accessible popover dropdown menu
├── sub-nav.tsx             # Horizontal segmented tab navigation
└── skeleton.tsx            # Geometry-matching pulse loading placeholder
```

---

## 2. Component Specifications

### 2.1 `<Button />`
Universal interactive button and anchor element powered by `class-variance-authority` (CVA).

- **File:** `src/components/ui/button.tsx`
- **Variants:**
  - `default`: High-contrast primary emerald background (`bg-primary text-primary-foreground hover:bg-primary/90`)
  - `secondary`: Subtle surface (`bg-secondary text-secondary-foreground hover:bg-secondary/80`)
  - `outline`: 1px structural border (`border border-border bg-transparent hover:bg-muted text-foreground`)
  - `ghost`: Transparent background (`hover:bg-muted text-muted-foreground hover:text-foreground`)
  - `destructive`: Warning/danger red (`bg-destructive text-destructive-foreground hover:bg-destructive/90`)
  - `link`: Underlined inline text link (`text-primary underline-offset-4 hover:underline`)
- **Sizes:**
  - `xs`: Height $28\text{px}$ (`h-7 px-2 text-xs rounded-md`)
  - `sm`: Height $32\text{px}$ (`h-8 px-3 text-xs rounded-md`)
  - `default`: Height $40\text{px}$ (`h-10 px-4 text-sm rounded-lg`)
  - `lg`: Height $48\text{px}$ (`h-12 px-6 text-base rounded-lg`)
  - `icon`: Square aspect ratio ($40\times 40\text{px}$ desktop, min $44\times 44\text{px}$ tap on mobile)
- **Focus & States:**
  - Focus Ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
  - Disabled: `disabled:opacity-50 disabled:pointer-events-none`
  - Loading: Renders `<Loader2 className="animate-spin size-4" />` with `disabled` prop.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="default" onClick={handleSave}>
  Publish Post
</Button>

<Button variant="outline" size="sm" asChild>
  <Link href="/forum">Back to Feed</Link>
</Button>
```

---

### 2.2 `<Input />` & `<Textarea />`
Form input primitives replacing all ad-hoc `inputClass` strings across forms.

- **Files:** `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`
- **Props:**
  - `sizeVariant?: "sm" | "default" | "lg"` (Input only)
  - All native `React.ComponentProps<"input">` / `React.ComponentProps<"textarea">`
- **Design Tokens Applied:**
  - Border: `border border-border bg-card text-foreground`
  - Placeholder: `placeholder:text-muted-foreground`
  - Focus State: `focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`
  - Invalid Error State: `aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20`
  - Disabled: `disabled:cursor-not-allowed disabled:opacity-50`

```tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Standard Form Usage with React Hook Form
<Input
  {...register("title")}
  id="title"
  placeholder="e.g. Cambridge 9709 P1 Quadratic Equations"
  aria-invalid={!!errors.title}
/>

<Textarea
  {...register("content")}
  id="content"
  placeholder="Describe your reasoning or paste LaTeX math..."
  aria-invalid={!!errors.content}
  rows={5}
/>
```

---

### 2.3 `<Field />`
Accessible form control wrapper uniting field label, required indicator, optional help text, and validation error banner.

- **File:** `src/components/ui/field.tsx`
- **Props:**
  - `label: string`
  - `htmlFor?: string`
  - `required?: boolean`
  - `description?: string`
  - `error?: string`
  - `children: React.ReactNode`

```tsx
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

<Field
  label="Problem Title"
  htmlFor="problem-title"
  required
  description="Include curriculum code and topic for faster solutions."
  error={errors.title?.message}
>
  <Input
    id="problem-title"
    {...register("title")}
    aria-invalid={!!errors.title}
  />
</Field>
```

---

### 2.4 Composable `<Card />` Kit
Standardized container for feeds, problem summaries, lessons, and profile cards.

- **File:** `src/components/ui/card.tsx`
- **Primitives:**
  - `<Card>`: Outer container (`rounded-xl border border-border bg-card p-5 text-card-foreground shadow-card transition hover:border-primary/30 hover:shadow-card-hover`)
  - `<CardHeader>`: Header container with flexible gap (`flex flex-col gap-1.5`)
  - `<CardTitle>`: Authoritative header (`font-heading font-semibold text-lg text-foreground tracking-tight`)
  - `<CardDescription>`: Subtitle / metadata (`text-sm text-muted-foreground leading-relaxed`)
  - `<CardContent>`: Main body slot (`pt-2`)
  - `<CardFooter>`: Bottom action row with divider border (`flex items-center pt-4 border-t border-border/50`)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ContributorBadge } from "@/components/ui/contributor-badge";
import { TagBadge } from "@/components/ui/tag-badge";

<Card className="hover:border-primary/40">
  <CardHeader className="flex-row items-center justify-between">
    <div className="flex items-center gap-2">
      <Avatar user={post.author} size="sm" />
      <span className="font-medium text-sm text-foreground">{post.author.username}</span>
      <ContributorBadge tier={post.author.contributorTier} />
    </div>
    <span className="text-xs text-muted-foreground">{post.createdAtFormatted}</span>
  </CardHeader>
  <CardContent>
    <CardTitle>{post.title}</CardTitle>
    <CardDescription className="line-clamp-2 mt-1">{post.excerpt}</CardDescription>
    <div className="flex flex-wrap gap-1.5 mt-3">
      {post.tags.map((tag) => <TagBadge key={tag.id} name={tag.name} />)}
    </div>
  </CardContent>
  <CardFooter className="justify-between">
    <VoteWidget post={post} />
    <SaveButton resourceId={post.id} />
  </CardFooter>
</Card>
```

---

### 2.5 `<Badge />` & `<TagBadge />`

- **`<Badge />` (`src/components/ui/badge.tsx`):**
  - Variants:
    - `default`: `bg-primary/10 text-primary border border-primary/20`
    - `secondary`: `bg-secondary text-secondary-foreground border border-border`
    - `outline`: `border border-border text-foreground`
    - `destructive`: `bg-destructive/10 text-destructive border border-destructive/20`
    - `warning`: `bg-warning/10 text-warning border border-warning/20` (used for 30-day TTL expiration)
- **`<TagBadge />` (`src/components/ui/tag-badge.tsx`):**
  - Standardized micro-taxonomy tag linking directly to `/tags/[name]`.
  - Styling: `text-xs font-medium text-muted-foreground bg-muted/60 hover:bg-primary/15 hover:text-primary rounded-md px-2 py-0.5 border border-border/60 transition-colors`.

---

### 2.6 `<ContributorBadge />`
Displays the user's community peer-review authority tier (0–4) and dynamically computed vote multiplier ($1\times$ to $5\times$).

- **Props:**
  - `tier: 0 | 1 | 2 | 3 | 4`
  - `showMultiplier?: boolean`
- **Styling by Tier:**
  - Tier 0: `bg-tier-0-bg text-tier-0 border-tier-0/30` ("Novice")
  - Tier 1: `bg-tier-1-bg text-tier-1 border-tier-1/30` ("Bronze Explorer")
  - Tier 2: `bg-tier-2-bg text-tier-2 border-tier-2/30` ("Silver Solver")
  - Tier 3: `bg-tier-3-bg text-tier-3 border-tier-3/30` ("Gold Master")
  - Tier 4: `bg-tier-4-bg text-tier-4 border-tier-4/30 animate-scholar-shimmer` ("Scholar Fellow")

---

### 2.7 `<EmptyState />`
Standardized placeholder for feeds, search results, or collections with zero records.

- **File:** `src/components/ui/empty-state.tsx`
- **Props:**
  - `icon: LucideIcon`
  - `title: string`
  - `description: string`
  - `action?: React.ReactNode`
- **Styling:**
  - Container: `border border-dashed border-border rounded-xl bg-card/40 p-8 sm:p-12 text-center`
  - Icon wrapper: `rounded-full bg-muted p-3 inline-flex text-muted-foreground mx-auto`
  - Title: `font-heading font-semibold text-base text-foreground mt-3`
  - Description: `text-sm text-muted-foreground mt-1 max-w-sm mx-auto`

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

<EmptyState
  icon={HelpCircle}
  title="No problems found"
  description="No unsolved questions match your filter criteria. Try selecting another level or subject."
  action={
    <Button variant="default" size="sm" onClick={() => router.push("/problems/new")}>
      Ask a Problem
    </Button>
  }
/>
```

---

### 2.8 `<Dialog />`
Accessible modal dialog built on `@base-ui/react/dialog`.

- **File:** `src/components/ui/dialog.tsx`
- **Accessibility:**
  - Focus trap inside active modal.
  - Closes on `Escape` key press.
  - Backdrop blur with `bg-background/80 backdrop-blur-sm`.
  - Accessible title and description bindings (`Dialog.Title`, `Dialog.Description`).

---

## 3. Component Quality Invariants

1. **No Inline Class Overrides of Core Primitives:** Do not override padding, border-radius, or colors on `<Input>` or `<Button>` inline with `!important` or conflicting Tailwind utilities.
2. **Keyboard Navigability:** Every component must be fully operable using keyboard (`Tab`, `Space`, `Enter`, `Escape`, arrow keys).
3. **No Decorative Emoji Icons:** Icons must come exclusively from `lucide-react`.

