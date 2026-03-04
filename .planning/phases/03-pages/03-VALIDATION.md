---
phase: 03
slug: pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 (already installed) |
| **Config file** | `jazlab-hub/vitest.config.ts` |
| **Quick run command** | `cd jazlab-hub && npm run test:run` |
| **Full suite command** | `cd jazlab-hub && npm run test:run` |
| **Estimated runtime** | ~5 seconds |

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
| 03-01-01 | 01 | 1 | BRAND-01, SHOW-01 | file-read | `npm run test:run -- tests/homepage.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SHOW-03 | file-read | `npm run test:run -- tests/particle-background.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | SHOW-04 | file-read | `npm run test:run -- tests/motion-wrapper.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | APP-01, APP-03 | file-read | `npm run test:run -- tests/experiment-page.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | APP-02 | file-read | `npm run test:run -- tests/waitlist-form.test.ts tests/waitlist-action.test.ts` | ❌ W0 | ⬜ pending |
| 03-xx-xx | all | all | SEO-03 | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jazlab-hub/tests/homepage.test.ts` — covers BRAND-01, SHOW-01, SEO-03
- [ ] `jazlab-hub/tests/particle-background.test.ts` — covers SHOW-03
- [ ] `jazlab-hub/tests/motion-wrapper.test.ts` — covers SHOW-04
- [ ] `jazlab-hub/tests/experiment-page.test.ts` — covers APP-01, APP-03
- [ ] `jazlab-hub/tests/waitlist-form.test.ts` — covers APP-02 (client)
- [ ] `jazlab-hub/tests/waitlist-action.test.ts` — covers APP-02 (server action)

*Existing test infrastructure covers all needs — no new framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cosmic particle animation runs smoothly | SHOW-03 | Canvas animation rendering | Open dev, verify particles animate, no jank |
| Scroll animations fire on viewport entry | SHOW-04 | Intersection Observer + motion | Scroll page, verify cards animate in |
| Hero loads within 3 seconds | BRAND-01 | Performance timing | Open dev tools, check LCP metric |
| Responsive layout across breakpoints | SEO-03 | Visual layout verification | Resize browser to mobile/tablet/desktop |
| Waitlist form shows success state | APP-02 | Server Action round-trip | Submit email, verify confirmation UI |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
