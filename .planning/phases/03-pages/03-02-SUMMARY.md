---
phase: 03-pages
plan: 02
subsystem: ui
tags: [react, nextjs, tailwind, lucide-react, resend, server-actions, useActionState, vitest, server-components, email-capture]

# Dependency graph
requires:
  - phase: 03-pages
    plan: 01
    provides: MotionWrapper client component, GradientHeading, ExperimentBadge, AnimatedBentoGrid, ParticleBackground, homepage
  - phase: 02-ui-system
    plan: 02
    provides: ExperimentCard, BentoGrid, GradientHeading, SiteHeader, SiteFooter, root layout

provides:
  - waitlist Server Action (src/actions/waitlist.ts) with Resend SDK, email validation, typed WaitlistState
  - WaitlistForm client component (src/components/WaitlistForm.tsx) with useActionState, pending/success/error UI
  - Full experiment marketing page (src/app/experiments/[slug]/page.tsx) with hero, features, waitlist form
  - Per-app accent color system via ACCENT_CLASSES map (blockabye/brickify/sournal)
  - ICON_MAP mapping feature.icon strings to lucide-react components
  - generateMetadata export for per-page SEO
  - 34 new file-read tests (11 action + 10 form + 13 experiment-page)

affects: [04-final-polish]

# Tech tracking
tech-stack:
  added: [resend@6.9.3 (npm package, transactional email SDK)]
  patterns:
    - "React 19 useActionState pattern: const [state, formAction, isPending] = useActionState(action, initialState)"
    - "Server Action signature: async function joinWaitlist(prevState: WaitlistState, formData: FormData)"
    - "ACCENT_CLASSES Record maps slug -> {border, text, bg} Tailwind token classes for per-app visual identity"
    - "ICON_MAP Record maps feature.icon string -> lucide-react ComponentType for feature grid icons"
    - "WaitlistForm conditional render: success state shows checkmark message, else shows form with error below"
    - "Experiment page Server Component (no use client) — WaitlistForm and MotionWrapper are client boundaries"

key-files:
  created:
    - jazlab-hub/src/actions/waitlist.ts
    - jazlab-hub/src/components/WaitlistForm.tsx
    - jazlab-hub/tests/waitlist-action.test.ts
    - jazlab-hub/tests/waitlist-form.test.ts
    - jazlab-hub/tests/experiment-page.test.ts
  modified:
    - jazlab-hub/src/app/experiments/[slug]/page.tsx
    - jazlab-hub/package.json

key-decisions:
  - "resend@6.9.3 installed as production dependency — email-as-a-service API matching plan spec, free tier sufficient for waitlist volume"
  - "useActionState (not useFormState) — React 19 canonical API, deprecated form avoided per plan critical note"
  - "onboarding@resend.dev as from address — Resend's verified testing domain safe for all environments without custom domain setup"
  - "WAITLIST_RECIPIENT_EMAIL env var with daniel@jazlab.llc fallback — allows runtime override without code changes"
  - "ACCENT_CLASSES map (not inline style accentColor) — uses Tailwind token utilities from globals.css @theme, consistent with Phase 2 architecture"
  - "Experiment page stays Server Component — WaitlistForm and MotionWrapper are the use client boundaries, no client promotion needed"

patterns-established:
  - "Pattern 10: React 19 Server Action with form — use server + typed state + useActionState, formData carries all fields"
  - "Pattern 11: Per-entity accent system — ACCENT_CLASSES Record maps slug to {border, text, bg} Tailwind token classes"
  - "Pattern 12: Icon string-to-component mapping — ICON_MAP Record<string, ComponentType> for data-driven icon rendering"

requirements-completed: [APP-01, APP-02, APP-03, SEO-03]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 03 Plan 02: Experiment Marketing Pages with Waitlist Email Capture Summary

**Three experiment marketing pages (blockabye/brickify/sournal) with per-app accent colors, hero section, feature grid, Resend-backed waitlist Server Action, and WaitlistForm using React 19 useActionState — 132/132 tests green, build fully static**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-04T02:24:01Z
- **Completed:** 2026-03-04T02:26:16Z
- **Tasks:** 2 auto (both TDD) + 1 checkpoint:human-verify (awaiting)
- **Files modified:** 7 (2 new components + 3 new test files + 1 modified page + 1 package.json)

## Accomplishments

- Built waitlist Server Action (src/actions/waitlist.ts): "use server", Resend SDK integration, email validation with "@" check, typed WaitlistState return, onboarding@resend.dev from address, WAITLIST_RECIPIENT_EMAIL env var with daniel@jazlab.llc fallback
- Built WaitlistForm client component (src/components/WaitlistForm.tsx): "use client", React 19 useActionState, hidden app input for slug identification, pending/success/error states, submit button with "Joining..." text while pending
- Replaced placeholder [slug]/page.tsx with full marketing page: hero section with ACCENT_CLASSES[slug].border top border, GradientHeading + ExperimentBadge + CTA link to subdomainUrl, responsive 3-column feature grid with MotionWrapper stagger, waitlist section with WaitlistForm, "Back to all experiments" bottom link
- ICON_MAP maps 9 feature icon strings to lucide-react components (Book, Palette, Clock, Image, CheckCircle, List, Edit, Lock, Network)
- generateMetadata export for per-page SEO (title: "{name} — JazLab Experiment", description)
- 34 new tests added (11 action + 10 form + 13 experiment-page); full suite 132/132 green; npm run build exits 0 with all 3 experiment pages as SSG (●)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create waitlist Server Action and WaitlistForm client component** - `d3b441e` (feat)
2. **Task 2: Build experiment marketing pages with hero, features, and waitlist** - `07a27ee` (feat)

**Plan metadata:** (to be committed)

_Note: Both tasks followed TDD: RED (failing tests) → GREEN (implementation) pattern. Task 3 is checkpoint:human-verify awaiting user visual approval._

## Files Created/Modified

- `jazlab-hub/src/actions/waitlist.ts` - "use server" Server Action; Resend SDK, email validation, typed WaitlistState, onboarding@resend.dev sender
- `jazlab-hub/src/components/WaitlistForm.tsx` - "use client" form component; useActionState, hidden app field, pending/success/error UI, disabled states
- `jazlab-hub/src/app/experiments/[slug]/page.tsx` - Full marketing page; ACCENT_CLASSES + ICON_MAP, hero/features/waitlist/CTA sections, generateMetadata, Server Component
- `jazlab-hub/tests/waitlist-action.test.ts` - 11 file-read assertions on Server Action structure, env vars, Resend usage
- `jazlab-hub/tests/waitlist-form.test.ts` - 10 file-read assertions on client form structure, useActionState, state handling
- `jazlab-hub/tests/experiment-page.test.ts` - 13 file-read assertions on imports, features, accent colors, responsiveness, no use client
- `jazlab-hub/package.json` - Added resend@6.9.3 dependency

## Decisions Made

- resend@6.9.3 as transactional email provider — free tier, excellent DX, plan specified it explicitly
- useActionState from "react" (not useFormState from "react-dom") — React 19 canonical API, useFormState is deprecated
- onboarding@resend.dev from address — Resend's verified testing domain works without custom domain verification setup
- ACCENT_CLASSES map for per-app theming — uses Tailwind token classes (text-blockabye, border-brickify, etc.) from globals.css @theme, consistent with existing architecture
- Experiment page remains a pure Server Component — WaitlistForm ("use client") and MotionWrapper ("use client") handle all client interactivity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — resend installed cleanly, all tests passed on first GREEN run, build succeeded with all pages fully static.

## User Setup Required

**External services require manual configuration.** See plan frontmatter user_setup for:

1. Create free Resend account at resend.com/signup
2. Generate API key at Resend Dashboard -> API Keys
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxx
   WAITLIST_RECIPIENT_EMAIL=your@email.com  # optional, defaults to daniel@jazlab.llc
   ```
4. Optionally verify jazlab.llc domain at Resend Dashboard -> Domains for custom "from" address

## Next Phase Readiness

- All Phase 3 Plan 02 components ready: WaitlistForm, waitlist Server Action, experiment marketing pages
- Task 3 (visual checkpoint) pending user verification across all 3 experiment pages and homepage
- 132/132 tests green; build fully static (homepage ○, experiments ●)
- Phase 4 (final polish) can build on: established accent color system, WaitlistForm, full marketing pages
- Remaining open items: domain name (NEXT_PUBLIC_SITE_URL), OG image design (Phase 4)

---
*Phase: 03-pages*
*Completed: 2026-03-04*

## Self-Check: PASSED

- FOUND: jazlab-hub/src/actions/waitlist.ts
- FOUND: jazlab-hub/src/components/WaitlistForm.tsx
- FOUND: jazlab-hub/src/app/experiments/[slug]/page.tsx
- FOUND: jazlab-hub/tests/waitlist-action.test.ts
- FOUND: jazlab-hub/tests/waitlist-form.test.ts
- FOUND: jazlab-hub/tests/experiment-page.test.ts
- FOUND: .planning/phases/03-pages/03-02-SUMMARY.md
- COMMIT d3b441e: feat(03-pages-02): add waitlist Server Action and WaitlistForm client component
- COMMIT 07a27ee: feat(03-pages-02): build experiment marketing pages with hero, features, and waitlist
