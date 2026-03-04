# Project Research Summary

**Project:** JazLab — software lab marketing hub
**Domain:** Next.js marketing/landing page hub with dark UI, animations, and multi-app showcase
**Researched:** 2026-03-03
**Confidence:** HIGH

## Executive Summary

JazLab is a multi-product marketing hub — a central "lab" that introduces the brand, showcases experiments (BlockAbye, Brickify, Sournal), and routes visitors to per-app subdomain deployments. Experts build this type of site as a statically-generated Next.js application with a small number of interactive client islands (waitlist forms, mobile nav). The recommended approach is Next.js 16 with Tailwind CSS v4, shadcn/ui component primitives, and the Motion animation library. All marketing page content is statically generated at build time from a typed TypeScript config file — no database or CMS is needed at this scale (3 experiments). Visual polish comes from a consistent dark palette (violet/teal/cyan on near-black), scroll-triggered entrance animations, and GPU-safe transitions throughout.

The key structural decision is a single dynamic route (`app/experiments/[slug]/page.tsx`) powered by a `lib/experiments.ts` config file. This makes adding a 4th or 5th experiment a one-file change, prevents the duplication anti-pattern of hand-crafted per-app page files, and keeps all metadata generation automatic via `generateStaticParams` and `generateMetadata`. Server Components are the default for all page content; `'use client'` is pushed to leaf nodes only (the waitlist form, the mobile menu toggle). This maximizes Lighthouse scores and minimizes JS bundle size — both critical for a marketing site whose audiences include professional network visitors judging product quality on first impression.

The top risks are concentrated in the foundation phase: dark theme flash (FOUC) if `next-themes` is misconfigured, SSR instead of static generation on content that never changes, and Framer Motion/App Router incompatibilities if animation versions are not validated upfront. These are well-understood, well-documented problems with clear solutions. The secondary risk is animation performance on mobile — animating layout-triggering CSS properties instead of GPU-composited `transform`/`opacity`. All critical pitfalls have recoveries rated LOW to MEDIUM effort, meaning the project has low technical risk overall.

## Key Findings

### Recommended Stack

The stack is Next.js 16 (Turbopack by default, App Router, typed routes, no third-party metadata library), React 19.2, TypeScript 5.x, Tailwind CSS v4 (CSS-first `@theme` configuration replacing the old `tailwind.config.js` model), and shadcn/ui 3.x for accessible component primitives that are copied into the project rather than installed as a dependency. Animation is handled by Motion 11.x (the rebranded Framer Motion package, imported from `motion/react`). Supporting libraries include `next-themes` for zero-flicker dark mode, `react-intersection-observer` for scroll-trigger detection, `tw-animate-css` for Tailwind v4-compatible CSS keyframe utilities, and `lucide-react` for icons.

**Core technologies:**
- **Next.js 16**: Framework — SSR/SSG, App Router, Metadata API, Turbopack — no config needed for static marketing pages
- **Tailwind CSS v4**: Utility-first styling with CSS-first `@theme` — JazLab palette maps directly to CSS custom properties
- **shadcn/ui 3.x**: Component primitives copied into project — no runtime dependency, full Tailwind v4 + React 19 support
- **Motion 11.x**: Scroll-triggered reveals, entrance animations, hover states — React-native declarative API, tree-shakeable
- **Vercel**: Zero-config Next.js 16 deployment — handles SSR, image optimization, Edge CDN automatically

**Critical version notes:**
- Node.js 20.9+ required (Next.js 16 dropped Node 18)
- Use `motion` package (not `framer-motion`), import from `motion/react`
- Use `tw-animate-css` (not `tailwindcss-animate` — that's v3-era, incompatible with v4)
- Use `@tailwindcss/postcss` (not the old `tailwindcss` PostCSS plugin)
- Use `proxy.ts` not `middleware.ts` (renamed in Next.js 16)

### Expected Features

The MVP is tightly scoped: 9 table-stakes features are required for launch. Everything else is v1.x polish or v2+ deferral. The core site structure is homepage (hero + experiment grid) + 3 per-app marketing pages + shared nav/footer.

**Must have (table stakes — v1 launch):**
- Homepage hero with clear JazLab value proposition and primary CTA
- Experiment grid with 3 app cards (title, description, status badge, subdomain link)
- Per-app marketing page for each of the 3 experiments (hero, features, CTA/waitlist)
- Brand system applied consistently (violet/teal palette, dark foundation, typography)
- Sticky navigation header linking hub to all app pages
- SEO meta tags and Open Graph per page — indexed from day one
- Responsive layout (desktop + mobile)
- Status badges per app (Active / Beta / Coming Soon)
- Footer with links and contact

**Should have (competitive polish — v1.x):**
- Scroll-triggered animations (Motion entry reveals on experiment cards)
- Gradient text and accent typography on key headings
- Schema.org structured data per app page (30% more search CTR)
- Bento grid upgrade from uniform card layout
- Noise/grain texture on hero backgrounds

**Defer (v2+):**
- Blog / updates section (requires content strategy; empty blog is worse than no blog)
- Labs experiment log (valuable once 5+ experiments exist)
- Inline video demo per app page (defer until apps have UI worth demoing)
- App-specific illustrated hero per marketing page (defer until brand is locked)

**Anti-features to reject:**
- User authentication on the hub (apps handle their own auth on subdomains)
- Embedded microfrontend runtime / Module Federation (out of scope; link to subdomains)
- Pricing pages (all apps are pre-launch)
- Dark/light mode toggle (dilutes the lab aesthetic; commit fully to dark)

### Architecture Approach

The architecture is a static-first Next.js App Router site with a single source of truth in `lib/experiments.ts`. All 3 app marketing pages are generated from a single `app/experiments/[slug]/page.tsx` template via `generateStaticParams`. Pages and section components are Server Components; interactive elements (waitlist form, mobile menu) are isolated `'use client'` islands at the leaf level. One root layout provides the shared nav/footer shell — multiple root layouts would cause full-page reloads on navigation and must be avoided.

**Major components:**
1. `lib/experiments.ts` — Typed config array; single source of truth for all experiment data, slugs, status, subdomain URLs, and feature lists
2. `app/experiments/[slug]/page.tsx` — Data-driven template for all app marketing pages; `generateStaticParams` + `generateMetadata` handle routing and SEO automatically
3. `components/ui/` — Brand design system layer (Button, Badge, Card, GradientText) enforcing the JazLab palette
4. `WaitlistForm` (`'use client'`) — Only significant client island; hits `app/api/waitlist/route.ts` → external email service (Resend or similar)
5. `SiteNav` (Server Component shell + `MobileMenu` client island) — Shared navigation; active state via `usePathname()` isolated in client leaf

**Build order:** `lib/experiments.ts` + types → UI primitives → SiteNav/SiteFooter → root layout → home components → homepage → experiment page components → experiment marketing pages → OG images → sitemap/robots

### Critical Pitfalls

1. **Dark theme FOUC (white flash)** — Set `class="dark"` directly on `<html>` in root layout for a dark-only site; don't rely on JavaScript to apply the class. If using `next-themes`, set `forcedTheme="dark"` and add `suppressHydrationWarning` to `<html>`. Must be solved in the foundation phase before any visual work.

2. **SSR instead of static generation** — Marketing page content never changes between requests. Avoid `cookies()`, `headers()`, or uncached `fetch()` in page components — these force dynamic rendering. Verify with `next build` output: marketing pages must show `○` (static), not `λ` (dynamic).

3. **Motion/App Router incompatibilities** — Avoid `AnimatePresence` for page-level transitions in App Router (exit animations don't fire on route change). Avoid `layoutId` for cross-route shared element transitions. Use CSS `@starting-style` for enter/exit effects at the page level. Validate the Motion 11.x + Next.js 16 + React 19 combination in a minimal branch before building animated components.

4. **Overusing `'use client'`** — Marking page-level or section-level components as client components sends all their JS to the browser, destroying Lighthouse scores. Default to Server Components; push `'use client'` to the smallest leaf that actually needs interactivity (the form, the toggle button).

5. **Missing Open Graph metadata** — Without `metadataBase` set in root layout, relative OG image URLs are not resolved to absolute URLs and social scrapers silently fail. Every page must export unique `title`, `description`, and `openGraph.images`. Verify with LinkedIn Post Inspector before launch.

6. **Secrets exposed via `NEXT_PUBLIC_`** — Email service API keys (Resend, etc.) prefixed `NEXT_PUBLIC_` are visible in page source. All form submissions must route through a Server Action or API Route using server-only environment variables. High recovery cost (requires key rotation).

## Implications for Roadmap

Based on combined research, the architecture's explicit build order and the pitfall-to-phase mapping from PITFALLS.md converge on a clear 4-phase structure:

### Phase 1: Foundation and Setup

**Rationale:** All other phases depend on the type system, brand tokens, and root layout being correct. The most expensive pitfalls (FOUC, SSR vs. SSG, Motion compatibility, `'use client'` overuse, font loading CLS, environment variable exposure) must all be addressed here — fixing them later is costly because they affect every component. Architecture research explicitly states this build order.

**Delivers:** Scaffolded Next.js 16 project with Tailwind v4 + JazLab brand palette in `@theme`, shadcn/ui initialized, Motion validated with App Router, `lib/experiments.ts` with typed Experiment interface and all 3 experiment entries, root layout with correct font loading via `next/font`, dark class set on `<html>`, `metadataBase` configured, `.env.example` committed.

**Addresses:** Brand system (required by every feature), responsive layout foundation, dark mode setup

**Avoids:** FOUC, SSR instead of SSG, Motion/App Router incompatibilities, `'use client'` overuse, font FOUT/CLS, secrets exposure

### Phase 2: UI Component Library and Design System

**Rationale:** Components in `components/ui/` and `components/layout/` are shared dependencies of both the homepage and all app marketing pages. Building the design system first means no component is designed twice. The brand palette is defined in Phase 1; this phase makes it usable across the site.

**Delivers:** `Button`, `Badge` (with Active/Beta/Coming Soon variants), `Card`, `GradientText`, `SiteNav` (with `MobileMenu` client island), `SiteFooter`, and the `ExperimentCard` component. All components validated in isolation with correct dark palette, responsive behavior, and Server/Client boundary placement. Image dimension conventions established to prevent CLS.

**Addresses:** Sticky navigation header, footer, status badges, responsive design

**Avoids:** Animation performance issues (establish GPU-safe `transform`/`opacity` patterns in this phase), image CLS from unspecified dimensions

### Phase 3: Homepage and App Marketing Pages

**Rationale:** With the component library and data config in place, building the actual pages is assembly work. The homepage and app pages share components but have distinct content hierarchies — PITFALLS.md flags homepage messaging confusion as a pitfall to address before implementation (content hierarchy document first, then build).

**Delivers:** Homepage (HeroBanner + ExperimentGrid + CTA band, statically generated), all 3 app marketing pages via `app/experiments/[slug]/page.tsx` template (hero, features grid, waitlist form), and `app/api/waitlist/route.ts` connected to Resend or equivalent. Each page has unique SEO metadata and correct `generateStaticParams`.

**Addresses:** Homepage hero with value proposition, experiment grid with 3 app cards, per-app marketing pages, waitlist CTA/email capture, status badges on cards

**Avoids:** Hub homepage messaging confusion (one headline, one CTA, no feature lists in cards), waitlist form missing success state

### Phase 4: SEO, Polish, and Launch Verification

**Rationale:** SEO files depend on the experiments array being complete. Open Graph images and structured data are best added after page content is stable. Animation polish is added last — FEATURES.md explicitly notes "animate after structure is right." The pitfall-to-phase mapping from PITFALLS.md places Open Graph metadata, sitemap, and canonical tags in this phase.

**Delivers:** `app/sitemap.ts` (programmatically generated from experiments array), `app/robots.ts`, per-page OG images via `next/og` `ImageResponse`, Schema.org `SoftwareApplication` structured data per app, scroll-triggered Motion entrance animations on experiment cards (using `react-intersection-observer`), gradient text treatment on hero headings, pre-launch verification against the "Looks Done But Isn't" checklist.

**Addresses:** SEO meta + Open Graph per page, sitemap and canonical tags, scroll-triggered animations (v1.x), Schema.org structured data (v1.x), gradient text (v1.x)

**Avoids:** Missing/broken OG metadata, app pages not indexed, CORS/subdomain issues (verify no cross-subdomain API calls from shell), animation jank on mobile (test on real devices before launch)

### Phase Ordering Rationale

- **Data model before pages:** `lib/experiments.ts` must exist before any page can render experiment content. This is the single dependency that blocks everything else — its schema must be finalized early.
- **Design system before page assembly:** Shared components built once in Phase 2 prevent duplication and guarantee brand consistency across homepage and all 3 app pages.
- **Content before polish:** Building page structure in Phase 3 before adding animations in Phase 4 prevents the common mistake of animating a layout that later changes.
- **SEO last but before launch:** SEO files are trivial to generate programmatically but depend on the experiments array being stable and page URLs being finalized.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (Waitlist backend):** Specific email service selection (Resend vs. Loops vs. Mailchimp) and API Route implementation pattern. Research should identify which service best fits a solo founder's use case (pricing, deliverability, double opt-in requirements) and what rate limiting approach to use on the API Route.
- **Phase 4 (OG image generation):** `next/og` `ImageResponse` API with custom fonts and brand colors in a server context has some known limitations. May need brief research into font loading in ImageResponse specifically.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Foundation):** Well-documented Next.js 16 + Tailwind v4 + shadcn/ui setup. Stack research covers the exact commands and configuration. No ambiguity.
- **Phase 2 (Component library):** Standard React component patterns with Tailwind CSS. No novel integration challenges.
- **Phase 3 (Static pages):** `generateStaticParams` + `generateMetadata` are first-class Next.js App Router patterns with official documentation. Architecture research provides working code examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major technologies verified against official release notes and documentation (Next.js 16 blog, Tailwind v4 blog, Motion rebranding announcement, shadcn/ui v4 docs). Only minor MEDIUM-confidence items are community consensus on Motion vs. GSAP and Vercel hosting recommendation. |
| Features | HIGH | Competitor analysis (Vercel, Linear, Raycast) combined with SaaS landing page research and portfolio trend data. Feature prioritization matrix is well-grounded. Anti-features are explicitly derived from PROJECT.md constraints. |
| Architecture | HIGH | Based on official Next.js App Router documentation updated 2026-02-27. Build order and component boundaries are standard patterns with no ambiguity for this scale of site. |
| Pitfalls | HIGH | 12 critical pitfalls documented with official sources for each. Phase-to-pitfall mapping is concrete. All pitfalls have verified recovery strategies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Final domain name:** PROJECT.md notes the domain is not yet decided. Subdomain URLs in `lib/experiments.ts` and `metadataBase` in the root layout cannot be finalized until the domain is confirmed. Use environment variables (`NEXT_PUBLIC_SITE_URL`) as a placeholder; replace before launch.
- **Email service selection:** Research identifies Resend, Loops, Mailchimp, and Beehiiv as options but does not select one. The Phase 3 waitlist implementation needs a specific provider decision. Evaluate based on free tier limits and Next.js SDK availability.
- **OG image design:** The brand palette and typography are defined, but OG image visual design is not specified. Per-page OG images via `next/og` need a template design before Phase 4 implementation.
- **Experiment content:** Feature bullets, taglines, and descriptions for all 3 apps (`lib/experiments.ts`) need to be written as copy before Phase 3 pages can be built. This is a content/copywriting gap, not a technical one.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 release blog](https://nextjs.org/blog/next-16) — feature list, breaking changes, version requirements
- [Next.js App Router documentation](https://nextjs.org/docs/app/getting-started/project-structure) — structure, route groups, metadata, Server/Client components (updated 2026-02-27)
- [Tailwind CSS v4.0 release blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, `@theme` directive
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — v4 compatibility, `tw-animate-css`, OKLCH colors
- [Motion rebranding announcement](https://motion.dev/blog/framer-motion-is-now-independent-introducing-motion) — package rename, `motion/react` import path
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — zero-flicker SSR dark mode

### Secondary (MEDIUM confidence)
- Vercel, Linear, Raycast marketing sites — competitor feature analysis, dark aesthetic patterns
- [SaaS landing page best practices](https://userpilot.com/blog/saas-landing-pages/) — section structure, table stakes vs differentiators
- [Schema.org structured data for SEO](https://seranking.com/blog/structured-data/) — 30% CTR improvement finding
- [Core Web Vitals 2026 Optimization Guide](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide) — LCP, CLS, INP thresholds
- [Framer Motion App Router Issue #49279](https://github.com/vercel/next.js/issues/49279) — animation compatibility bug

### Tertiary (LOW confidence — needs validation during implementation)
- WebSearch: "Motion library framer-motion v11 2025 React animation recommended" — community consensus on Motion vs. GSAP
- WebSearch: "Vercel deployment Next.js 2025" — hosting recommendation

---
*Research completed: 2026-03-03*
*Ready for roadmap: yes*
