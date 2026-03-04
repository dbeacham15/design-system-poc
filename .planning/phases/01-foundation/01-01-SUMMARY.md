---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [nextjs, tailwind, shadcn, typography, design-tokens, dark-theme]

# Dependency graph
requires: []
provides:
  - "Next.js 16 project at jazlab-hub/ with Tailwind v4 and shadcn/ui installed"
  - "JazLab brand token system via Tailwind @theme (bg-violet, text-teal, bg-surface-raised, etc.)"
  - "Three-font typography stack (Space Grotesk display, Inter body, JetBrains Mono mono)"
  - "Noise/grain texture on dark background via body::before feTurbulence at 6% opacity"
  - "shadcn/ui CSS variables bridged to JazLab brand values in globals.css"
  - "Gradient tokens (--gradient-brand, --gradient-accent) as CSS custom properties"
  - "Minimal homepage Server Component placeholder (static ○)"
affects:
  - "02-foundation (experiments data model)"
  - "All downstream phases — brand tokens and typography are the system-wide foundation"

# Tech tracking
tech-stack:
  added:
    - "next 16.1.6 — App Router, Turbopack, static generation"
    - "tailwindcss ^4 — CSS-first @theme token generation"
    - "@tailwindcss/postcss ^4 — PostCSS integration for Tailwind v4"
    - "shadcn/ui 3.x — Accessible component primitives via npx shadcn@latest init"
    - "tw-animate-css ^1.4.0 — shadcn v4 replacement for tailwindcss-animate"
    - "next/font/google — Zero-FOUC font loading (Inter, Space Grotesk, JetBrains Mono)"
  patterns:
    - "Tailwind v4 @theme block for brand color tokens (generates utility classes)"
    - "@theme inline block for bridging :root shadcn variables to Tailwind utilities"
    - "Hardcoded class=dark on html element (dark-only site, no next-themes)"
    - "body { background-color: #0F1117 } as raw CSS rule (not utility) to prevent FOUC"
    - "body::before feTurbulence SVG data-URI for noise texture (zero network requests)"
    - "Three next/font instances each with variable + display:swap injected on html"
    - "Server Components only at page level — no use client on layout.tsx or page.tsx"

key-files:
  created:
    - "jazlab-hub/package.json — Next.js 16, Tailwind v4, shadcn, tw-animate-css"
    - "jazlab-hub/tsconfig.json — TypeScript config with @/* import alias"
    - "jazlab-hub/next.config.ts — Next.js config (Turbopack default)"
    - "jazlab-hub/postcss.config.mjs — @tailwindcss/postcss integration"
    - "jazlab-hub/components.json — shadcn/ui config wired to Tailwind v4"
    - "jazlab-hub/src/lib/utils.ts — shadcn cn() utility"
  modified:
    - "jazlab-hub/src/app/globals.css — Full JazLab brand system: @theme, :root, @theme inline, body::before"
    - "jazlab-hub/src/app/layout.tsx — Three fonts, dark class on html, metadata with NEXT_PUBLIC_SITE_URL"
    - "jazlab-hub/src/app/page.tsx — Minimal Server Component placeholder using brand tokens"

key-decisions:
  - "Hardcoded class=dark on html (no next-themes) — JazLab is dark-only, avoids FOUC and JS weight"
  - "background-color: #0F1117 set as raw CSS rule on body (not Tailwind utility) — prevents white flash on load"
  - "shadcn @theme inline kept alongside custom @theme block — bridges shadcn vars without duplicating CSS vars"
  - "tw-animate-css replaces tailwindcss-animate — shadcn v4 migration requirement"
  - "Opacity 0.06 (6%) for noise texture — middle of 5-8% range per user decision in CONTEXT.md"
  - "No shadcn components installed in Phase 1 — only init; components added in Phase 2 when needed"

patterns-established:
  - "Brand token pattern: literal names in @theme (bg-violet), semantic names for surfaces (bg-surface)"
  - "Font pattern: next/font with variable= prop, injected on html className, referenced in @theme as --font-display etc."
  - "shadcn bridge pattern: :root hex values + @theme inline var() references (not duplicate definitions)"
  - "Static page pattern: Server Components with no dynamic APIs render as ○ by default"

requirements-completed: [BRAND-04, BRAND-07]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 1 Plan 01: Foundation Scaffold Summary

**Next.js 16 + Tailwind v4 scaffolded with JazLab brand token system, three-font typography (Space Grotesk/Inter/JetBrains Mono), feTurbulence noise texture at 6% opacity, and shadcn/ui CSS variables bridged to JazLab violet/teal palette**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T01:02:32Z
- **Completed:** 2026-03-04T01:06:25Z
- **Tasks:** 2
- **Files modified:** 3 (modified), 6 (created via scaffold)

## Accomplishments

- Scaffolded jazlab-hub/ via create-next-app with Next.js 16, TypeScript, Tailwind v4, ESLint, App Router, src/ dir
- Initialized shadcn/ui (Tailwind v4 native) with components.json, installed tw-animate-css
- Rewrote globals.css with complete JazLab brand system: @theme brand tokens, :root shadcn bridge, @theme inline utilities, gradient tokens, and body::before feTurbulence noise texture at 6% opacity
- Replaced layout.tsx with three-font next/font setup (Space Grotesk, Inter, JetBrains Mono) with hardcoded dark class and correct metadata structure
- Created minimal homepage Server Component placeholder using brand token utilities
- `npm run build` produces all static (○) output — no dynamic (λ) pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project with Tailwind v4 and shadcn/ui** - `2560f99` (chore)
2. **Task 2: Wire JazLab brand system — tokens, typography, noise, shadcn bridge** - `fed0257` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `jazlab-hub/src/app/globals.css` — Complete JazLab brand system: @theme brand palette + surface/text tokens, :root shadcn bridge with JazLab hex values, @theme inline Tailwind bridge, gradient tokens, body::before noise texture
- `jazlab-hub/src/app/layout.tsx` — Three fonts via next/font/google (Space Grotesk display, Inter body, JetBrains Mono mono), hardcoded dark class on html, metadata with NEXT_PUBLIC_SITE_URL
- `jazlab-hub/src/app/page.tsx` — Minimal Server Component using font-display and text-text-secondary brand tokens
- `jazlab-hub/components.json` — shadcn/ui config wired to Tailwind v4
- `jazlab-hub/src/lib/utils.ts` — shadcn cn() utility
- `jazlab-hub/package.json` — Next.js 16.1.6, Tailwind v4, tw-animate-css, shadcn deps

## Decisions Made

- Hardcoded `class="dark"` on `<html>` (no next-themes) — JazLab is dark-only by product decision; avoids hydration complexity and FOUC risk
- Set `background-color: #0F1117` as a raw CSS rule on `body` (not a Tailwind utility class) — ensures dark background loads synchronously before JS, preventing white flash
- Kept shadcn's `@custom-variant dark (&:where(.dark, .dark *))` syntax from RESEARCH.md — correct Tailwind v4 class-based dark mode
- Removed `@import "shadcn/tailwind.css"` from shadcn's generated globals.css — replaced with explicit @theme and :root blocks that give full brand control
- Kept chart/sidebar variables in :root for future shadcn component compatibility, wired to JazLab surface values

## Deviations from Plan

None — plan executed exactly as written. The shadcn init generated slightly different CSS than the research showed (OKLCH values, `shadcn/tailwind.css` import), but the Task 2 full replacement handled this as designed.

## Issues Encountered

None — scaffold, init, and brand wiring all succeeded on first attempt. Build produces `○` (static) for all pages.

## User Setup Required

None - no external service configuration required for Phase 1.

## Next Phase Readiness

- jazlab-hub/ runs locally with `npm run dev`
- All brand token utilities generated (bg-violet, text-teal, bg-surface-raised, font-display, etc.)
- Three fonts load via next/font with zero layout shift
- Noise texture visible on #0F1117 background via body::before
- shadcn/ui CSS variables wired to JazLab brand — Phase 2 components will automatically use correct colors
- Phase 2 can add shadcn components and build UI components against the established token system

---
*Phase: 01-foundation*
*Completed: 2026-03-04*

## Self-Check: PASSED

- FOUND: jazlab-hub/src/app/globals.css
- FOUND: jazlab-hub/src/app/layout.tsx
- FOUND: jazlab-hub/src/app/page.tsx
- FOUND: jazlab-hub/components.json
- FOUND: jazlab-hub/src/lib/utils.ts
- FOUND commit: 2560f99 (scaffold)
- FOUND commit: fed0257 (brand system)
