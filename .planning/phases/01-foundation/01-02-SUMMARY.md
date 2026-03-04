---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [nextjs, typescript, vitest, testing, experiments, data-model, static-generation]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: "globals.css with brand tokens and noise texture; layout.tsx with three-font setup"
provides:
  - "Typed experiments data model: Experiment, ExperimentFeature, ExperimentStatus types in src/types/experiments.ts"
  - "Single source of truth for all 3 experiments (blockabye, brickify, sournal) in src/lib/experiments.ts"
  - "Static [slug] route with generateStaticParams pre-rendering all 3 experiment slugs"
  - "Vitest test suite: 21 tests across 4 files validating experiments data, brand tokens, typography, noise texture"
  - "npm run test:run and npm run test scripts in package.json"
affects:
  - "02-foundation (Phase 2 components consume experiments array and types)"
  - "03-pages (Phase 3 fills in the real experiment marketing pages)"
  - "All downstream phases that render experiments data"

# Tech tracking
tech-stack:
  added:
    - "vitest ^4.0.18 — test runner with path alias support"
  patterns:
    - "File-read test pattern: CSS and TSX files read as strings via fs.readFileSync for structural validation"
    - "Vitest config with resolve.alias matching tsconfig @/* paths"
    - "generateStaticParams pattern for SSG dynamic routes (renders as ● not λ)"
    - "Experiments data as a typed constant array — single source of truth, no fetch, no async"

key-files:
  created:
    - "jazlab-hub/src/types/experiments.ts — Experiment, ExperimentFeature, ExperimentStatus type definitions"
    - "jazlab-hub/src/lib/experiments.ts — Typed array of 3 experiments with all required fields"
    - "jazlab-hub/src/app/experiments/[slug]/page.tsx — Static [slug] route with generateStaticParams"
    - "jazlab-hub/vitest.config.ts — Vitest configuration with @/* path alias"
    - "jazlab-hub/tests/experiments.test.ts — 6 tests: data model completeness, statuses, uniqueness, hex colors"
    - "jazlab-hub/tests/brand-tokens.test.ts — 6 tests: CSS token presence in globals.css"
    - "jazlab-hub/tests/layout.test.ts — 5 tests: font variable class names and dark class in layout.tsx"
    - "jazlab-hub/tests/noise-texture.test.ts — 4 tests: noise layer CSS rules and opacity range"
  modified:
    - "jazlab-hub/package.json — added test and test:run scripts, vitest devDependency"

key-decisions:
  - "Experiments data stored as a plain typed constant array (not fetched, not async) — zero dynamic API calls keeps all routes static"
  - "Tests read CSS/TSX files as strings (not DOM tests) — validates structural presence; visual correctness verified manually"
  - "Vitest path alias (@/*) configured to match tsconfig to enable direct @/lib/experiments imports in tests"
  - "generateStaticParams returns all 3 slugs — renders as ● (SSG) not ○ (static) but equally static, no λ pages"

patterns-established:
  - "File-read test pattern: use fs.readFileSync to validate CSS/TSX structure without browser or DOM"
  - "Data-driven static routes: lib/experiments.ts -> generateStaticParams -> pre-rendered [slug] pages"
  - "Typed data module pattern: strict TypeScript types in types/ consumed by lib/ data modules"

requirements-completed: [BRAND-04, BRAND-07]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 1 Plan 02: Experiments Data Model and Test Suite Summary

**Typed experiments data model (3 apps, 21 fields each), static [slug] route via generateStaticParams, and Vitest test suite (21 tests across 4 files) validating experiments data, brand tokens, typography, and noise texture**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T01:09:34Z
- **Completed:** 2026-03-04T01:11:24Z
- **Tasks:** 2
- **Files modified:** 9 (8 created, 1 modified)

## Accomplishments

- Created typed experiments type definitions (Experiment, ExperimentFeature, ExperimentStatus) in src/types/experiments.ts
- Built typed data array for all 3 experiments (BlockAbye/beta, Brickify/beta, Sournal/coming-soon) with 3 features each, env-var subdomain URLs, and accent colors
- Wired static [slug] route with generateStaticParams — npm run build shows all pages as ○ or ● SSG, zero λ dynamic pages
- Installed Vitest and configured with path aliases matching tsconfig @/* alias
- Created 4 test files (21 tests total) validating data model completeness, brand token presence, layout typography, and noise texture CSS rules
- All 21 tests pass; npm run build exits 0 with 100% static output

## Task Commits

Each task was committed atomically:

1. **Task 1: Create experiments type definitions and data model** - `0a203e8` (feat)
2. **Task 2: Set up Vitest and write Phase 1 validation tests** - `7562d07` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `jazlab-hub/src/types/experiments.ts` — ExperimentStatus, ExperimentFeature, Experiment type definitions
- `jazlab-hub/src/lib/experiments.ts` — Typed array of 3 experiments: blockabye (beta), brickify (beta), sournal (coming-soon)
- `jazlab-hub/src/app/experiments/[slug]/page.tsx` — generateStaticParams + async params Server Component placeholder
- `jazlab-hub/vitest.config.ts` — Vitest config with test.globals=true and @/* alias
- `jazlab-hub/package.json` — Added `test` and `test:run` scripts, vitest devDependency
- `jazlab-hub/tests/experiments.test.ts` — 6 tests: 3 items, required fields, correct statuses, unique slugs, hex colors, features
- `jazlab-hub/tests/brand-tokens.test.ts` — 6 tests: violet/teal/surface colors, font tokens, @theme inline, gradient-brand
- `jazlab-hub/tests/layout.test.ts` — 5 tests: font-inter, font-space-grotesk, font-jetbrains-mono class names, dark class, next/font/google import
- `jazlab-hub/tests/noise-texture.test.ts` — 4 tests: body::before rule, feTurbulence, opacity in 0.05-0.08 range, pointer-events none

## Decisions Made

- Tests read CSS/TSX files as strings (not DOM/JSDOM tests) — the plan specified this intentionally. Validates structure automatically; visual correctness is verified manually via `npm run dev`.
- All 3 experiment subdomain URLs use per-app environment variables with jazlab.llc fallback defaults — matches plan spec and RESEARCH.md Pattern 4 exactly.
- vitest.config.ts uses `resolve.alias` (not `vite.config.ts`) to mirror tsconfig @/* path without requiring Vite's full plugin suite.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all files created successfully on first attempt. TypeScript compiles with zero errors. All 21 tests pass. Build produces:
- `○` (static) for `/` and `/_not-found`
- `●` (SSG with generateStaticParams) for `/experiments/[slug]`, `/experiments/blockabye`, `/experiments/brickify`, `/experiments/sournal`
- Zero `λ` (dynamic) pages

## User Setup Required

None - no external service configuration required for Phase 1 Plan 02. Optional env vars for custom subdomain URLs:
- `NEXT_PUBLIC_BLOCKABYE_URL` (fallback: https://blockabye.jazlab.llc)
- `NEXT_PUBLIC_BRICKIFY_URL` (fallback: https://brickify.jazlab.llc)
- `NEXT_PUBLIC_SOURNAL_URL` (fallback: https://sournal.jazlab.llc)

## Next Phase Readiness

- `src/types/experiments.ts` and `src/lib/experiments.ts` are the canonical data layer for Phase 2 and Phase 3
- Phase 2 can import `{ experiments }` from `@/lib/experiments` to build experiment card components
- Phase 3 can use the [slug] route's experiment data for full marketing page content
- Full Phase 1 validation suite (21 tests) provides a regression safety net for downstream phases
- shadcn/ui CSS variables wired to JazLab brand — Phase 2 components automatically use correct colors

---
*Phase: 01-foundation*
*Completed: 2026-03-04*

## Self-Check: PASSED

- FOUND: jazlab-hub/src/types/experiments.ts
- FOUND: jazlab-hub/src/lib/experiments.ts
- FOUND: jazlab-hub/src/app/experiments/[slug]/page.tsx
- FOUND: jazlab-hub/vitest.config.ts
- FOUND: jazlab-hub/tests/experiments.test.ts
- FOUND: jazlab-hub/tests/brand-tokens.test.ts
- FOUND: jazlab-hub/tests/layout.test.ts
- FOUND: jazlab-hub/tests/noise-texture.test.ts
- FOUND commit: 0a203e8 (experiments types + data model + slug route)
- FOUND commit: 7562d07 (Vitest setup + test suite)
