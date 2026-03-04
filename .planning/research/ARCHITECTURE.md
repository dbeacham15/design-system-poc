# Architecture Research

**Domain:** Next.js marketing hub / multi-product landing site
**Researched:** 2026-03-03
**Confidence:** HIGH (based on official Next.js App Router documentation, verified 2026-02-27)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser / CDN Edge                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Root Layout (app/layout.tsx)                     │  │
│  │   Brand providers, global CSS, font loading, root metadata   │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │           Shared Nav + Footer (Server Components)    │   │  │
│  │  │   Logo, experiment links, nav state (client island)  │   │  │
│  │  ├──────────────────────────────────────────────────────┤   │  │
│  │  │                   Route Groups                        │   │  │
│  │  │                                                       │   │  │
│  │  │  ┌──────────────┐    ┌──────────────────────────┐   │   │  │
│  │  │  │ (marketing)/ │    │  (experiments)/          │   │   │  │
│  │  │  │              │    │                          │   │   │  │
│  │  │  │ page.tsx     │    │ [slug]/page.tsx          │   │   │  │
│  │  │  │ Homepage     │    │ Per-app marketing page   │   │   │  │
│  │  │  │ - Lab intro  │    │ - Hero section           │   │   │  │
│  │  │  │ - Exp. cards │    │ - Features grid          │   │   │  │
│  │  │  │ - CTA band   │    │ - Waitlist / CTA         │   │   │  │
│  │  │  └──────────────┘    │ - Demo link              │   │   │  │
│  │  │                      └──────────────────────────┘   │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

External (subdomains — separate deployments, not embedded):
  blockabye.jazlab.llc   brickify.jazlab.llc   sournal.jazlab.llc
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Root Layout | HTML shell, brand fonts, global CSS, root metadata defaults | `app/layout.tsx` — Server Component |
| SiteNav | Logo, experiment links, mobile menu toggle | Server Component shell + `'use client'` MobileMenu island |
| SiteFooter | Links, brand mark, subdomain links to live apps | Server Component — fully static |
| Homepage | Lab intro, ExperimentCard grid, global CTA band | `app/page.tsx` — Server Component, static |
| ExperimentCard | Card for one experiment: name, tagline, status badge, link | Presentational Server Component, receives data as props |
| Experiment marketing page | Hero, Features, Waitlist/CTA for one app | `app/experiments/[slug]/page.tsx` — Server Component, static |
| HeroSection | Full-width intro banner with headline and primary CTA | Server Component with optional animated text (client island) |
| FeaturesGrid | 3-column feature highlights | Server Component — purely presentational |
| WaitlistForm | Email capture form, form state, submission | `'use client'` — requires interactivity |
| StatusBadge | "Coming Soon / Beta / Live" indicator per app | Server Component presentational |
| OG Image generator | Per-page open graph image at build time | `app/experiments/[slug]/opengraph-image.tsx` using `ImageResponse` |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router root
│   ├── layout.tsx                # Root layout: HTML, fonts, global nav/footer
│   ├── page.tsx                  # Homepage — lab dashboard with experiment cards
│   ├── not-found.tsx             # 404 page
│   ├── sitemap.ts                # Generated sitemap for SEO
│   ├── robots.ts                 # robots.txt generation
│   ├── opengraph-image.tsx       # Root-level OG image (fallback for all pages)
│   │
│   └── experiments/              # Experiment marketing pages
│       └── [slug]/               # Dynamic route per experiment
│           ├── page.tsx          # Experiment marketing page
│           └── opengraph-image.tsx  # Per-experiment OG image
│
├── components/                   # Shared presentational components
│   ├── layout/                   # Layout-level components
│   │   ├── SiteNav.tsx           # Navigation bar (Server + client island)
│   │   ├── MobileMenu.tsx        # 'use client' mobile nav toggle
│   │   └── SiteFooter.tsx        # Footer
│   │
│   ├── ui/                       # Primitive UI elements (brand design system)
│   │   ├── Button.tsx            # Violet/teal CTA button variants
│   │   ├── Badge.tsx             # Status badge (Live / Beta / Coming Soon)
│   │   ├── GradientText.tsx      # Brand gradient text effect
│   │   └── Card.tsx              # Base card with dark panel styling
│   │
│   ├── home/                     # Homepage-specific sections
│   │   ├── HeroBanner.tsx        # Lab intro hero
│   │   ├── ExperimentCard.tsx    # Single experiment card
│   │   └── ExperimentGrid.tsx    # Grid of ExperimentCards
│   │
│   └── experiment/               # Experiment page sections
│       ├── ExperimentHero.tsx    # App hero with headline + CTA
│       ├── FeaturesGrid.tsx      # App feature highlights
│       ├── WaitlistForm.tsx      # 'use client' email capture
│       └── DemoLink.tsx          # Link out to subdomain
│
├── lib/                          # Data and utilities
│   ├── experiments.ts            # Experiment data (static config, typed)
│   └── metadata.ts               # Shared metadata helpers / defaults
│
├── types/                        # TypeScript type definitions
│   └── experiment.ts             # Experiment shape (id, name, slug, status...)
│
└── styles/                       # Global styles
    └── globals.css               # Tailwind base, CSS custom properties for palette
```

### Structure Rationale

- **`app/experiments/[slug]/`:** Dynamic route handles all experiment marketing pages with a single page template, making it trivial to add a 4th or 5th experiment — only `lib/experiments.ts` needs updating.
- **`components/layout/`:** SiteNav and SiteFooter live here to distinguish "structural shell" components from page-content components.
- **`components/ui/`:** A thin design-system layer enforcing the JazLab palette. Keeps brand consistency without pulling in a heavyweight UI library.
- **`components/home/` and `components/experiment/`:** Colocate section components with their owning page context to prevent a flat, unorganized components root as the site grows.
- **`lib/experiments.ts`:** Single source of truth for all experiment metadata (name, slug, tagline, status, subdomain URL). Pages consume this; adding an experiment requires one file edit.

## Architectural Patterns

### Pattern 1: Static Data Config as Source of Truth

**What:** All experiment data (name, slug, tagline, status, feature bullets, subdomain URL) lives in a single `lib/experiments.ts` TypeScript file as a typed constant array. Pages import from it; no database or CMS needed.

**When to use:** When the number of products is small (< ~20) and content changes rarely enough that a deploy is acceptable. Perfect for a lab hub at this scale.

**Trade-offs:** Adding an experiment = code change + deploy. No admin UI. Upside: zero infrastructure, full type safety, statically generated pages at build time.

**Example:**
```typescript
// src/lib/experiments.ts
export type ExperimentStatus = 'live' | 'beta' | 'coming-soon'

export interface Experiment {
  slug: string
  name: string
  tagline: string
  description: string
  status: ExperimentStatus
  subdomainUrl: string
  features: { icon: string; title: string; description: string }[]
}

export const experiments: Experiment[] = [
  {
    slug: 'blockabye',
    name: 'BlockAbye',
    tagline: 'AI storybooks from your family photos',
    description: 'Generate personalized children\'s books from photos and prompts.',
    status: 'coming-soon',
    subdomainUrl: 'https://blockabye.jazlab.llc',
    features: [
      { icon: 'photo', title: 'Upload Family Photos', description: '...' },
      // ...
    ],
  },
  // brickify, sournal...
]
```

### Pattern 2: Route Group for URL-Transparent Organization

**What:** Wrap the experiment pages in a route group `(experiments)/` or `experiments/[slug]/` to keep the URL clean (`/blockabye`) while grouping related files. Alternatively, keep a literal `experiments/` segment in the URL (`/experiments/blockabye`) for clarity.

**When to use:** For JazLab, prefer a literal `/experiments/blockabye` URL — it communicates the "lab" metaphor and avoids URL collision if JazLab later adds top-level pages with the same names.

**Trade-offs:** Route groups (`(experiments)/[slug]/`) give `/blockabye` URLs — shorter but riskier if future top-level pages conflict. Literal `experiments/[slug]/` gives `/experiments/blockabye` — slightly longer but safer and on-brand.

**Example:**
```typescript
// app/experiments/[slug]/page.tsx
import { experiments } from '@/lib/experiments'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const exp = experiments.find((e) => e.slug === params.slug)
  if (!exp) return {}
  return {
    title: `${exp.name} — JazLab`,
    description: exp.tagline,
    openGraph: { title: exp.name, description: exp.tagline },
  }
}

export default function ExperimentPage({ params }: { params: { slug: string } }) {
  const exp = experiments.find((e) => e.slug === params.slug)
  if (!exp) notFound()
  return (
    <>
      <ExperimentHero experiment={exp} />
      <FeaturesGrid features={exp.features} />
      <WaitlistForm experimentSlug={exp.slug} />
    </>
  )
}
```

### Pattern 3: Server-First with Client Islands

**What:** All page-level and section components are Server Components by default. Only components requiring interactivity (mobile nav toggle, waitlist form submission, animated counters) use `'use client'`. Client components are pushed to the leaves of the component tree.

**When to use:** Always on a marketing site. Static content does not need client JS. This pattern minimizes bundle size and maximizes Lighthouse scores — both critical for SEO and first impressions.

**Trade-offs:** Requires knowing the Server/Client boundary. Passing non-serializable props (functions, class instances) across the boundary is not allowed. For a marketing site this is a non-issue.

**Example:**
```typescript
// Server Component (no directive needed)
// src/components/experiment/ExperimentHero.tsx
import { WaitlistForm } from './WaitlistForm' // client island

export function ExperimentHero({ experiment }: { experiment: Experiment }) {
  return (
    <section>
      <h1>{experiment.name}</h1>
      <p>{experiment.tagline}</p>
      <WaitlistForm experimentSlug={experiment.slug} /> {/* client island */}
    </section>
  )
}

// Client Component
// src/components/experiment/WaitlistForm.tsx
'use client'
import { useState } from 'react'

export function WaitlistForm({ experimentSlug }: { experimentSlug: string }) {
  const [email, setEmail] = useState('')
  // form submission logic...
}
```

## Data Flow

### Request Flow (Static Pages — Production)

```
User visits /experiments/blockabye
    ↓
CDN serves pre-rendered HTML (built at deploy time)
    ↓
Browser receives complete HTML + minimal JS
    ↓
React hydrates client islands only (WaitlistForm, MobileMenu)
    ↓
No server round-trip for page content
```

### Request Flow (Waitlist Submission)

```
User submits WaitlistForm
    ↓
WaitlistForm (client) → fetch POST /api/waitlist
    ↓
Next.js Route Handler (app/api/waitlist/route.ts)
    ↓
External service (e.g., Resend, Mailchimp, or simple file store)
    ↓
Response → WaitlistForm updates UI state
```

### Data Propagation (Build Time)

```
lib/experiments.ts (static config)
    ↓
generateStaticParams()  →  one HTML file per slug at build
    ↓
generateMetadata()      →  per-page <head> tags
    ↓
page.tsx                →  rendered HTML sections
    ↓
opengraph-image.tsx     →  per-page OG PNG at /experiments/blockabye/opengraph-image
```

### Key Data Flows

1. **Experiment data to pages:** `lib/experiments.ts` is imported by `app/experiments/[slug]/page.tsx` and `app/page.tsx`. No fetch, no async — pure module import at build time. Adding an experiment = add entry to the array, redeploy.

2. **Metadata to SEO tags:** `generateMetadata()` in each page file exports per-page `<title>`, `<meta description>`, and Open Graph fields. The root `layout.tsx` sets site-wide defaults (title template `"%s — JazLab"`). More specific pages override.

3. **Navigation active state:** The SiteNav server component renders links. Active highlighting, if needed, uses `usePathname()` — meaning only the highlight logic is a client island, not the whole nav.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-3 experiments | Static config in `lib/experiments.ts` — no CMS needed |
| 4-10 experiments | Same pattern, still static config. Consider extracting per-experiment MDX for richer content |
| 10+ experiments | Introduce a headless CMS (Contentlayer + local MDX, or Sanity/Notion API). `generateStaticParams` stays the same; data source changes |
| Blog / updates added | Add `app/blog/[slug]/page.tsx` route group; same static pattern with MDX or CMS |

### Scaling Priorities

1. **First growth point:** Adding experiments. Static config handles this trivially — no architecture change, just data additions.
2. **Second growth point:** Richer per-experiment content (video embeds, screenshots, changelogs). At this point, MDX files per experiment (`content/experiments/blockabye.mdx`) become preferable to a TypeScript config array. The page template doesn't change, only the data layer.

## Anti-Patterns

### Anti-Pattern 1: One Big Page File Per Experiment

**What people do:** Create `app/blockabye/page.tsx`, `app/brickify/page.tsx`, `app/sournal/page.tsx` as separate files, duplicating section components across each.

**Why it's wrong:** Adding a 4th experiment requires copying a file. Any design change to the hero section must be made in N files. All experiment pages will diverge over time.

**Do this instead:** Use `app/experiments/[slug]/page.tsx` with `generateStaticParams`. One template, data-driven. New experiment = one array entry.

### Anti-Pattern 2: Putting Everything in Client Components

**What people do:** Add `'use client'` to page-level or section-level components to "make it work" when a child needs interactivity, or because it's familiar React (pre-App Router) behavior.

**Why it's wrong:** Sends all component JS to the browser. Crushes Lighthouse performance and SEO scores — exactly what a marketing site cannot afford.

**Do this instead:** Keep pages and layout sections as Server Components. Push `'use client'` to the smallest leaf that actually needs interactivity (the form, the mobile toggle). Everything else remains server-rendered HTML.

### Anti-Pattern 3: Hardcoding Subdomain URLs in Components

**What people do:** Paste `https://blockabye.jazlab.llc` directly into JSX in multiple component files.

**Why it's wrong:** Subdomain URLs aren't finalized (PROJECT.md notes "domain not yet decided"). When the domain changes, it must be hunted across the codebase.

**Do this instead:** Store subdomain URLs in `lib/experiments.ts` experiment config and in `.env` variables. Components read from config. One change propagates everywhere.

### Anti-Pattern 4: Per-Experiment Root Layouts via Route Groups

**What people do:** Create separate root layouts per experiment (e.g., `(blockabye)/layout.tsx`, `(brickify)/layout.tsx`) to have "custom" layouts per app.

**Why it's wrong:** Multiple root layouts cause full-page reloads on navigation between them (documented Next.js caveat). SiteNav rerenders from scratch; perceived performance degrades. Brand shell gets duplicated.

**Do this instead:** One root layout with SiteNav and SiteFooter. Experiment pages share the same shell — visual differences belong inside page sections, not layout splits.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| App subdomains (BlockAbye, etc.) | Simple `<a>` or `next/link` with external href | Not embedded — outbound links only. `target="_blank"` with `rel="noopener noreferrer"` |
| Waitlist / email capture | Route Handler (`app/api/waitlist/route.ts`) → external email service | Resend, Mailchimp, or Loops are common choices. Decouple via the API route so the provider can change without touching the form component |
| Analytics | Script tag in root layout or Vercel Analytics (zero-config) | Use `@vercel/analytics` or Plausible. Add in root layout as a Server Component with `<Script strategy="afterInteractive">` |
| Open Graph images | `next/og` ImageResponse in `opengraph-image.tsx` files | Per-page PNG generated at build time; brand colors applied in JSX |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `lib/experiments.ts` → pages | Direct TypeScript module import | Pages are consumers; the config is the single source of truth. No circular dependencies |
| Server Components → Client Islands | Props (serializable only) | Pass strings, numbers, plain objects. Never pass functions or class instances across the Server/Client boundary |
| Client WaitlistForm → API Route | `fetch()` POST | API route is the only server-side mutation point. Keep form logic in the client component, server logic in the route handler |
| Root Layout → all pages | React children prop + shared CSS | Nav and footer wrap via layout nesting. No prop drilling needed for brand chrome |

## Build Order Implications

Based on component dependencies, the correct build sequence is:

1. **`lib/experiments.ts` + `types/experiment.ts`** — All other files depend on this. Define the Experiment type and seed all 3 experiments before writing any page.

2. **`styles/globals.css` + `components/ui/`** — Brand tokens (colors as CSS custom properties), Button, Badge, Card, GradientText. These are leaf components with no internal dependencies.

3. **`components/layout/SiteNav` + `SiteFooter`** — Depend on UI primitives. Required by root layout.

4. **`app/layout.tsx`** — Root layout. Depends on SiteNav, SiteFooter, font config.

5. **`components/home/`** — ExperimentCard, ExperimentGrid, HeroBanner. Depend on UI primitives and experiment types.

6. **`app/page.tsx`** — Homepage. Depends on home components and experiments data.

7. **`components/experiment/`** — ExperimentHero, FeaturesGrid, WaitlistForm, DemoLink. Depend on UI primitives and experiment type.

8. **`app/experiments/[slug]/page.tsx`** — Experiment marketing pages. Depends on experiment components, lib, and generateStaticParams.

9. **`app/experiments/[slug]/opengraph-image.tsx`** — Per-experiment OG images. Can be added after page is working.

10. **`app/sitemap.ts` + `app/robots.ts`** — SEO files. Add last; depend on experiments array being complete.

## Sources

- [Next.js App Router — Project Structure (official, updated 2026-02-27)](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js Route Groups (official, updated 2026-02-27)](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next.js Metadata and OG Images (official, updated 2026-02-27)](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js Server and Client Components (official)](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Layouts and Pages (official)](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Best Practices for Organizing Next.js 15 — DEV Community](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)
- [Next.js Best Practices 2025 — Raftlabs](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)

---
*Architecture research for: Next.js marketing hub / multi-product landing site (JazLab)*
*Researched: 2026-03-03*
