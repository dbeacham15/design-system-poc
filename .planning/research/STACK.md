# Stack Research

**Domain:** Next.js marketing/landing page hub — dark UI, animations, microfrontend linking
**Researched:** 2026-03-03
**Confidence:** HIGH (core framework, CSS, and animation layers verified against official release notes and current docs)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (latest stable, released Oct 2025) | Framework — SSR, routing, metadata API, image optimization | Created by Vercel, ships Turbopack by default in v16 (2-5x faster builds), App Router is fully mature, first-class SEO via Metadata API (no third-party head library needed), typed routes stable in v15.5+. Marketing pages stay static; no caching config needed when `cacheComponents` is not opted in. |
| React | 19.2 (bundled with Next.js 16) | UI rendering | Ships with Next.js 16; required minimum. View Transitions API is now available, enabling page-transition animations without additional libraries. |
| TypeScript | 5.x (required by Next.js 16) | Type safety | Next.js 16 requires TypeScript 5.1+. `create-next-app` scaffolds with strict mode and typed routes by default. |
| Tailwind CSS | 4.x (v4.0 stable, released Jan 2025) | Utility-first styling | CSS-first configuration via `@theme` directive — the JazLab color palette (violets, teals, cyans, dark backgrounds) maps directly to `@theme` custom properties that become CSS variables. 5x faster full builds, 100x faster incremental. `@tailwindcss/postcss` plugin for Next.js integration. |
| shadcn/ui | latest CLI (3.x, Aug 2025) | Accessible headless component primitives | Not a dependency — components are copied into your project. Built on Radix UI primitives. Fully supports Tailwind v4 and React 19. Ships dark mode via CSS custom properties (OKLCH color system). Only add what you need. Lucide icons bundled. |

### Animation Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Motion (formerly Framer Motion) | 11.x (`motion` npm package) | Scroll-triggered reveals, entrance animations, interactive hover states | Rebranded from `framer-motion` to `motion` (independent, not Framer-owned). Install via `npm install motion`; import from `motion/react`. Declarative React API, works naturally with Suspense and concurrent rendering. Used in production at Stripe, Notion, and Vercel itself. Bundle is tree-shakeable — only animated components ship. |

**Why Motion over GSAP for this project:** JazLab is a React/Next.js app. Motion's declarative API (animate props, exit animations, layout animations) integrates cleanly with React state and component lifecycle. GSAP is superior for complex timelines and SVG morphing; JazLab's animation needs (scroll reveals, card hovers, hero entrances) are squarely in Motion's wheelhouse with far less imperative code. GSAP also requires a paid license for some commercial use cases (ScrollSmoother, etc.) that would be needed to match Motion's developer experience for this type of site.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-themes` | latest (^0.4.x) | Zero-flicker theme switching | Use this even though JazLab is permanently dark — it future-proofs a light mode toggle and eliminates SSR hydration mismatches for `dark` class injection on `<html>`. Set `defaultTheme="dark"` and `forcedTheme="dark"` initially; unlock toggle later. |
| `lucide-react` | latest (^0.57x, ~29M weekly downloads) | Icon set | Default icon library for shadcn/ui. Tree-shakeable ESM-first. 29M weekly downloads. Required for lab icons (flask, sparkle, beaker) and UI chrome (external links, chevrons, etc.). |
| `tw-animate-css` | latest | CSS animation utilities for Tailwind v4 | Replaces `tailwindcss-animate` (v3-era) which is incompatible with Tailwind v4. shadcn/ui's official v4-compatible animation utility. Use for basic keyframe animations (fade-in, slide-in) that don't warrant full Motion components. |
| `react-intersection-observer` | latest (^9.x) | Trigger scroll animations | Thin React wrapper around native IntersectionObserver. Use in client components to trigger Motion `animate` state when experiment cards enter the viewport. Avoids scroll event listener performance penalty. |
| `clsx` + `tailwind-merge` | latest | Conditional class merging | Standard shadcn/ui pattern. `clsx` for conditional class logic, `tailwind-merge` (via `cn()` utility) to resolve Tailwind class conflicts safely. Scaffolded automatically by shadcn CLI. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack (bundled in Next.js 16) | Development and production bundler | Default in Next.js 16 — no configuration needed. 10x faster Fast Refresh. Do not eject to Webpack unless you have an existing webpack plugin dependency. |
| ESLint (with `eslint.config.mjs`) | Linting | Next.js 16 deprecated `next lint` command. Generate explicit config via `create-next-app`. Use Biome as alternative if you want formatting + linting in one tool. |
| `@tailwindcss/postcss` | PostCSS plugin for Tailwind v4 + Next.js | Required for Next.js (which uses PostCSS internally). Add to `postcss.config.mjs`. |
| Vercel | Deployment and hosting | Zero-config Next.js 16 support. Free tier includes 100 GB bandwidth and serverless functions. Handles SSR, image optimization, and Edge Network distribution automatically. Recommended for JazLab at experimental stage — no ops overhead. |

---

## Installation

```bash
# Bootstrap
npx create-next-app@latest jazlab --typescript --tailwind --eslint --app --turbopack

# Tailwind v4 PostCSS plugin (if not auto-configured)
npm install @tailwindcss/postcss

# shadcn/ui CLI (run after project creation)
npx shadcn@latest init

# Animation
npm install motion

# Theme switching
npm install next-themes

# Scroll trigger utility
npm install react-intersection-observer

# Animation utilities (Tailwind v4 compatible)
npm install tw-animate-css

# Icons (installed by shadcn, but explicit here)
npm install lucide-react
```

---

## Tailwind v4 Theme Configuration for JazLab

Define the full JazLab palette in `app/globals.css` using the `@theme` directive. All values become CSS custom properties automatically:

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* JazLab brand colors */
  --color-jaz-violet: #5B3DF5;
  --color-jaz-teal: #28C7B7;
  --color-jaz-cyan: #00D4FF;
  --color-jaz-sparkle: #FFD36B;

  /* Dark foundation */
  --color-jaz-bg: #0F1117;
  --color-jaz-card: #1A1E2A;
  --color-jaz-panel: #242938;
  --color-jaz-border: #32384A;

  /* Typography */
  --color-jaz-text-primary: #F2F4F8;
  --color-jaz-text-secondary: #A4A9B6;
  --color-jaz-text-muted: #6C7385;

  /* Font stack */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

Use as: `bg-jaz-bg`, `text-jaz-violet`, `border-jaz-border`, etc. No extra plugin configuration needed.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `tailwindcss-animate` | v3-era plugin, incompatible with Tailwind v4's new CSS engine | `tw-animate-css` |
| `framer-motion` (old package name) | Rebranded to `motion` — old package still works but points to new package; import path is now `motion/react` | `motion` npm package |
| `next/head` | Removed in App Router — causes build errors | App Router `metadata` export or `generateMetadata()` function |
| `@heroicons/react` | Larger bundle, less active than Lucide; not default in shadcn/ui | `lucide-react` |
| `react-icons` | Large bundle, imports entire icon sets; 3-10x heavier than Lucide per icon | `lucide-react` (tree-shakeable) |
| `styled-components` / `emotion` | CSS-in-JS runtime adds client-side overhead; conflicts with RSC (React Server Components) | Tailwind utility classes + CSS custom properties |
| `autoprefixer` (standalone) | Tailwind v4 handles vendor prefixing internally via `@tailwindcss/postcss` | `@tailwindcss/postcss` replaces the old `postcss` + `tailwindcss` + `autoprefixer` triple |
| `images.domains` config in `next.config.ts` | Deprecated in Next.js 16; will be removed | `images.remotePatterns` with specific hostname+path patterns |
| `middleware.ts` filename | Deprecated in Next.js 16 in favor of `proxy.ts` | `proxy.ts` — rename the file and exported function |
| GSAP (for this project) | Better fit for complex timeline/SVG work; for this project's scroll reveals and hover effects it adds vendor lock-in and licensing complexity vs. Motion's React-native approach | `motion` |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Astro 5 | When the site is almost entirely static content with minimal React interactivity; Astro's island architecture would be overkill here since JazLab already commits to Next.js |
| Tailwind CSS v4 | CSS Modules | When design tokens aren't shared across many components; for a design-system-heavy site like JazLab, Tailwind's utility model with `@theme` variables is more productive |
| shadcn/ui | Radix UI directly | When you need full component control without opinionated defaults; shadcn/ui IS Radix UI — it just pre-wires Tailwind classes, so there's no meaningful tradeoff |
| shadcn/ui | HeroUI (formerly NextUI) | When you need a fully-managed component library with built-in animations; HeroUI is heavier and opinionated — harder to match a custom dark brand identity |
| Motion | React Spring | When you need physics-based springs over duration-based easing; Motion handles both models, so React Spring adds nothing for this project |
| Vercel | Cloudflare Pages | When you need global edge + full Node.js runtime at the edge; Vercel's free tier is better for a solo founder's experimental portfolio hub |

---

## Stack Patterns by Variant

**For purely static marketing pages (no server data):**
- Use `export const dynamic = 'force-static'` or just avoid any dynamic server functions — Next.js 16 defaults to dynamic at request time, so static pages need explicit caching opt-in via `"use cache"` directive
- Pages like `/`, `/experiments/blockabye` are static — add `"use cache"` or export static params

**For waitlist/CTA forms:**
- Use Next.js Server Actions — avoids a separate API route file; keeps the form logic co-located
- No database needed initially; forward to Resend or ConvertKit via Server Action

**For dark mode only (initial phase):**
- Set `<ThemeProvider defaultTheme="dark" forcedTheme="dark">` in `next-themes`
- Remove toggle UI entirely — add it in a future milestone when light mode is designed

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.x | React 19.2, TypeScript 5.1+, Node.js 20.9+ | Node.js 18 dropped in v16; verify local Node version before scaffolding |
| Tailwind CSS 4.x | `@tailwindcss/postcss` 4.x | Do NOT use the old `tailwindcss` PostCSS plugin from v3; they are separate packages |
| shadcn/ui CLI 3.x | Tailwind v4, React 19, Next.js 15/16 | Run `npx shadcn@latest init` — old `npx shadcn-ui@latest` package is deprecated |
| `motion` 11.x | React 18.2+, React 19.x | Import from `motion/react` not `framer-motion` |
| `next-themes` 0.4.x | Next.js App Router, React 19 | Requires `suppressHydrationWarning` on `<html>` tag in root layout |
| `tw-animate-css` | Tailwind v4 only | Not compatible with Tailwind v3; if project uses v3, use `tailwindcss-animate` instead |

---

## Sources

- [Next.js 16 release blog](https://nextjs.org/blog/next-16) — feature list, breaking changes, version requirements (HIGH confidence)
- [Next.js 15.5 release blog](https://nextjs.org/blog/next-15-5) — Turbopack builds beta, typed routes stable (HIGH confidence)
- [Tailwind CSS v4.0 release blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, `@theme` directive (HIGH confidence)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — v4 compatibility, `tw-animate-css`, OKLCH colors (HIGH confidence)
- [Motion rebranding announcement](https://motion.dev/blog/framer-motion-is-now-independent-introducing-motion) — package rename, `motion/react` import path (HIGH confidence)
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — zero-flicker SSR dark mode (HIGH confidence)
- [lucide-react npm page](https://www.npmjs.com/package/lucide-react) — 29M weekly downloads, ESM tree-shaking (MEDIUM confidence — npm page 403'd, verified via WebSearch results)
- WebSearch: "Motion library framer-motion v11 2025 React animation recommended" — community consensus on Motion vs GSAP (MEDIUM confidence)
- WebSearch: "Vercel deployment Next.js 2025" — hosting recommendation (MEDIUM confidence)

---

*Stack research for: JazLab — Next.js marketing/landing page hub with dark UI, animations, microfrontend linking*
*Researched: 2026-03-03*
