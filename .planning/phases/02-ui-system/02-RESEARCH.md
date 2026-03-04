# Phase 2: UI System - Research

**Researched:** 2026-03-03
**Domain:** React/Next.js 16 shared UI components — navigation, footer, experiment cards, gradient text, bento grid
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRAND-02 | User can navigate between hub and all app pages via a sticky header that persists across scroll | CSS `position: sticky; top: 0` on a Server Component wrapper; client boundary only if active-link highlighting is needed; Nav links use Next.js `<Link>` |
| BRAND-03 | User finds app links, social links, and contact info in a consistent footer on every page | Pure Server Component in root `layout.tsx`; no interactivity needed; Next.js `<Link>` for internal, `<a>` for external |
| BRAND-05 | Lab/experiment terminology is used throughout ("experiments," "running," "active") | Terminology enforced in component copy and status badge display labels; `coming-soon` status shown as "Coming Soon" |
| BRAND-06 | Key headings use gradient text treatment (violet-to-teal) as a signature visual element | `bg-linear-to-r from-violet to-teal bg-clip-text text-transparent` pattern; Tailwind v4 renamed `bg-gradient-to-r` to `bg-linear-to-r` |
| SHOW-02 | Each experiment card displays title, description, status badge (Active/Beta/Coming Soon), and link to app | shadcn Card + shadcn Badge with custom status variant; link to `experiment.subdomainUrl`; data from `@/lib/experiments` |
| SHOW-05 | Experiment grid uses a bento-style layout with variable card sizes | CSS Grid with `col-span-2` on feature cards; `auto-rows-[...]` for uniform row heights; responsive collapse to single column on mobile |
</phase_requirements>

---

## Summary

Phase 2 builds the complete shared component library for JazLab: a sticky navigation header, a consistent footer, experiment cards with status badges, gradient heading text, and a bento-style experiment grid. All Phase 1 foundation artifacts (brand tokens in `@theme`, shadcn CSS variables, three-font system, `lib/experiments.ts` data) are in place and ready to consume.

The component architecture follows a strict Server Component preference. The footer is a pure Server Component — static links need no interactivity. The experiment cards and bento grid are pure Server Components — they read from the static `experiments` array. The gradient text `GradientHeading` component is a pure Server Component — it applies only CSS classes, no JS interactivity. The only component that requires `"use client"` is the navigation header, but only if active-link highlighting (using `usePathname()`) is desired. If the header is visually static (no active indicator), it can also remain a Server Component.

The gradient text pattern changed in Tailwind v4: `bg-gradient-to-r` is now `bg-linear-to-r`. The correct three-class combo is `bg-linear-to-r from-violet to-teal bg-clip-text text-transparent`. The project's `@theme` tokens (`--color-violet`, `--color-teal`) are already defined in `globals.css`, so `from-violet` and `to-teal` work as native Tailwind utilities.

The bento grid uses CSS Grid with `col-span-2` on selected cards to create visual variety. The most common pattern is a 3-column grid on desktop where 1 of the 3 experiment cards spans 2 columns, and all collapse to full-width on mobile. This gives asymmetric visual weight without any layout library dependency.

**Primary recommendation:** Build components in this order: GradientHeading (simplest, zero deps) → ExperimentBadge (install shadcn badge) → ExperimentCard (install shadcn card) → BentoGrid (pure CSS grid wrapper) → Footer (Server Component with static links) → SiteHeader (Server Component or minimal client for `usePathname`). Add each to `src/components/` with co-located Vitest tests using the file-read pattern established in Phase 1.

---

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, `<Link>`, static generation | Confirmed; all components render as Server Components or leaf clients |
| react / react-dom | 19.2.3 | UI runtime | Paired with Next.js 16 |
| tailwindcss | ^4 | Utility CSS; `bg-clip-text`, `bg-linear-to-r`, `sticky`, grid spans | Confirmed; brand tokens already in `@theme` |
| class-variance-authority | ^0.7.1 | CVA for typed Badge variants | Already installed via shadcn init |
| clsx + tailwind-merge | installed | `cn()` utility for conditional classes | Already in `@/lib/utils` |
| lucide-react | ^0.576.0 | Icon set for social links, feature icons, navigation | Already installed |

### Components to Install via shadcn CLI

| Component | Install Command | Purpose | Key Sub-components |
|-----------|----------------|---------|-------------------|
| Badge | `npx shadcn@latest add badge` | Status indicator (Active/Beta/Coming Soon) | Single component, CVA variants |
| Card | `npx shadcn@latest add card` | Experiment card container | CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction |

**Note:** NavigationMenu from shadcn is optional. A hand-composed sticky header using Tailwind `sticky top-0` with Next.js `<Link>` is simpler and sufficient for JazLab's flat navigation (5–6 links max). Only install NavigationMenu if dropdown sub-menus are needed (they are not for this phase).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Card | Div-based custom card | shadcn Card gives semantic structure, consistent padding, and brand-wired `--card` color automatically; use it |
| shadcn Badge | Custom `<span>` with classes | shadcn Badge provides CVA variant system + ring focus for accessibility; minor overhead but correct pattern |
| CSS Grid bento | Masonry library | CSS Grid is fully sufficient for 3 cards; masonry libs add JS weight for no benefit at this scale |
| NavigationMenu (shadcn) | Simple `<nav>` with `<Link>` list | JazLab has flat nav (no dropdowns); NavigationMenu adds client-side JS for accordion behavior that's not needed |

### Installation

```bash
cd /Users/dbeacham/Development/jazlab-hub
npx shadcn@latest add badge
npx shadcn@latest add card
```

---

## Architecture Patterns

### Recommended Component Structure

```
jazlab-hub/src/
├── components/
│   ├── ui/                       # shadcn auto-generated (DO NOT hand-edit)
│   │   ├── badge.tsx             # npx shadcn add badge
│   │   └── card.tsx              # npx shadcn add card
│   ├── GradientHeading.tsx       # <h1..3> with violet-to-teal gradient text
│   ├── ExperimentBadge.tsx       # Status badge wrapping shadcn Badge with JazLab variants
│   ├── ExperimentCard.tsx        # Card using shadcn Card + ExperimentBadge
│   ├── BentoGrid.tsx             # CSS Grid wrapper with col-span logic
│   ├── SiteHeader.tsx            # Sticky nav — Server Component (or thin client if usePathname needed)
│   └── SiteFooter.tsx            # Footer — pure Server Component
└── tests/                        # Existing Phase 1 tests + Phase 2 tests
    ├── gradient-heading.test.ts  # Validates component file contains correct classes
    ├── experiment-badge.test.ts  # Validates status → label mapping and variant output
    ├── experiment-card.test.ts   # Validates card renders experiment fields
    ├── bento-grid.test.ts        # Validates col-span logic and grid classes
    ├── site-header.test.ts       # Validates nav links and sticky class presence
    └── site-footer.test.ts       # Validates footer links and structure
```

### Pattern 1: Gradient Text Component (GradientHeading)

**What:** Reusable heading component that applies the violet-to-teal gradient treatment using Tailwind v4's `bg-linear-to-r` utility.

**Critical v4 change:** Tailwind v4 renamed `bg-gradient-to-r` to `bg-linear-to-r`. Using the v3 name produces no gradient.

**When to use:** Any heading that needs the JazLab gradient signature — hero titles, section headings, page titles.

```typescript
// src/components/GradientHeading.tsx
// Pure Server Component — no interactivity, CSS only
import { cn } from "@/lib/utils";

interface GradientHeadingProps {
  as?: "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
  className?: string;
}

export function GradientHeading({
  as: Tag = "h2",
  children,
  className,
}: GradientHeadingProps) {
  return (
    <Tag
      className={cn(
        // Tailwind v4: bg-gradient-to-r is now bg-linear-to-r
        // from-violet and to-teal use @theme tokens from globals.css
        "bg-linear-to-r from-violet to-teal bg-clip-text text-transparent inline-block",
        "font-display font-extrabold",
        className
      )}
    >
      {children}
    </Tag>
  );
}
```

**Why `inline-block`:** `bg-clip-text` only clips to the rendered text box. For block elements, the background spans the full container width but the text shows gradient only where there are characters. Using `inline-block` sizes the element to the text, ensuring the gradient spans end-to-end across the text.

**Alternative for longer/wrapping headings:** Use `w-fit` instead of `inline-block` for multi-line headings where `inline-block` may cause layout issues.

### Pattern 2: Status Badge with Custom Variants (ExperimentBadge)

**What:** Wraps shadcn Badge with JazLab-specific status variants mapping `ExperimentStatus` types to visual treatments and human-readable labels.

**When to use:** Any place an experiment status is displayed.

```typescript
// src/components/ExperimentBadge.tsx
// Source: shadcn Badge docs + CVA pattern
import { Badge } from "@/components/ui/badge";
import type { ExperimentStatus } from "@/types/experiments";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ExperimentStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-teal/10 text-teal border-teal/20",
  },
  beta: {
    label: "Beta",
    className: "bg-violet/10 text-violet border-violet/20",
  },
  "coming-soon": {
    label: "Coming Soon",
    className: "bg-surface-overlay text-text-muted border-border",
  },
};

interface ExperimentBadgeProps {
  status: ExperimentStatus;
  className?: string;
}

export function ExperimentBadge({ status, className }: ExperimentBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
```

**Lab terminology enforcement (BRAND-05):** The label map above is the single source of truth for user-visible status text. "Coming Soon" maps from `coming-soon` status. If terminology ever changes ("Running" instead of "Active"), change only this map.

### Pattern 3: Experiment Card (ExperimentCard)

**What:** Displays a single experiment using shadcn Card primitives. Consumes an `Experiment` object directly. Server Component — reads static data, no state.

**When to use:** Inside BentoGrid for experiment showcase. Can also be used in other contexts.

```typescript
// src/components/ExperimentCard.tsx
// Pure Server Component — data is static, no interactivity required
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ExperimentBadge } from "@/components/ExperimentBadge";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Experiment } from "@/types/experiments";
import { cn } from "@/lib/utils";

interface ExperimentCardProps {
  experiment: Experiment;
  featured?: boolean; // spans 2 columns in bento grid
  className?: string;
}

export function ExperimentCard({
  experiment,
  featured = false,
  className,
}: ExperimentCardProps) {
  return (
    <Card
      className={cn(
        "bg-surface-raised border-border hover:border-violet/40 transition-colors",
        featured && "col-span-2",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-text-primary">
            {experiment.name}
          </CardTitle>
          <ExperimentBadge status={experiment.status} />
        </div>
        <CardDescription className="text-text-secondary">
          {experiment.description}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Link
          href={experiment.subdomainUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-teal hover:text-cyan transition-colors"
        >
          Open experiment
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
```

**Accent color note:** `experiment.accentColor` is available per card. For Phase 2, a hover border highlight using the accent is a good use case. Phase 3 will use it more heavily for marketing page visual identity.

### Pattern 4: Bento Grid (BentoGrid)

**What:** CSS Grid wrapper that lays out experiment cards with variable sizes. Pure Server Component.

**When to use:** The experiment grid section on the homepage (SHOW-05).

```typescript
// src/components/BentoGrid.tsx
// Pure Server Component — layout only, no JS
import { experiments } from "@/lib/experiments";
import { ExperimentCard } from "@/components/ExperimentCard";

export function BentoGrid() {
  return (
    <div
      className={[
        "grid",
        "grid-cols-1",          // mobile: single column
        "md:grid-cols-2",       // tablet: 2 columns
        "lg:grid-cols-3",       // desktop: 3 columns
        "auto-rows-[280px]",    // uniform row height
        "gap-4",
      ].join(" ")}
    >
      {experiments.map((experiment, index) => (
        <ExperimentCard
          key={experiment.slug}
          experiment={experiment}
          // First card spans 2 columns on large screens for visual emphasis
          featured={index === 0}
        />
      ))}
    </div>
  );
}
```

**Bento layout strategy for 3 cards:** With 3 experiments and a 3-column grid:
- Card 1 (`featured=true`): `col-span-2` — visually dominant, draws attention first
- Card 2: `col-span-1`
- Card 3: `col-span-1` or `col-span-3` (full-width "coming soon" treatment)

This creates a 2+1 layout on the first row and the third card on a second row, or the planner can specify a different configuration. The pattern is data-driven — the `featured` prop is the control.

**Responsive:** On `md:` (tablet, 2 columns), the `col-span-2` card fills the whole row. On mobile, all cards stack full-width. The grid handles this automatically.

### Pattern 5: Sticky Site Header (SiteHeader)

**What:** Navigation bar that persists during scroll. `position: sticky; top: 0` via Tailwind. Uses Next.js `<Link>` for zero-JS prefetching.

**Server Component vs Client Component decision:**
- **Pure Server Component:** If no active-link highlighting is needed (simplest, best for static performance)
- **"use client" with `usePathname()`:** If the current page link should be visually highlighted (adds ~2KB JS)

For Phase 2, Server Component is the correct default — active link highlighting can be added in Phase 3 if needed.

```typescript
// src/components/SiteHeader.tsx
// Server Component — static nav links, no interactivity
import Link from "next/link";
import { experiments } from "@/lib/experiments";

export function SiteHeader() {
  return (
    <header
      className={[
        "sticky top-0 z-50",           // key: sticks to viewport top
        "bg-surface/80",               // semi-transparent brand background
        "backdrop-blur-md",            // glass effect — blur content behind
        "border-b border-border",      // subtle bottom separator
      ].join(" ")}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Lab identity */}
        <Link href="/" className="font-display font-bold text-text-primary hover:text-violet transition-colors">
          JazLab
        </Link>

        {/* Navigation links — lab terminology enforced (BRAND-05) */}
        <ul className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
          <li>
            <Link href="/#experiments" className="hover:text-text-primary transition-colors">
              Experiments
            </Link>
          </li>
          {/* Per-experiment links */}
          {experiments.map((exp) => (
            <li key={exp.slug}>
              <Link
                href={exp.subdomainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                {exp.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile: could add hamburger menu in Phase 3 */}
      </nav>
    </header>
  );
}
```

**z-index:** `z-50` is the correct Tailwind value for top-level overlays. The noise layer body::before is `z-index: 0` and body > * is `z-index: 1`, so `z-50` (= 50) clears both.

**backdrop-blur requirement:** `backdrop-filter: blur()` requires `bg-surface/80` (transparent background) to show the blur effect. A fully opaque background hides it.

### Pattern 6: Site Footer (SiteFooter)

**What:** Static footer with app links, social links, and contact. Pure Server Component in root layout.

```typescript
// src/components/SiteFooter.tsx
// Pure Server Component — static links only
import Link from "next/link";
import { experiments } from "@/lib/experiments";
import { Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand column */}
          <div>
            <p className="font-display font-bold text-text-primary">JazLab</p>
            <p className="mt-2 text-sm text-text-muted">
              A laboratory for software experiments.
            </p>
          </div>

          {/* Experiments column — lab terminology (BRAND-05) */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
              Experiments
            </p>
            <ul className="space-y-2">
              {experiments.map((exp) => (
                <li key={exp.slug}>
                  <Link
                    href={exp.subdomainUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {exp.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
              Contact
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/daniel-beacham"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@jazlab.llc"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  hello@jazlab.llc
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-border text-xs text-text-muted">
          &copy; {new Date().getFullYear()} JazLab. All experiments reserved.
        </div>
      </div>
    </footer>
  );
}
```

**`new Date().getFullYear()` note:** This is a Server Component, so this expression runs at build time (static generation). The year is baked into the static HTML — correct behavior for a statically rendered marketing site.

### Integration: Root Layout

Both header and footer are added to `layout.tsx` once and appear on every page automatically:

```typescript
// src/app/layout.tsx (modified from Phase 1)
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ...`}>
      <body className="font-body bg-surface text-text-primary antialiased flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

**`flex flex-col min-h-screen` on body:** Ensures the footer sticks to the bottom on short pages (flex column with `flex-1` on main grows main to fill available space).

### Anti-Patterns to Avoid

- **Using `bg-gradient-to-r` for gradient text:** This is v3 syntax. Tailwind v4 requires `bg-linear-to-r`. The old class produces nothing silently.
- **Omitting `inline-block` from gradient text:** `bg-clip-text` on a block element clips to the full block width, not the text. The gradient may appear truncated or not start at the text edge. Use `inline-block` or `w-fit`.
- **Adding `"use client"` to SiteHeader unnecessarily:** If there is no active-link highlighting, the header is a pure Server Component. Adding `"use client"` forces it and all children into the client bundle.
- **Putting `col-span-2` inside the card component itself:** The card should not know it's in a bento grid. The `featured` prop or parent grid class controls spanning. Cards are display-agnostic.
- **Importing all Lucide icons dynamically:** For a static site with known icons, import named icons directly (`import { Github } from "lucide-react"`). Dynamic import is only for user-specified icon names at runtime.
- **Using `position: fixed` for the header:** Fixed headers require padding-top compensation on all page content. `position: sticky` keeps the header in document flow and requires no compensation — the content naturally starts below it.
- **Hardcoding the year in the footer:** Using `new Date().getFullYear()` on a Server Component is evaluated at build time — it's still static, not dynamic. This is safe and avoids stale copyright years on future rebuilds.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible status badges | Custom `<span>` with role="status" | shadcn Badge + CVA variants | Handles ARIA, focus ring, dark mode, and all variant states via CVA; copy into project, modify freely |
| Card layout structure | Nested divs with manual padding | shadcn Card primitives | Consistent padding, semantic HTML structure, wired to `--card` brand token automatically |
| Icon set | Custom SVG components | lucide-react (already installed) | Tree-shaken, 1400+ icons, consistent 24px grid, all SVG attributes as props |
| Gradient text one-off | Inline `style` with WebkitBackgroundClip | Tailwind `bg-linear-to-r bg-clip-text text-transparent` | Portable utility classes, works in all modern browsers without `-webkit-` prefix concerns in Tailwind v4 |
| Bento grid library | External masonry/grid library | Native CSS Grid with `col-span-*` | 3 cards at fixed sizes does not need a library; zero bundle weight |

**Key insight:** shadcn components are copied source code — they are not a runtime library. After `npx shadcn@latest add badge`, `components/ui/badge.tsx` is yours to modify. Extend the CVA variants directly in that file to add `active`, `beta`, `coming-soon` statuses if preferred over wrapping.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 Gradient Syntax Break

**What goes wrong:** `bg-gradient-to-r from-violet to-teal` produces no gradient at all. The heading appears as a transparent (invisible) block.

**Why it happens:** Tailwind v4 renamed the gradient utilities. `bg-gradient-to-r` is a legacy alias that may not be active in all v4 setups.

**How to avoid:** Always use `bg-linear-to-r` in v4. Verify visually in `npm run dev` before committing.

**Warning signs:** Text appears transparent with no gradient. Check compiled CSS output for `background-image: linear-gradient(...)` on the element.

### Pitfall 2: Sticky Header Covered by Content

**What goes wrong:** Content scrolls over the header, appearing in front of it.

**Why it happens:** The `z-index` on the header is not high enough, or the noise layer `body::before` has a stacking context that interferes.

**How to avoid:** Use `z-50` on the header. The noise layer `body::before` uses `z-index: 0` and body > * uses `z-index: 1`. `z-50` (= 50) is above both. Confirm `body::before` has `pointer-events: none`.

**Warning signs:** Interactive elements in the header become unclickable, or content visually overlaps the header.

### Pitfall 3: Bento Grid Overflow at Intermediate Screen Sizes

**What goes wrong:** The `col-span-2` card overflows or breaks layout at tablet widths where the grid has 2 columns (not 3).

**Why it happens:** `col-span-2` on a 2-column grid fills the entire row, which may be the intended behavior, but can look unbalanced.

**How to avoid:** Use responsive `col-span` utilities: `md:col-span-1 lg:col-span-2`. The featured card occupies one column on tablet, two on desktop.

**Warning signs:** Test at 768px (md breakpoint) — the featured card should not look broken or oversized.

### Pitfall 4: Footer `new Date()` Hydration Mismatch

**What goes wrong:** React hydration error: "Text content does not match server-rendered HTML." The year shown on server differs from client.

**Why it happens:** If the footer were a Client Component, `new Date().getFullYear()` runs twice — once on the server (build time) and once on the client (hydration). If the build ran in December and the user visits in January, there's a mismatch.

**How to avoid:** Keep `SiteFooter` as a Server Component. The year is evaluated once at build time and baked into static HTML. No hydration occurs. If the footer ever needs to become a Client Component (unlikely), replace the year with a static string or use `suppressHydrationWarning`.

**Warning signs:** Console error "Hydration failed" mentioning the footer or copyright year.

### Pitfall 5: `"use client"` Spreading Up the Tree

**What goes wrong:** Adding `"use client"` to a parent component forces all children into the client bundle, including components that were intentionally Server Components.

**Why it happens:** In Next.js App Router, `"use client"` marks a module boundary. Everything imported from a client-marked file becomes client-side.

**How to avoid:** Keep `"use client"` at the leaf level. If `SiteHeader` needs `usePathname()`, mark only a small `ActiveLink` component as `"use client"` and keep the outer `SiteHeader` as a Server Component that renders it.

**Warning signs:** `next build` output shows pages that were previously `○` (static) now showing as `λ` (dynamic) after component changes.

### Pitfall 6: shadcn Badge Variant Not Matching Brand Colors

**What goes wrong:** The Badge renders with default shadcn colors (primary purple based on generic HSL) instead of JazLab violet/teal.

**Why it happens:** The default `variant="default"` uses `--primary` which is mapped to JazLab violet in `:root`. But `variant="outline"` uses `--border` and `--foreground`. Custom class overrides via `className` are required for the exact per-status coloring.

**How to avoid:** Always pass a `className` override with explicit JazLab color tokens when using `variant="outline"` for experiment status badges. The `ExperimentBadge` wrapper component handles this — use it instead of raw `Badge`.

**Warning signs:** Badge renders in gray or generic purple instead of branded violet/teal/muted colors.

---

## Code Examples

Verified patterns from official sources:

### Tailwind v4 Gradient Text (Official)

```html
<!-- Source: https://tailwindcss.com/docs/background-clip -->
<!-- NOTE: bg-linear-to-r is the v4 name (NOT bg-gradient-to-r) -->
<h1 class="bg-linear-to-r from-violet to-teal bg-clip-text text-transparent inline-block font-display font-extrabold">
  JazLab
</h1>
```

Custom JazLab tokens (`from-violet`, `to-teal`) are available because `--color-violet` and `--color-teal` are defined in `@theme` in `globals.css`.

### Bento Grid CSS Pattern (from ibelick.com, verified)

```tsx
// Source: https://ibelick.com/blog/create-bento-grid-layouts
// 3-column grid with variable spanning — no library required
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[280px] gap-4">
  {experiments.map((exp, i) => (
    <div
      key={exp.slug}
      className={`rounded-xl border border-border bg-surface-raised p-4 ${
        i === 0 ? "md:col-span-1 lg:col-span-2" : ""
      }`}
    >
      {/* Card content */}
    </div>
  ))}
</div>
```

### Sticky Header with Backdrop Blur

```tsx
// Source: Tailwind CSS docs — position:sticky + backdrop-filter
<header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
  {/* nav content */}
</header>
```

### shadcn Badge Install and Usage

```bash
# Source: https://ui.shadcn.com/docs/components/badge
npx shadcn@latest add badge
```

```tsx
import { Badge } from "@/components/ui/badge";

// Standard usage
<Badge variant="outline" className="bg-violet/10 text-violet border-violet/20 font-mono text-xs uppercase">
  Beta
</Badge>
```

### shadcn Card Install and Usage

```bash
# Source: https://ui.shadcn.com/docs/components/card
npx shadcn@latest add card
```

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card className="bg-surface-raised border-border">
  <CardHeader>
    <CardTitle>BlockAbye</CardTitle>
    <CardDescription>Create personalized bedtime storybooks...</CardDescription>
  </CardHeader>
  <CardContent>{/* features, etc. */}</CardContent>
  <CardFooter>{/* CTA link */}</CardFooter>
</Card>
```

### Lucide Icon Usage

```tsx
// Source: https://lucide.dev/guide/packages/lucide-react
// Direct named import — tree-shakable, no dynamic import needed for static icon sets
import { Github, ArrowUpRight, ExternalLink, FlaskConical } from "lucide-react";

<Github className="h-4 w-4" />
<ArrowUpRight className="h-4 w-4" />
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `bg-gradient-to-r` | `bg-linear-to-r` | Tailwind v4, Jan 2025 | Breaking rename — old class silently produces nothing in v4 |
| `-webkit-background-clip: text` in CSS | `bg-clip-text` Tailwind utility (no prefix needed) | Tailwind supports it natively | No vendor prefix required in modern browsers via Tailwind |
| `tailwindcss-animate` in shadcn | `tw-animate-css` | shadcn Tailwind v4 migration, 2025 | Already handled in Phase 1 |
| `React.forwardRef` in shadcn components | forwardRef removed in shadcn 3.x | shadcn v3 update, 2025 | Components generate cleaner code; `ref` forwarding via React 19 patterns |
| `shadcn/ui` HSL variables | OKLCH colors in new installs | shadcn Tailwind v4 migration | JazLab uses hex/hsl from Phase 1 — not affected, but new components will use JazLab's `:root` hex values |

**Deprecated/outdated:**
- `bg-gradient-to-r`: Renamed to `bg-linear-to-r` in Tailwind v4 — do not use
- NavigationMenu (shadcn) for flat nav: Overkill for JazLab's linear link structure — use plain `<nav>` with `<Link>` list
- `position: fixed` for headers: `position: sticky` is preferred — stays in document flow, no padding compensation needed

---

## Open Questions

1. **Active link highlight in navigation**
   - What we know: `usePathname()` requires `"use client"` on a component
   - What's unclear: Whether the user wants the current page link highlighted
   - Recommendation: Build header as Server Component in Phase 2 (no active state). If active link highlighting is requested in Phase 3, extract an `ActiveLink` client leaf component. Decision can wait.

2. **Social links for footer**
   - What we know: Footer requirements say "social links and contact info"
   - What's unclear: Which social platforms (GitHub, Twitter/X, LinkedIn?) and their URLs
   - Recommendation: GitHub is certain (for a software lab). Use `https://github.com` as a placeholder with `daniel-beacham` (infer from project author context) or a generic `#` placeholder for other socials. Planner should note this as a fill-in placeholder.

3. **Mobile navigation (hamburger menu)**
   - What we know: Header needs to work on mobile (SEO-03 requires full responsiveness)
   - What's unclear: Whether Phase 2 should include a mobile hamburger menu or just hide nav links on mobile
   - Recommendation: Phase 2 hides nav links on mobile (`hidden md:flex`) — this is sufficient since Phase 3 adds the hero CTA as the primary mobile action. Full mobile nav can be Phase 3 enhancement.

4. **Experiment card featured card selection**
   - What we know: Bento requires "variable card sizes" — at least one card must be larger
   - What's unclear: Which experiment should be the featured (col-span-2) card
   - Recommendation: Make the first card in the array (`experiments[0]` = BlockAbye) the featured card, as it is the most "ready" product (beta). This can be driven by a `featured: boolean` field in the experiments data if needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 (already installed and configured) |
| Config file | `jazlab-hub/vitest.config.ts` — exists, configured with @/* alias |
| Quick run command | `npm run test:run` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-02 | SiteHeader file contains `sticky top-0` and `z-50` classes | unit | `npm run test:run -- tests/site-header.test.ts` | ❌ Wave 0 |
| BRAND-02 | SiteHeader contains `<Link href="/">` and experiment links | unit | `npm run test:run -- tests/site-header.test.ts` | ❌ Wave 0 |
| BRAND-03 | SiteFooter file contains app links, social links, contact text | unit | `npm run test:run -- tests/site-footer.test.ts` | ❌ Wave 0 |
| BRAND-05 | ExperimentBadge maps `coming-soon` to label "Coming Soon" | unit | `npm run test:run -- tests/experiment-badge.test.ts` | ❌ Wave 0 |
| BRAND-05 | ExperimentBadge maps `beta` to "Beta", `active` to "Active" | unit | `npm run test:run -- tests/experiment-badge.test.ts` | ❌ Wave 0 |
| BRAND-06 | GradientHeading file contains `bg-linear-to-r from-violet to-teal bg-clip-text text-transparent` | unit | `npm run test:run -- tests/gradient-heading.test.ts` | ❌ Wave 0 |
| SHOW-02 | ExperimentCard file references experiment.name, description, status, subdomainUrl | unit | `npm run test:run -- tests/experiment-card.test.ts` | ❌ Wave 0 |
| SHOW-05 | BentoGrid file contains `grid-cols-3` and `col-span-2` classes | unit | `npm run test:run -- tests/bento-grid.test.ts` | ❌ Wave 0 |

**Test pattern:** Continue the Phase 1 file-read pattern — `fs.readFileSync` on component TSX files, check for string presence of key classes and props. Visual correctness is verified manually via `npm run dev`.

**Example test (matching Phase 1 pattern):**
```typescript
// tests/gradient-heading.test.ts
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/GradientHeading.tsx"),
  "utf-8"
);

describe("GradientHeading component", () => {
  it("uses Tailwind v4 gradient syntax (bg-linear-to-r, not bg-gradient-to-r)", () => {
    expect(source).toContain("bg-linear-to-r");
    expect(source).not.toContain("bg-gradient-to-r"); // v3 anti-pattern
  });

  it("uses JazLab brand tokens for gradient colors", () => {
    expect(source).toContain("from-violet");
    expect(source).toContain("to-teal");
  });

  it("includes bg-clip-text and text-transparent for gradient text effect", () => {
    expect(source).toContain("bg-clip-text");
    expect(source).toContain("text-transparent");
  });

  it("includes inline-block to size container to text width", () => {
    expect(source).toContain("inline-block");
  });
});
```

### Sampling Rate

- **Per task commit:** `npm run test:run` (full suite — fast, all file-read tests)
- **Per wave merge:** `npm run test:run` + `npm run build` (confirms static output preserved)
- **Phase gate:** All tests green, `npm run build` shows all `○`, `npm run dev` shows all 6 components rendering correctly in browser

### Wave 0 Gaps

- [ ] `jazlab-hub/tests/gradient-heading.test.ts` — covers BRAND-06
- [ ] `jazlab-hub/tests/experiment-badge.test.ts` — covers BRAND-05
- [ ] `jazlab-hub/tests/experiment-card.test.ts` — covers SHOW-02
- [ ] `jazlab-hub/tests/bento-grid.test.ts` — covers SHOW-05
- [ ] `jazlab-hub/tests/site-header.test.ts` — covers BRAND-02
- [ ] `jazlab-hub/tests/site-footer.test.ts` — covers BRAND-03
- [ ] `jazlab-hub/src/components/ui/badge.tsx` — created by `npx shadcn@latest add badge`
- [ ] `jazlab-hub/src/components/ui/card.tsx` — created by `npx shadcn@latest add card`

*(Framework, config, and aliases are already set up from Phase 1 — no new framework install needed)*

---

## Sources

### Primary (HIGH confidence)

- [Tailwind CSS v4 background-clip docs](https://tailwindcss.com/docs/background-clip) — `bg-clip-text` pattern, v4.2 confirmed
- [Tailwind CSS v4 background-image docs](https://tailwindcss.com/docs/background-image) — `bg-linear-to-r` syntax, v3→v4 rename table, angle support
- [shadcn/ui Badge docs](https://ui.shadcn.com/docs/components/badge) — install command, variants, CVA pattern
- [shadcn/ui Card docs](https://ui.shadcn.com/docs/components/card) — sub-components (CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction)
- [shadcn/ui NavigationMenu docs](https://ui.shadcn.com/docs/components/navigation-menu) — client component requirement, `asChild` + Next.js Link pattern
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — data-slot attributes, OKLCH migration, tw-animate-css default
- [lucide-react docs](https://lucide.dev/guide/packages/lucide-react) — named imports, tree-shaking, SVG props

### Secondary (MEDIUM confidence)

- [ibelick.com: Bento Grid Layouts with CSS and Tailwind](https://ibelick.com/blog/create-bento-grid-layouts) — `auto-rows-[192px]`, `col-span-2`, responsive pattern (verified against Tailwind CSS Grid docs)
- [tailwindlabs/tailwindcss Discussion #17874](https://github.com/tailwindlabs/tailwindcss/discussions/17874) — `--background-image-` prefix for gradient values in `@theme` (community-verified pattern)
- [Kyle Goggin: Text Gradients in Tailwind v4](https://www.kylegoggin.com/blog/text-gradients-in-tailwind-v4/) — `@utility text-gradient-*` functional utility approach for v4 (verified against official Tailwind docs)

### Tertiary (LOW confidence — for reference)

- [Tailwind CSS Bento Grids — Official UI Blocks](https://tailwindcss.com/plus/ui-blocks/marketing/sections/bento-grids) — premium examples (pattern confirms col-span approach but full source not verified)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed in Phase 1; shadcn Badge/Card install commands verified against official docs
- Architecture: HIGH — component patterns verified against official Tailwind docs and shadcn docs; Server/Client Component decisions follow official Next.js guidance
- Gradient text: HIGH — `bg-linear-to-r` syntax confirmed from official Tailwind v4 docs; v3→v4 rename confirmed from upgrade guide
- Bento grid: HIGH — CSS Grid with col-span is a native browser capability; specific patterns verified against ibelick.com article and Tailwind Grid docs
- Pitfalls: HIGH — Tailwind v4 syntax rename is a documented breaking change; sticky z-index and `"use client"` boundary pitfalls from official Next.js docs

**Research date:** 2026-03-03
**Valid until:** 2026-06-01 (stable stack — all libraries have stable releases, no canary dependencies)
