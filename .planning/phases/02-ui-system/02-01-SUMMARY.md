---
phase: 02-ui-system
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, shadcn, server-components, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Brand tokens in globals.css @theme (violet, teal, surface, text-*), experiments data array, utils cn() function, Vitest file-read test pattern

provides:
  - shadcn Badge primitive at src/components/ui/badge.tsx
  - shadcn Card primitive at src/components/ui/card.tsx
  - GradientHeading component with Tailwind v4 bg-linear-to-r violet-to-teal gradient
  - ExperimentBadge component mapping all 3 ExperimentStatus values to labeled, color-coded badges (single source of truth for BRAND-05 terminology)
  - SiteHeader sticky navigation with z-50 glass effect, JazLab logo, Experiments link, all 3 experiment subdomain links
  - SiteFooter 3-column layout with brand info, experiment links, GitHub social, contact email
  - 4 Vitest file-read test files covering all 6 components

affects: [02-02, 02-03, 03-page-assembly]

# Tech tracking
tech-stack:
  added: [shadcn Badge, shadcn Card]
  patterns: [Server Component preference for UI (no use client in leaf components), STATUS_CONFIG Record pattern for status-to-label mapping, file-read Vitest tests for structural validation]

key-files:
  created:
    - jazlab-hub/src/components/ui/badge.tsx
    - jazlab-hub/src/components/ui/card.tsx
    - jazlab-hub/src/components/GradientHeading.tsx
    - jazlab-hub/src/components/ExperimentBadge.tsx
    - jazlab-hub/src/components/SiteHeader.tsx
    - jazlab-hub/src/components/SiteFooter.tsx
    - jazlab-hub/tests/gradient-heading.test.ts
    - jazlab-hub/tests/experiment-badge.test.ts
    - jazlab-hub/tests/site-header.test.ts
    - jazlab-hub/tests/site-footer.test.ts
  modified: []

key-decisions:
  - "SiteHeader built as pure Server Component (no use client) — active link highlighting deferred to Phase 3 as a thin ActiveLink client leaf"
  - "STATUS_CONFIG Record in ExperimentBadge is the single source of truth for experiment status terminology (active->Active, beta->Beta, coming-soon->Coming Soon)"
  - "Comments mentioning v3 class names (bg-gradient-to-r) or directives (use client) removed from component files to avoid false test failures in file-read tests"

patterns-established:
  - "Pattern 1: Tailwind v4 gradient text — bg-linear-to-r from-violet to-teal bg-clip-text text-transparent inline-block"
  - "Pattern 2: ExperimentStatus-to-badge mapping via STATUS_CONFIG Record with label and className fields"
  - "Pattern 3: Sticky header — sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border"
  - "Pattern 4: File-read tests avoid anti-pattern strings in comments (test checks source string, comments are part of source)"

requirements-completed: [BRAND-02, BRAND-03, BRAND-05, BRAND-06]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 02 Plan 01: UI System — Leaf Components Summary

**Six shared UI components (4 custom + 2 shadcn) delivering gradient headings, color-coded status badges, sticky glass nav header, and 3-column footer, all as pure Server Components with 49/49 tests green**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T01:35:15Z
- **Completed:** 2026-03-04T01:38:00Z
- **Tasks:** 2
- **Files modified:** 10 (6 components + 4 tests)

## Accomplishments

- Installed shadcn Badge and Card primitives; created GradientHeading with Tailwind v4 bg-linear-to-r syntax and ExperimentBadge with STATUS_CONFIG mapping all 3 statuses
- Created SiteHeader (sticky z-50 nav with glass blur effect, experiment links) and SiteFooter (3-column: brand / experiments / contact with GitHub + email)
- All 4 new test files pass; full suite 49/49 green; npm run build still all static (no lambda pages)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn primitives and build GradientHeading + ExperimentBadge** - `91a4bbb` (feat)
2. **Task 2: Build SiteHeader and SiteFooter with lab terminology** - `555960b` (feat)

**Plan metadata:** (to be committed with SUMMARY.md)

## Files Created/Modified

- `jazlab-hub/src/components/ui/badge.tsx` - shadcn Badge primitive (CVA variants, outline variant used by ExperimentBadge)
- `jazlab-hub/src/components/ui/card.tsx` - shadcn Card primitive (CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction)
- `jazlab-hub/src/components/GradientHeading.tsx` - Reusable h1-h4 heading with violet-to-teal gradient via bg-linear-to-r (Tailwind v4 syntax)
- `jazlab-hub/src/components/ExperimentBadge.tsx` - Status badge with STATUS_CONFIG Record mapping ExperimentStatus to label + color classes
- `jazlab-hub/src/components/SiteHeader.tsx` - Sticky navigation (sticky top-0 z-50 backdrop-blur-md), data-driven experiment links, pure Server Component
- `jazlab-hub/src/components/SiteFooter.tsx` - 3-column grid footer with brand tagline, experiments.map() links, GitHub + mailto contact
- `jazlab-hub/tests/gradient-heading.test.ts` - 5 file-read assertions (gradient syntax, brand tokens, bg-clip-text, inline-block, font-display)
- `jazlab-hub/tests/experiment-badge.test.ts` - 6 file-read assertions (status labels, status keys, color classes, badge import, type import)
- `jazlab-hub/tests/site-header.test.ts` - 9 file-read assertions (sticky, z-50, backdrop-blur, href, experiments link, experiments import, target blank, responsive, no use client)
- `jazlab-hub/tests/site-footer.test.ts` - 8 file-read assertions (border-t, experiments import, GitHub URL, email, section header, getFullYear, Github icon, no use client)

## Decisions Made

- SiteHeader built as pure Server Component — `usePathname()` for active link highlighting deferred to Phase 3 as a thin `ActiveLink` client leaf, avoiding `"use client"` spreading up the tree
- STATUS_CONFIG Record in ExperimentBadge is the single source of truth for experiment status terminology — changing labels requires only updating this one map
- Tailwind v4 requires `bg-linear-to-r` (not `bg-gradient-to-r`) — file-read test validates this and guards against accidental regression

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed v3 class name from GradientHeading comment**
- **Found during:** Task 1 (gradient-heading test run)
- **Issue:** Comment in GradientHeading.tsx contained `bg-gradient-to-r` (explaining the v3->v4 rename), which caused the `expect(source).not.toContain("bg-gradient-to-r")` test to fail
- **Fix:** Replaced comment text to explain the rename without including the v3 class name string
- **Files modified:** `jazlab-hub/src/components/GradientHeading.tsx`
- **Verification:** gradient-heading.test.ts 5/5 tests pass
- **Committed in:** `91a4bbb` (Task 1 commit)

**2. [Rule 1 - Bug] Removed use client string from SiteHeader comment**
- **Found during:** Task 2 (site-header test run)
- **Issue:** Comment in SiteHeader.tsx mentioned `"use client"` boundary in parenthetical, causing the `expect(source).not.toContain('"use client"')` test to fail
- **Fix:** Rewrote comment to say "client boundary cost" instead of referencing the directive string
- **Files modified:** `jazlab-hub/src/components/SiteHeader.tsx`
- **Verification:** site-header.test.ts 9/9 tests pass
- **Committed in:** `555960b` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug: file-read tests validate source code including comments)
**Impact on plan:** Both fixes required for test correctness — the file-read test pattern treats the entire file as a string, so comments containing forbidden strings cause false failures. Pattern established: avoid including anti-pattern class names or directive strings in component comments.

## Issues Encountered

None beyond the auto-fixed comment deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 leaf-level shared UI components ready for consumption by Phase 02-02 (ExperimentCard + BentoGrid)
- shadcn Badge and Card primitives available at `@/components/ui/badge` and `@/components/ui/card`
- GradientHeading and ExperimentBadge can be imported into any downstream component immediately
- SiteHeader and SiteFooter ready to be wired into `app/layout.tsx` in Phase 03
- Full test suite 49/49 green; build static

---
*Phase: 02-ui-system*
*Completed: 2026-03-04*
