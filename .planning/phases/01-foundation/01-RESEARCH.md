# Phase 1: Foundation - Research

**Researched:** 2026-03-03
**Domain:** Next.js 16 + Tailwind v4 + shadcn/ui — project scaffold, brand tokens, dark theme, experiments data model
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Experiment Data Model**
- Each experiment has its own accent color for visual identity (not shared brand palette)
- Three-tier status system: Active / Beta / Coming Soon
- Current statuses: BlockAbye = Beta, Brickify = Beta, Sournal = Coming Soon
- Feature lists use rich feature objects: `{title, description, icon}` per feature
- Model includes: slug, name, description, status, subdomain URL, accent color, and feature list

**Noise/Grain Texture**
- Barely-there intensity (5-8% opacity) — subconscious depth, not visible noise
- Applied to page background (#0F1117) only — cards and panels stay clean/smooth
- Static texture, no animation
- Creates natural surface hierarchy: textured base → smooth elevated surfaces

**Typography System**
- Three-font system:
  - Display font (headings): Geometric sans — Space Grotesk or Outfit style, technical/lab feel
  - Body font: Inter — clean, readable
  - Mono accents: JetBrains Mono or similar — for status badges, technical labels, "lab" terminology
- Hero heading weight: Extrabold (800) — punchy, works well with gradient text treatment

**Token Naming Convention**
- Hybrid approach: semantic names for surfaces/text, literal names for brand colors
- Surface tokens: `surface`, `surface-raised`, `surface-overlay`, `border`
- Text tokens: `text-primary`, `text-secondary`, `text-muted`
- Brand color tokens: `violet`, `teal`, `cyan`, `sparkle` (literal names)
- Per-app accent tokens named by app: `blockabye`, `brickify`, `sournal`
- Pre-defined gradient tokens as CSS custom properties (e.g., `--gradient-brand`, `--gradient-accent`)
- shadcn/ui CSS variables wired to JazLab tokens in this phase — components brand-ready for Phase 2

### Claude's Discretion

- Grain pattern type (film grain vs digital noise — match cosmic lab aesthetic)
- Specific display font selection (Space Grotesk vs Outfit vs similar)
- Specific monospace font selection
- Per-app accent color values (colors that complement the violet/teal palette on dark backgrounds)
- shadcn/ui variable mapping details
- Gradient direction and exact stops

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRAND-04 | All pages consistently use the JazLab brand system (violet/teal palette, dark foundation, Inter typography) | Tailwind v4 `@theme` for color tokens; `next/font` for self-hosted typography; shadcn/ui CSS variable bridge |
| BRAND-07 | Dark backgrounds include subtle noise/grain texture for tactile depth | SVG `feTurbulence` filter as data-URI background on the root `body` pseudo-element; 5-8% opacity; static |
</phase_requirements>

---

## Summary

This is a greenfield Next.js 16 marketing hub ("JazLab") built with Tailwind v4 and shadcn/ui. Phase 1 installs and configures the toolchain, wires the JazLab design token system, sets up the three-font typography stack, applies the noise/grain texture to the dark background, and defines the `lib/experiments.ts` data model. Every downstream phase consumes artifacts established here.

The stack is confirmed: **Next.js 16 + Tailwind v4 + shadcn/ui (Tailwind v4 edition) + `next/font`**. All three have stable releases as of early 2026. The biggest "gotchas" for this phase are (1) Tailwind v4 uses CSS-first `@theme` — no `tailwind.config.js`, (2) shadcn/ui with Tailwind v4 uses `@theme inline` + `:root`/`.dark` variable split, and (3) Next.js 16 requires `await params` and `await cookies()` everywhere (sync access is fully removed). None of these are blockers — they just require the right pattern from the start.

The static-rendering requirement (`○` not `λ` in `next build` output) is naturally satisfied for a marketing site: Server Components with no dynamic APIs render statically by default. The only risk is accidentally importing a hook that forces client rendering — the mitigation is keeping the root `page.tsx` files as pure Server Components and isolating any `"use client"` code in leaf components.

**Primary recommendation:** Scaffold with `create-next-app@latest`, install shadcn with `npx shadcn@latest init` (which now supports Tailwind v4 natively), define all brand tokens in `@theme` + `@theme inline`, wire shadcn variables to JazLab tokens in `globals.css`, add the noise layer as a CSS `body::before` pseudo-element, and export `lib/experiments.ts` as a typed constant array.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^16.x | App framework, routing, static rendering, `next/font`, `next/image` | Confirmed stack decision; Turbopack default; async-only APIs |
| react / react-dom | 19.2.0 | UI runtime; React Compiler available but optional | Paired with Next.js 16 |
| typescript | ^5.1 | Type safety; `lib/experiments.ts` types; `next typegen` | Next.js 16 minimum |
| tailwindcss | ^4.x | Utility CSS; design token generation via `@theme` | Confirmed; v4 ships Jan 2025 |
| @tailwindcss/postcss | ^4.x | PostCSS integration for Tailwind v4 | Required by Tailwind v4 (replaces old postcss plugin) |
| shadcn/ui (CLI) | latest | Accessible component primitives wired to brand tokens | Confirmed stack; Tailwind v4 support now in `@latest` |
| tw-animate-css | latest | Animation utilities for shadcn (replaces `tailwindcss-animate` in v4 era) | shadcn v4 migration removes tailwindcss-animate |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/font (built-in) | — | Zero-layout-shift Google Font self-hosting | Always — prevents FOUC, no external font requests |
| @types/node, @types/react, @types/react-dom | ^20 / ^19 | TypeScript support | Dev dependency always |
| eslint + eslint-config-next | ^9 / 16.x | Linting (note: `next lint` removed in v16, use ESLint directly) | Dev |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 `@theme` | CSS Modules | Decision locked; `@theme` generates utilities automatically |
| shadcn/ui | Radix UI directly | shadcn adds pre-styled, brand-overridable components for Phase 2 |
| `next/font` | Self-served font files | `next/font` handles preloading and zero-FOUC automatically |

### Installation

```bash
# 1. Scaffold (run from ~/Development, creates ./jazlab-hub)
npx create-next-app@latest jazlab-hub \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# 2. shadcn/ui (Tailwind v4 native)
cd jazlab-hub
npx shadcn@latest init

# 3. tw-animate-css (shadcn v4 replacement for tailwindcss-animate)
npm install tw-animate-css
```

---

## Architecture Patterns

### Recommended Project Structure

```
jazlab-hub/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout: fonts, dark class, globals.css
│   │   ├── page.tsx            # Homepage (Server Component, renders ○)
│   │   ├── experiments/
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Single dynamic route for all 3 app pages
│   │   └── globals.css         # @theme tokens + shadcn variables + noise layer
│   ├── lib/
│   │   └── experiments.ts      # Typed data array (single source of truth)
│   ├── types/
│   │   └── experiments.ts      # Experiment interface/types
│   └── components/             # (populated in Phase 2)
├── public/
├── next.config.ts
├── tsconfig.json
└── package.json
```

**Key constraint:** `src/app/experiments/[slug]/page.tsx` is the single dynamic route for all three app marketing pages. It reads from `lib/experiments.ts` and uses `generateStaticParams()` to pre-render all three slugs at build time, keeping the `○` (static) symbol.

### Pattern 1: Tailwind v4 Brand Token Definition

**What:** Define all JazLab design tokens in `globals.css` using `@theme` (generates utility classes) and `@theme inline` (bridges `:root` variables to Tailwind without duplicating values). Use `:root` block for runtime-accessible custom properties that shadcn/ui components can reference.

**When to use:** All color, surface, text, and gradient tokens for the JazLab system.

```css
/* Source: https://tailwindcss.com/docs/theme */
/* src/app/globals.css */

@import "tailwindcss";
@import "tw-animate-css";

/* ----------------------------------------
   JazLab brand colors — literal token names
   Tailwind generates bg-violet, text-teal, etc.
   ---------------------------------------- */
@theme {
  /* Brand palette */
  --color-violet:          #5B3DF5;
  --color-teal:            #28C7B7;
  --color-cyan:            #00D4FF;
  --color-sparkle:         #FFD36B;

  /* Dark foundation surfaces */
  --color-surface:         #0F1117;
  --color-surface-raised:  #1A1E2A;
  --color-surface-overlay: #242938;
  --color-border:          #32384A;

  /* Text scale */
  --color-text-primary:    #F2F4F8;
  --color-text-secondary:  #A4A9B6;
  --color-text-muted:      #6C7385;

  /* Per-app accent colors */
  --color-blockabye:       #FF7B9C;   /* warm rose — storybook warmth */
  --color-brickify:        #FF9843;   /* bright amber — construction energy */
  --color-sournal:         #9B8AFB;   /* soft lavender — reflection calm */

  /* Typography */
  --font-display: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  --font-body:    var(--font-inter), "Inter", sans-serif;
  --font-mono:    var(--font-jetbrains-mono), "JetBrains Mono", monospace;
}

/* ----------------------------------------
   shadcn/ui variable bridge
   @theme inline maps :root vars to Tailwind
   without creating duplicate CSS vars
   ---------------------------------------- */
:root {
  --background:  #0F1117;
  --foreground:  #F2F4F8;
  --card:        #1A1E2A;
  --card-foreground: #F2F4F8;
  --primary:     #5B3DF5;
  --primary-foreground: #F2F4F8;
  --secondary:   #1A1E2A;
  --secondary-foreground: #F2F4F8;
  --muted:       #242938;
  --muted-foreground: #A4A9B6;
  --accent:      #28C7B7;
  --accent-foreground: #0F1117;
  --border:      #32384A;
  --input:       #32384A;
  --ring:        #5B3DF5;
  --radius:      0.5rem;
}

@theme inline {
  --color-background:        var(--background);
  --color-foreground:        var(--foreground);
  --color-card:              var(--card);
  --color-card-foreground:   var(--card-foreground);
  --color-primary:           var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary:         var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted:             var(--muted);
  --color-muted-foreground:  var(--muted-foreground);
  --color-accent:            var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border:            var(--border);
  --color-input:             var(--input);
  --color-ring:              var(--ring);
}

/* ----------------------------------------
   Gradient tokens as custom properties
   Not Tailwind utilities — reference in CSS
   ---------------------------------------- */
:root {
  --gradient-brand:  linear-gradient(135deg, #5B3DF5 0%, #28C7B7 100%);
  --gradient-accent: linear-gradient(135deg, #28C7B7 0%, #00D4FF 100%);
}

/* ----------------------------------------
   Noise/grain texture on page background
   5-8% opacity — subconscious, not visible
   Applied only to body — cards stay smooth
   ---------------------------------------- */
body {
  background-color: #0F1117;
  color: #F2F4F8;
  position: relative;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px;
  opacity: 0.06;
  pointer-events: none;
  z-index: 0;
}

/* Ensure all content sits above the noise layer */
body > * {
  position: relative;
  z-index: 1;
}
```

### Pattern 2: Root Layout — Fonts + Dark Class

**What:** Three-font setup via `next/font/google` with CSS variable injection. Apply fonts and `dark` class to `<html>`. For a dark-only site, the `dark` class is hardcoded — no toggle, no `next-themes` needed.

**When to use:** Root `app/layout.tsx` only. One canonical font definition point.

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts
// src/app/layout.tsx
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JazLab — A laboratory for software experiments",
    template: "%s | JazLab",
  },
  description: "A laboratory for software experiments by Daniel Beacham.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jazlab.llc"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-surface text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Why hardcode `class="dark"` instead of next-themes:** JazLab is dark-only by decision. No theme toggle exists. next-themes adds JS weight, hydration complexity, and FOUC risk unnecessarily. The Tailwind v4 dark variant (`@custom-variant dark (&:where(.dark, .dark *))`) reads the class directly.

### Pattern 3: Static Marketing Page with generateStaticParams

**What:** The `[slug]` route for app marketing pages uses `generateStaticParams()` to pre-render all three slugs at build time. Without this, Next.js 16 would render the route dynamically.

**When to use:** `src/app/experiments/[slug]/page.tsx`

```typescript
// Source: https://nextjs.org/docs/app/guides/static-exports
// src/app/experiments/[slug]/page.tsx
import { experiments } from "@/lib/experiments";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return experiments.map((exp) => ({ slug: exp.slug }));
}

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Next.js 16: params is a Promise
}) {
  const { slug } = await params;
  const experiment = experiments.find((e) => e.slug === slug);

  if (!experiment) notFound();

  return <div>{/* Phase 3 fills this in */}</div>;
}
```

**Critical Next.js 16 note:** `params` is now `Promise<{ slug: string }>` — must `await params` before destructuring.

### Pattern 4: Experiments Data Model

**What:** Single typed array exported from `lib/experiments.ts`. Consumed by Phase 2 components and Phase 3 pages. Keeps experiment data in one place.

```typescript
// src/lib/experiments.ts
import type { Experiment } from "@/types/experiments";

export const experiments: Experiment[] = [
  {
    slug: "blockabye",
    name: "BlockAbye",
    description:
      "Create personalized bedtime storybooks starring your child. A new illustrated adventure every night, in 6 unique art styles. Fresh stories in minutes — no more re-reading the same books.",
    status: "beta",
    subdomainUrl: `${process.env.NEXT_PUBLIC_BLOCKABYE_URL ?? "https://blockabye.jazlab.llc"}`,
    accentColor: "#FF7B9C",
    features: [
      {
        title: "AI-generated storybooks",
        description: "Custom illustrated books from your family photos and prompts",
        icon: "book",
      },
      {
        title: "6 art styles",
        description: "Watercolor, cartoon, storybook, and more",
        icon: "palette",
      },
      {
        title: "Ready in minutes",
        description: "Fresh story every night, no re-reading required",
        icon: "clock",
      },
    ],
  },
  {
    slug: "brickify",
    name: "Brickify",
    description:
      "AI tool that converts images or concepts into structurally valid LEGO-style builds and step-by-step instructions.",
    status: "beta",
    subdomainUrl: `${process.env.NEXT_PUBLIC_BRICKIFY_URL ?? "https://brickify.jazlab.llc"}`,
    accentColor: "#FF9843",
    features: [
      {
        title: "Image to LEGO",
        description: "Convert any photo into a brick-buildable design",
        icon: "image",
      },
      {
        title: "Structural validation",
        description: "Builds that actually hold together",
        icon: "check",
      },
      {
        title: "Step-by-step instructions",
        description: "Build guides anyone can follow",
        icon: "list",
      },
    ],
  },
  {
    slug: "sournal",
    name: "Sournal",
    description:
      "A private space to reflect, explore, and be heard. Structured journaling and thinking companion for capturing ideas and organizing thoughts.",
    status: "coming-soon",
    subdomainUrl: `${process.env.NEXT_PUBLIC_SOURNAL_URL ?? "https://sournal.jazlab.llc"}`,
    accentColor: "#9B8AFB",
    features: [
      {
        title: "Guided reflection",
        description: "Structured prompts for deeper thinking",
        icon: "edit",
      },
      {
        title: "Private by default",
        description: "Your thoughts stay yours",
        icon: "lock",
      },
      {
        title: "Idea organization",
        description: "Link and structure your thinking over time",
        icon: "network",
      },
    ],
  },
];
```

```typescript
// src/types/experiments.ts
export type ExperimentStatus = "active" | "beta" | "coming-soon";

export interface ExperimentFeature {
  title: string;
  description: string;
  icon: string; // icon name string for Phase 2 icon mapping
}

export interface Experiment {
  slug: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  subdomainUrl: string;
  accentColor: string; // hex, CSS-referenceable
  features: ExperimentFeature[];
}
```

### Anti-Patterns to Avoid

- **Putting brand colors in `tailwind.config.js`:** Tailwind v4 has no config file. Everything lives in `@theme` in CSS. A config file will be ignored.
- **Using `@theme inline` for everything:** Brand color tokens with literal names (violet, teal, etc.) go in `@theme` (NOT `@theme inline`) so Tailwind generates utility classes. `@theme inline` is for bridging `:root` shadcn variables only.
- **Adding `"use client"` to page-level components:** `app/page.tsx` and `app/experiments/[slug]/page.tsx` must be Server Components or they will render as `λ` (dynamic) in the build output.
- **Using sync `params` access:** In Next.js 16, `params` is `Promise<{...}>`. Sync access was removed. Always `const { slug } = await params`.
- **Importing `tailwindcss-animate`:** Removed in shadcn's Tailwind v4 migration. Use `tw-animate-css` instead.
- **Using `next-themes` for a dark-only site:** Adds unnecessary complexity and FOUC risk. Hardcode `class="dark"` on `<html>`.
- **Animating the noise layer:** Decision locked to static. `body::before` has no animation. Animated noise is expensive (repaints every frame).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading + FOUC prevention | Manual `<link>` tags or font-face | `next/font/google` | Automatic preloading, self-hosting, zero layout shift, no FOUC |
| Component accessibility | Custom dialog/button/input primitives | shadcn/ui (Radix primitives) | ARIA attributes, keyboard navigation, focus management — all edge cases handled |
| SVG noise texture | Canvas-rendered noise, PNG texture files | CSS `feTurbulence` data-URI | Zero network requests, scales to any resolution, 1-2 lines of CSS |
| Design token → utility class generation | Manual utility classes | Tailwind v4 `@theme` | `@theme` auto-generates `bg-violet`, `text-teal`, etc. from token definitions |
| TypeScript type generation for route params | Manual type definitions | `npx next typegen` | Generates `PageProps<'/experiments/[slug]'>` helper types for async params |

**Key insight:** The SVG `feTurbulence` approach for noise is dramatically better than a PNG or canvas approach — it's a few bytes of inline SVG, perfectly scalable, and zero runtime cost.

---

## Common Pitfalls

### Pitfall 1: White Flash on Initial Load (FOUC for dark background)

**What goes wrong:** The browser briefly renders a white background before the dark CSS is applied, creating a jarring flash on first load.

**Why it happens:** If `background-color: #0F1117` is only applied via a Tailwind utility class on `<body>`, the HTML document has no color until JavaScript executes and Tailwind's stylesheet loads. The browser default is white.

**How to avoid:** Set `background-color` directly in `globals.css` on `body` as a rule (not a utility), AND set the `dark` class statically on `<html>` in the Server Component layout (no JavaScript involved). The CSS loads synchronously before paint.

**Warning signs:** White flash visible during hard reload in Chrome DevTools with CPU throttling. Check that `body { background-color: #0F1117; }` appears in the compiled stylesheet as a raw CSS rule, not just as a Tailwind utility.

### Pitfall 2: Dynamic (`λ`) Build Output Instead of Static (`○`)

**What goes wrong:** `npm run build` shows `λ` next to pages that should be static, meaning they execute server-side code per request.

**Why it happens:** Any of: (1) using `await cookies()`, `await headers()`, or `await searchParams` in a Server Component without `generateStaticParams`, (2) importing a `"use client"` hook that calls `useSearchParams` inside a non-Suspense boundary, (3) not exporting `generateStaticParams` in the `[slug]` route.

**How to avoid:** Pages must be pure Server Components or have `generateStaticParams`. Do not call dynamic APIs (`cookies`, `headers`, `searchParams`) in any component in the marketing pages' render tree. Keep `lib/experiments.ts` as a plain data module (no async, no fetch).

**Warning signs:** Check `next build` terminal output for `λ` symbols. Any `λ` on a marketing page is a failure.

### Pitfall 3: Tailwind v4 `@theme` vs `@theme inline` Confusion

**What goes wrong:** Brand color utilities like `bg-violet` don't work, or shadcn component colors don't respect the JazLab brand.

**Why it happens:** Mixing up which block to put variables in. `@theme` creates both a CSS var AND a utility class generator. `@theme inline` only bridges an existing `:root` CSS var to a Tailwind utility — it does NOT create new CSS vars.

**How to avoid:**
- Brand tokens that need utility classes → `@theme { --color-violet: #5B3DF5; }`
- shadcn bridge → `:root { --primary: #5B3DF5; }` then `@theme inline { --color-primary: var(--primary); }`

**Warning signs:** `bg-violet` class appears in HTML but produces no color, or `bg-primary` does not match the JazLab violet.

### Pitfall 4: Next.js 16 Async `params` Not Awaited

**What goes wrong:** Runtime error: "Error: Route `/experiments/[slug]` used `params.slug`. `params` should be awaited before using its properties."

**Why it happens:** Sync `params` access was fully removed in Next.js 16. This is a hard error, not a warning.

**How to avoid:** Always destructure params after `await`:
```typescript
const { slug } = await params;  // correct
const { slug } = params;        // runtime error in Next.js 16
```

**Warning signs:** TypeScript will show `params` typed as `Promise<{slug: string}>` — any sync access is a type error too.

### Pitfall 5: Noise Layer Covering Interactive Elements

**What goes wrong:** Buttons, links, or inputs become un-clickable because the `body::before` pseudo-element is positioned above them in the z-stack.

**Why it happens:** `body::before` with `position: fixed; z-index: 0` + no z-index on children means children may render behind the pseudo-element in some browsers.

**How to avoid:** Set `pointer-events: none` on `body::before` AND add `position: relative; z-index: 1` to `body > *`. Already included in the pattern above.

**Warning signs:** Clicking a button produces no interaction. Check in DevTools: "Pointer events: none" must appear on the pseudo-element.

---

## Code Examples

Verified patterns from official sources:

### Tailwind v4 Dark Mode Config (CSS-first, class-based)

```css
/* Source: https://tailwindcss.com/docs/dark-mode */
/* globals.css — configure dark variant for class-based triggering */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

With `class="dark"` hardcoded on `<html>`, all `dark:` utilities activate permanently.

### next/font Multiple Fonts with CSS Variables

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",    // exposes as CSS var; use in @theme
  subsets: ["latin"],
  display: "swap",             // prevents invisible text during load
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});
// All three variables injected on <html> element
```

### SVG feTurbulence Noise Texture

```css
/* Source: https://ibelick.com/blog/create-grainy-backgrounds-with-css
          https://css-tricks.com/grainy-gradients/ */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px;
  opacity: 0.06;            /* 6% — middle of 5-8% range */
  pointer-events: none;     /* critical: don't block clicks */
  z-index: 0;
}
/* type='fractalNoise' gives film-grain character (vs 'turbulence' which is cloud-like) */
/* baseFrequency='.65' controls grain size; increase for finer grain */
/* numOctaves='3' adds detail; 2-3 is standard for subtle grain */
```

### shadcn/ui Init (Tailwind v4)

```bash
# Source: https://ui.shadcn.com/docs/installation/next
npx shadcn@latest init
# Prompts: style (default), base color (slate), CSS variables (yes)
# Generates: components.json, updates globals.css with :root/.dark variables
```

### `next build` Static Verification

```bash
npm run build
# Desired output:
# ○ /                      (static)
# ○ /experiments/[slug]    (static — generateStaticParams covers all slugs)
#
# Failure state:
# λ /                      (dynamic — something dynamic leaked into the tree)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` for theme tokens | `@theme` in CSS | Tailwind v4, Jan 2025 | No JS config file; CSS-first; tokens available at runtime as CSS vars |
| `tailwindcss-animate` | `tw-animate-css` | shadcn v4 migration, 2025 | Direct CSS import, no PostCSS plugin needed |
| Sync `params` in page components | `await params` | Next.js 15→16 | Hard error in v16; must use async |
| `next lint` command | `eslint` directly | Next.js 16, Oct 2025 | `next lint` removed; run `eslint` or configure in `package.json` scripts |
| `middleware.ts` | `proxy.ts` | Next.js 16, Oct 2025 | Rename file + function (not needed in Phase 1) |
| `experimental.turbopack` in config | Top-level `turbopack:` | Next.js 16 | Config location moved; old location ignored |
| HSL colors in shadcn variables | OKLCH colors | shadcn Tailwind v4 migration | New installs use OKLCH; JazLab can keep hex/rgb since brand colors are defined |
| `serverRuntimeConfig` / `publicRuntimeConfig` | `.env` files + `NEXT_PUBLIC_` prefix | Next.js 16 | Removed entirely; use env vars directly |

**Deprecated/outdated:**
- `tailwindcss-animate`: Replaced by `tw-animate-css` in shadcn v4 migration
- Sync `params`/`cookies()`/`headers()` access: Fully removed in Next.js 16
- `next lint`: Removed; use `eslint` CLI directly
- `middleware.ts` filename: Deprecated (still works but rename to `proxy.ts` recommended)

---

## Open Questions

1. **Exact project directory name and location**
   - What we know: Greenfield project, no existing directory
   - What's unclear: Should it be `jazlab-hub`, `jazlab`, or something else?
   - Recommendation: Use `jazlab-hub` to distinguish from individual app repos; create in `~/Development/`

2. **Subdomain URL values for `lib/experiments.ts`**
   - What we know: Domain not finalized; use `NEXT_PUBLIC_SITE_URL` placeholder
   - What's unclear: Whether subdomain env vars per app are needed or one base URL suffices
   - Recommendation: Use per-app env vars (`NEXT_PUBLIC_BLOCKABYE_URL` etc.) with `jazlab.llc` subdomains as fallback defaults

3. **shadcn component selection for Phase 1**
   - What we know: shadcn/ui variables must be wired to JazLab tokens in this phase for Phase 2 readiness
   - What's unclear: Which specific components to install in Phase 1 vs defer to Phase 2
   - Recommendation: Phase 1 only installs `npx shadcn@latest init` (no components). Components added in Phase 2 when they're needed. Token wiring happens in `globals.css`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (pattern from sibling projects: blockabye uses `vitest ^4.0`) |
| Config file | `vitest.config.ts` — Wave 0 gap (does not exist yet) |
| Quick run command | `npm run test:run` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-04 | All brand tokens exported as Tailwind utilities (spot-check CSS var presence) | unit | `npm run test:run -- tests/brand-tokens.test.ts` | ❌ Wave 0 |
| BRAND-04 | Typography CSS vars present in root layout output | unit | `npm run test:run -- tests/layout.test.ts` | ❌ Wave 0 |
| BRAND-07 | Noise layer CSS rule present with correct opacity range | unit | `npm run test:run -- tests/noise-texture.test.ts` | ❌ Wave 0 |
| Phase SC-1 | `npm run build` exits 0 and shows `○` for all pages | smoke | `npm run build 2>&1 \| grep -E "○\|λ"` | ❌ manual |
| Phase SC-4 | `lib/experiments.ts` exports 3 experiments with required fields | unit | `npm run test:run -- tests/experiments.test.ts` | ❌ Wave 0 |

**Note:** BRAND-04 color rendering and BRAND-07 visual texture cannot be fully automated — they require browser visual verification. The automated tests validate that the CSS rules and data structures exist; visual correctness is verified manually via `npm run dev`.

### Sampling Rate

- **Per task commit:** `npm run build` (confirms static output)
- **Per wave merge:** `npm run test:run` (full unit suite)
- **Phase gate:** `npm run build` shows all `○`, `npm run test:run` green, `npm run dev` renders dark background at `#0F1117` in browser

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration (does not exist in greenfield project)
- [ ] `tests/experiments.test.ts` — covers BRAND-04 data model + Phase SC-4
- [ ] `tests/brand-tokens.test.ts` — covers BRAND-04 CSS variable presence
- [ ] `tests/noise-texture.test.ts` — covers BRAND-07 CSS rule validation
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react` — if not included by `create-next-app`

---

## Sources

### Primary (HIGH confidence)

- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16) — caching model, Turbopack default, breaking changes
- [Next.js v16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — async params, removal list, migration commands
- [Tailwind CSS v4 Theme Variables Docs](https://tailwindcss.com/docs/theme) — `@theme` syntax, CSS var generation
- [Tailwind CSS v4 Dark Mode Docs](https://tailwindcss.com/docs/dark-mode) — `@custom-variant` CSS-first approach
- [Next.js Font Optimization Docs](https://nextjs.org/docs/app/getting-started/fonts) — `next/font/google` with CSS variables
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — `@theme inline` bridge, OKLCH migration

### Secondary (MEDIUM confidence)

- [ibelick.com: Grainy Backgrounds with CSS](https://ibelick.com/blog/create-grainy-backgrounds-with-css) — `feTurbulence` technique (verified against CSS-Tricks reference)
- [CSS-Tricks: Grainy Gradients](https://css-tricks.com/grainy-gradients/) — feTurbulence parameters and opacity guidance
- [DEV Community: Next.js 15 + shadcn + Tailwind v4](https://dev.to/darshan_bajgain/setting-up-2025-nextjs-15-with-shadcn-tailwind-css-v4-no-config-needed-dark-mode-5kl) — cross-references official docs

### Tertiary (LOW confidence — for validation)

- Sibling project `blockabye/package.json` — confirms `next ^16.1.6`, `tailwindcss ^4`, `vitest ^4.0` in production use

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from official Next.js 16 release blog and upgrade guide
- Architecture: HIGH — patterns derived from official docs; `@theme` syntax verified against Tailwind docs
- Pitfalls: HIGH — async params and dark mode flash are documented Next.js 16 breaking changes
- Experiments data model: HIGH — directly specified in CONTEXT.md; types are straightforward TypeScript

**Research date:** 2026-03-03
**Valid until:** 2026-06-01 (stable stack; Tailwind v4 and Next.js 16 are released, not canary)
