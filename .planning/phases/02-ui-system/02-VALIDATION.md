---
phase: 02
slug: ui-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 (already installed and configured) |
| **Config file** | `jazlab-hub/vitest.config.ts` |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run` + `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | BRAND-06 | unit | `npm run test:run -- tests/gradient-heading.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | BRAND-05 | unit | `npm run test:run -- tests/experiment-badge.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | BRAND-02 | unit | `npm run test:run -- tests/site-header.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | BRAND-03 | unit | `npm run test:run -- tests/site-footer.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | SHOW-02 | unit | `npm run test:run -- tests/experiment-card.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | SHOW-05 | unit | `npm run test:run -- tests/bento-grid.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jazlab-hub/tests/gradient-heading.test.ts` — stubs for BRAND-06
- [ ] `jazlab-hub/tests/experiment-badge.test.ts` — stubs for BRAND-05
- [ ] `jazlab-hub/tests/experiment-card.test.ts` — stubs for SHOW-02
- [ ] `jazlab-hub/tests/bento-grid.test.ts` — stubs for SHOW-05
- [ ] `jazlab-hub/tests/site-header.test.ts` — stubs for BRAND-02
- [ ] `jazlab-hub/tests/site-footer.test.ts` — stubs for BRAND-03
- [ ] `jazlab-hub/src/components/ui/badge.tsx` — `npx shadcn@latest add badge`
- [ ] `jazlab-hub/src/components/ui/card.tsx` — `npx shadcn@latest add card`

*Framework, config, and aliases already set up from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sticky header persists on scroll | BRAND-02 | Requires scroll interaction | Open dev, scroll page, verify header stays fixed |
| Gradient text visually renders violet-to-teal | BRAND-06 | CSS gradient rendering | Open dev, inspect heading, verify gradient colors |
| Bento grid layout is visually balanced | SHOW-05 | Layout aesthetics | Open dev at lg breakpoint, verify card sizes vary |
| Noise texture visible behind components | BRAND-07 | Visual overlay check | Open dev, verify grain texture shows through |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
