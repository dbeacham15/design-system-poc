---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 03-pages-01-PLAN.md
last_updated: "2026-03-04T02:22:47.821Z"
last_activity: 2026-03-03 — Roadmap created, requirements mapped to 4 phases
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 6
  completed_plans: 5
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Visitors instantly understand what JazLab is and can explore, learn about, and access any experiment from one compelling hub.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-03-03 — Roadmap created, requirements mapped to 4 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P01 | 4 | 2 tasks | 9 files |
| Phase 01-foundation P02 | 2 | 2 tasks | 9 files |
| Phase 02-ui-system P01 | 3 | 2 tasks | 10 files |
| Phase 02-ui-system P02 | 8min | 2 tasks | 5 files |
| Phase 02-ui-system P02 | 8 | 3 tasks | 7 files |
| Phase 03-pages P01 | 2min | 2 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Stack confirmed — Next.js 16 + Tailwind v4 + shadcn/ui 3.x + Motion 11.x
- [Init]: Static-first architecture — all marketing pages must render as `○` (static) in `next build`
- [Init]: Single dynamic route `app/experiments/[slug]/page.tsx` for all 3 app pages (data-driven, not hand-crafted)
- [Init]: Domain not yet decided — use `NEXT_PUBLIC_SITE_URL` env var as placeholder in `metadataBase`
- [Init]: Email service for waitlist not yet selected — evaluate Resend vs. Loops vs. Mailchimp in Phase 3
- [Phase 01-foundation]: Hardcoded class=dark on html (no next-themes) — dark-only site, prevents FOUC
- [Phase 01-foundation]: body background-color as raw CSS rule (not utility) — prevents white flash on dark bg
- [Phase 01-foundation]: Tailwind @theme for brand tokens + @theme inline for shadcn bridge — correct v4 pattern
- [Phase 01-foundation]: Experiments data stored as a plain typed constant array (not fetched) — zero dynamic APIs keeps all routes static
- [Phase 01-foundation]: Tests read CSS/TSX files as strings (not DOM tests) — structural validation automated, visual correctness verified manually
- [Phase 01-foundation]: Vitest path alias (@/*) configured to match tsconfig — enables direct @/lib/experiments imports in test files
- [Phase 02-ui-system]: SiteHeader as pure Server Component — use client deferred to Phase 3 as thin ActiveLink leaf
- [Phase 02-ui-system]: STATUS_CONFIG Record in ExperimentBadge is single source of truth for experiment status terminology
- [Phase 02-ui-system]: File-read tests validate full source string including comments — avoid anti-pattern strings in comments
- [Phase 02-ui-system]: Featured card uses md:col-span-1 lg:col-span-2 (Pitfall 3 fix) — prevents overflow on tablet 2-column grid
- [Phase 02-ui-system]: BentoGrid sets featured={index===0} — BlockAbye (first experiment, beta) gets visual prominence as featured card
- [Phase 02-ui-system]: layout.tsx body gets flex flex-col min-h-screen + main flex-1 — SiteFooter sticks to bottom on short pages
- [Phase 02-ui-system]: Featured card uses md:col-span-1 lg:col-span-2 (Pitfall 3 fix) — prevents overflow on tablet 2-column grid
- [Phase 02-ui-system]: BentoGrid sets featured={index===0} — BlockAbye (first experiment, beta) gets visual prominence as featured card
- [Phase 02-ui-system]: layout.tsx body gets flex flex-col min-h-screen + main flex-1 — SiteFooter sticks to bottom on short pages
- [Phase 02-ui-system]: JazLab SVG logo integrated into SiteHeader replacing text wordmark — visual identity upgrade, static asset, zero test impact
- [Phase 03-pages]: motion package (motion/react import) installed at 12.34.5 — canonical install per research, backward-compatible with React 19
- [Phase 03-pages]: Canvas z-index applied via inline style prop (not Tailwind className) — correctly layers ParticleBackground below body > * z-index: 1 rule
- [Phase 03-pages]: MotionWrapper extends HTMLMotionProps<'div'> with ...motionProps spread — Server Component pages can use motion.div capabilities without use client
- [Phase 03-pages]: AnimatedBentoGrid stagger delay index * 0.12s with viewport once: true — prevents re-animation on scroll-up

### Pending Todos

None yet.

### Blockers/Concerns

- Domain name not finalized — subdomain URLs in `lib/experiments.ts` and `metadataBase` need `NEXT_PUBLIC_SITE_URL` placeholder until domain is confirmed
- Email service not selected — decision needed before Phase 3 waitlist implementation
- OG image visual design not specified — template design needed before Phase 4

## Session Continuity

Last session: 2026-03-04T02:22:47.819Z
Stopped at: Completed 03-pages-01-PLAN.md
Resume file: None
