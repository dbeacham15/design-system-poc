---
phase: 02-ui-system
plan: 02
subsystem: ui
tags: [react, nextjs, tailwind, shadcn, server-components, vitest, css-grid, bento]

# Dependency graph
requires:
  - phase: 02-ui-system
    plan: 01
    provides: ExperimentBadge (status badge), shadcn Card primitive, SiteHeader, SiteFooter, experiments data array, cn() utility

provides:
  - ExperimentCard composite component (shadcn Card + ExperimentBadge + ArrowUpRight link)
  - BentoGrid component (CSS Grid 1/2/3 col responsive, auto-rows-[280px], first card featured)
  - Root layout wired with SiteHeader + SiteFooter appearing on every page
  - 18 new file-read tests covering ExperimentCard and BentoGrid structural assertions

affects: [03-page-assembly, 04-final-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Featured card uses md:col-span-1 lg:col-span-2 (not bare col-span-2) to prevent overflow at tablet 2-column grid"
    - "BentoGrid is data-driven — experiments.map() with index===0 check for featured card"
    - "Root layout flex flex-col min-h-screen + main flex-1 ensures footer sticks to bottom"
    - "File-read test toContain() preferred over regex for multi-line destructured imports"

key-files:
  created:
    - jazlab-hub/src/components/ExperimentCard.tsx
    - jazlab-hub/src/components/BentoGrid.tsx
    - jazlab-hub/tests/experiment-card.test.ts
    - jazlab-hub/tests/bento-grid.test.ts
  modified:
    - jazlab-hub/src/app/layout.tsx

key-decisions:
  - "Featured card uses md:col-span-1 lg:col-span-2 (Pitfall 3 fix) — prevents the featured card from filling the full row width on tablet 2-column grid"
  - "BentoGrid sets featured={index === 0} — BlockAbye (first experiment, beta status) gets visual prominence via 2-column span on desktop"
  - "layout.tsx body gets flex flex-col min-h-screen — SiteFooter sticks to bottom on short pages via main flex-1"

patterns-established:
  - "Pattern 5: Responsive bento col-span — md:col-span-1 lg:col-span-2 on featured card for responsive 2/3 column grids"
  - "Pattern 6: File-read test for multi-line imports — use toContain() separately for named export and module path, not a single-line regex"

requirements-completed: [SHOW-02, SHOW-05]

# Metrics
duration: 8min
completed: 2026-03-04
---

# Phase 02 Plan 02: UI System — Composite Components and Layout Integration Summary

**ExperimentCard (shadcn Card + ExperimentBadge + ArrowUpRight link) and BentoGrid (responsive 1/2/3-col CSS grid with featured first card) wired with SiteHeader/SiteFooter into root layout — 67/67 tests green, build fully static**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-04T01:40:26Z
- **Completed:** 2026-03-04T01:48:00Z
- **Tasks:** 2 (+ 1 checkpoint awaiting human verify)
- **Files modified:** 5 (2 new components + 2 new tests + 1 modified layout)

## Accomplishments

- Built ExperimentCard composing shadcn Card primitives, ExperimentBadge, and ArrowUpRight link to subdomain; featured cards use `md:col-span-1 lg:col-span-2` per Pitfall 3 fix
- Built BentoGrid with `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[280px] gap-4`, rendering all 3 experiments data-driven with BlockAbye as featured
- Updated root layout.tsx with SiteHeader + `<main className="flex-1">` + SiteFooter, body gets `flex flex-col min-h-screen`; full test suite 67/67 green; build fully static (no lambda pages)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ExperimentCard and BentoGrid composite components** - `819af54` (feat)
2. **Task 2: Wire SiteHeader and SiteFooter into root layout and verify build** - `74d733f` (feat)

**Plan metadata:** (committed with this SUMMARY.md)

## Files Created/Modified

- `jazlab-hub/src/components/ExperimentCard.tsx` - shadcn Card + ExperimentBadge + Link to subdomainUrl; featured prop drives md:col-span-1 lg:col-span-2
- `jazlab-hub/src/components/BentoGrid.tsx` - CSS Grid wrapper, experiments.map() with index===0 featured, auto-rows-[280px]
- `jazlab-hub/tests/experiment-card.test.ts` - 10 file-read assertions (name, description, status, subdomainUrl, imports, ArrowUpRight, hover accent, lg:col-span-2, no use client)
- `jazlab-hub/tests/bento-grid.test.ts` - 8 file-read assertions (grid-cols-1/2/3, auto-rows-, featured, imports, no use client)
- `jazlab-hub/src/app/layout.tsx` - Added SiteHeader/SiteFooter imports; body class + flex layout; main flex-1 wrapper

## Decisions Made

- Featured card uses `md:col-span-1 lg:col-span-2` rather than bare `col-span-2` — on a 2-column tablet grid, bare `col-span-2` fills the entire row which can look broken; `md:col-span-1` constrains it to one column at tablet width
- BlockAbye (`experiments[0]`) is the featured card — it has beta status (most production-ready) and benefits from extra visual prominence
- `flex flex-col min-h-screen` on body + `flex-1` on main — without this, a page with little content would float the footer in the middle of the screen

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test regex for multi-line import replaced with toContain() checks**
- **Found during:** Task 1 (experiment-card test run)
- **Issue:** Test used `/import.*Card.*from.*@\/components\/ui\/card/` regex, but the import in ExperimentCard.tsx is a multi-line destructured import. `.` in regex doesn't cross newlines, causing the test to fail even though the import exists.
- **Fix:** Replaced the single regex with two `toContain()` checks: `expect(source).toContain("Card")` and `expect(source).toContain("@/components/ui/card")` — each confirms the presence of distinct parts of the import
- **Files modified:** `jazlab-hub/tests/experiment-card.test.ts`
- **Verification:** experiment-card.test.ts 10/10 tests pass
- **Committed in:** `819af54` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: test regex didn't handle multi-line destructured imports)
**Impact on plan:** Minor test correction required for test correctness. Pattern established: prefer `toContain()` over single-line regex when component imports may be multi-line formatted.

## Issues Encountered

None beyond the auto-fixed regex deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 Phase 2 shared UI components ready: GradientHeading, ExperimentBadge, ExperimentCard, BentoGrid, SiteHeader, SiteFooter
- Root layout wired — header and footer appear on every page automatically
- 67/67 tests green; build fully static
- Visual verification of complete Phase 2 UI in browser is the pending checkpoint (Task 3)
- Phase 3 (page assembly) can consume ExperimentCard, BentoGrid, and GradientHeading directly from @/components

---
*Phase: 02-ui-system*
*Completed: 2026-03-04*
