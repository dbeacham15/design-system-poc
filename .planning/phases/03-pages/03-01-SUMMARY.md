---
phase: 03-pages
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, motion, canvas, animation, vitest, server-components, bento-grid]

# Dependency graph
requires:
  - phase: 02-ui-system
    plan: 02
    provides: ExperimentCard, BentoGrid, GradientHeading, SiteHeader (with SVG logo), SiteFooter, root layout wired, jazlab-logo.svg

provides:
  - ParticleBackground client component (full-viewport canvas, cosmic floating particles, teal + white + gold sparkle)
  - MotionWrapper client component (thin "use client" wrapper exposing HTMLMotionProps for Server Component pages)
  - AnimatedBentoGrid client component (3 experiment cards with staggered whileInView scroll-reveal)
  - Full homepage replacing placeholder (hero section with logo + gradient headline + subheading, animated experiment grid)
  - 30 new file-read tests covering all 3 components and homepage

affects: [03-pages-02, 04-final-polish]

# Tech tracking
tech-stack:
  added: [motion@12.34.5 (npm package, import from motion/react)]
  patterns:
    - "ParticleBackground uses requestAnimationFrame loop with cancelAnimationFrame cleanup — zero external dependencies, ~80 lines"
    - "Mobile particle count reduced via window.matchMedia check inside useEffect — 60 mobile / 120 desktop"
    - "MotionWrapper extends HTMLMotionProps<'div'> with ...motionProps spread — generic Server Component motion bridge"
    - "AnimatedBentoGrid uses whileInView + viewport={{ once: true }} to prevent re-animation on scroll-up"
    - "page.tsx remains Server Component — all 'use client' isolated to thin wrapper components"
    - "Canvas z-index via inline style={{ zIndex: 0 }}, not className, to avoid Tailwind purging inline stacking context"

key-files:
  created:
    - jazlab-hub/src/components/ParticleBackground.tsx
    - jazlab-hub/src/components/MotionWrapper.tsx
    - jazlab-hub/src/components/AnimatedBentoGrid.tsx
    - jazlab-hub/tests/particle-background.test.ts
    - jazlab-hub/tests/motion-wrapper.test.ts
    - jazlab-hub/tests/homepage.test.ts
  modified:
    - jazlab-hub/src/app/page.tsx
    - jazlab-hub/package.json

key-decisions:
  - "motion package (motion/react import) installed at 12.34.5 — canonical install per research, backward-compatible with React 19"
  - "Canvas z-index applied via inline style prop (not Tailwind className) — avoids Tailwind utility purging and correctly layers below body > * z-index: 1 rule in globals.css"
  - "ParticleBackground reduces to 60 particles on mobile via window.matchMedia('(max-width: 768px)') — balances visual richness and performance on budget devices"
  - "Gold sparkle particles (rgba 255,211,107) for z > 0.9 (~5% of particles) — adds visual interest matching --color-sparkle brand token aesthetic"
  - "MotionWrapper spreads ...motionProps directly — maximum flexibility for animate, initial, whileInView, transition from any Server Component callsite"
  - "AnimatedBentoGrid stagger delay = index * 0.12s — slightly tighter than 0.1s reference for smoother reveal feel with 3 cards"
  - "Homepage hero uses min-h-[calc(100vh-4rem)] to account for sticky SiteHeader height — full viewport feel without hidden overflow"

patterns-established:
  - "Pattern 7: Canvas animation component — full-viewport fixed canvas via useRef + requestAnimationFrame; cleanup with cancelAnimationFrame + removeEventListener"
  - "Pattern 8: Server-to-Client motion bridge — MotionWrapper extends HTMLMotionProps to expose motion.div capabilities without 'use client' in page files"
  - "Pattern 9: File-read TDD for client components — assertions on source string verify 'use client', imports, and structural patterns without DOM rendering"

requirements-completed: [BRAND-01, SHOW-01, SHOW-03, SHOW-04, SEO-03]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 03 Plan 01: Homepage with Cosmic Particle Background and Animated Experiment Grid Summary

**Custom canvas particle animation (teal + white + gold, mobile-aware), MotionWrapper Server-to-Client bridge, AnimatedBentoGrid with staggered whileInView, and full homepage replacing placeholder — 98/98 tests green, build fully static**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T02:19:27Z
- **Completed:** 2026-03-04T02:21:20Z
- **Tasks:** 2 (both auto, both TDD)
- **Files modified:** 8 (3 new components + 3 new test files + 1 modified page + 1 package.json)

## Accomplishments

- Built ParticleBackground: full-viewport HTML5 canvas with 120 cosmic floating particles (teal 40,199,183 + near-white 242,244,248 + gold sparkle 255,211,107 for z > 0.9), mobile-aware count reduction, requestAnimationFrame loop with full cleanup
- Built MotionWrapper: thin "use client" wrapper extending HTMLMotionProps<"div"> that bridges motion.div capabilities to Server Component pages via ...motionProps spread
- Built AnimatedBentoGrid: renders all 3 experiment cards with staggered whileInView fade-in (opacity: 0 → 1, y: 32 → 0, delay: index * 0.12s, viewport once: true)
- Replaced placeholder page.tsx with full homepage: cosmic ParticleBackground, hero section (SVG logo + GradientHeading h1 + subheading wrapped in MotionWrapper entrance animation), and experiments section (id="experiments" anchor + GradientHeading h2 + AnimatedBentoGrid)
- 30 new tests added: 13 particle-background + 5 motion-wrapper + 12 homepage (all pass); full suite 98/98 green; npm run build exits 0 with homepage as static (○)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install motion + create ParticleBackground, MotionWrapper, AnimatedBentoGrid** - `a9e0e7a` (feat)
2. **Task 2: Build homepage with cosmic hero section and animated experiment grid** - `d8c9b0d` (feat)

**Plan metadata:** (to be committed)

_Note: Both tasks followed TDD: RED (failing tests) → GREEN (components + page) pattern._

## Files Created/Modified

- `jazlab-hub/src/components/ParticleBackground.tsx` - "use client" canvas component; fixed viewport, useRef, requestAnimationFrame loop, mobile matchMedia, 3-color particle palette
- `jazlab-hub/src/components/MotionWrapper.tsx` - "use client" thin wrapper; extends HTMLMotionProps<"div">, spreads ...motionProps, cn() for className
- `jazlab-hub/src/components/AnimatedBentoGrid.tsx` - "use client" grid; wraps ExperimentCard in motion.div with whileInView + stagger; matches BentoGrid responsive grid classes
- `jazlab-hub/tests/particle-background.test.ts` - 13 file-read assertions on canvas, animation loop, brand colors, responsive sizing
- `jazlab-hub/tests/motion-wrapper.test.ts` - 5 file-read assertions on "use client", motion/react import, HTMLMotionProps, motionProps spread
- `jazlab-hub/tests/homepage.test.ts` - 12 file-read assertions on imports, logo, headline, id="experiments" anchor, responsiveness, Server Component status
- `jazlab-hub/src/app/page.tsx` - Full homepage replacing placeholder; Server Component; hero + experiments sections
- `jazlab-hub/package.json` - Added motion@12.34.5 dependency

## Decisions Made

- motion@12.34.5 installed as production dependency — canonical package name per research (formerly framer-motion), compatible with React 19 at runtime despite peer dependency range
- Canvas z-index via inline `style={{ zIndex: 0 }}` rather than Tailwind class — prevents Tailwind from purging the inline stacking context; correctly layers behind `body > * { z-index: 1 }` in globals.css
- Gold sparkle particles added for z > 0.9 — approximately 5% of particles get rgba(255,211,107) matching --color-sparkle brand token, adds visual richness without separate particle type
- Hero section height `min-h-[calc(100vh-4rem)]` — accounts for sticky SiteHeader (4rem) so hero feels full-viewport without hidden overflow
- AnimatedBentoGrid defined as standalone "use client" component rather than inline in page.tsx — keeps page.tsx as Server Component per architectural decision

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — motion installed without peer dependency errors (ERESOLVE not triggered), all tests passed on first run in GREEN phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 3 Plan 01 components ready: ParticleBackground, MotionWrapper, AnimatedBentoGrid
- Homepage fully realized with cosmic aesthetic, hero section, and animated experiment grid
- 98/98 tests green; build fully static (no lambda pages)
- Phase 3 Plan 02 (experiment slug pages) can build on MotionWrapper and the established animation patterns
- Remaining open items: domain name (NEXT_PUBLIC_SITE_URL placeholder), email service selection (Phase 3 Plan 02), OG image design (Phase 4)

---
*Phase: 03-pages*
*Completed: 2026-03-04*

## Self-Check: PASSED

- FOUND: jazlab-hub/src/components/ParticleBackground.tsx
- FOUND: jazlab-hub/src/components/MotionWrapper.tsx
- FOUND: jazlab-hub/src/components/AnimatedBentoGrid.tsx
- FOUND: jazlab-hub/src/app/page.tsx
- FOUND: jazlab-hub/tests/particle-background.test.ts
- FOUND: jazlab-hub/tests/motion-wrapper.test.ts
- FOUND: jazlab-hub/tests/homepage.test.ts
- FOUND: .planning/phases/03-pages/03-01-SUMMARY.md
- COMMIT a9e0e7a: feat(03-pages-01): install motion + create ParticleBackground, MotionWrapper, AnimatedBentoGrid
- COMMIT d8c9b0d: feat(03-pages-01): build homepage with cosmic hero section, particle background, and animated experiment grid
