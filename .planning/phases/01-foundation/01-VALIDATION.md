---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-03
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (pattern from sibling project blockabye) |
| **Config file** | `vitest.config.ts` — Wave 0 gap (does not exist yet) |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (confirms static output)
- **After every plan wave:** Run `npm run test:run` (full unit suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds (unit tests only — see Latency Exceptions below)

---

## Latency Exceptions

The 10-second max feedback latency applies to **unit tests** (`npm run test:run`). The following verification commands are known to exceed 10 seconds and are documented exceptions:

| Command | Typical Duration | Used In | Justification |
|---------|-----------------|---------|---------------|
| `npm run dev` + `curl` smoke check | ~10-15s (includes server startup `sleep 8`) | 01-01 Task 1 `<verify>` | One-time scaffold verification; dev server cold start requires wait. No faster equivalent for confirming the app serves HTTP 200 after initial `create-next-app`. |
| `npm run build` | ~20-40s | 01-01 Task 2 `<verify>`, 01-02 Task 2 step 9 | Confirms static rendering output (`○` vs `λ`). No faster equivalent exists — `next build` is the only way to verify `generateStaticParams` produces static pages. Used as a build-level gate, not a per-commit feedback loop. |

These exceptions do **not** compromise Nyquist compliance because:
1. They are not part of the iterative red-green-refactor feedback loop
2. Unit tests (`npm run test:run`) remain under the 10s threshold
3. Build and smoke checks run once per task completion, not during development iteration

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | BRAND-04 | unit | `npm run test:run -- tests/brand-tokens.test.ts` | W0 | pending |
| 01-01-02 | 01 | 1 | BRAND-04 | unit | `npm run test:run -- tests/layout.test.ts` | W0 | pending |
| 01-01-03 | 01 | 1 | BRAND-07 | unit | `npm run test:run -- tests/noise-texture.test.ts` | W0 | pending |
| 01-01-04 | 01 | 1 | Phase SC-1 | smoke | `npm run build 2>&1 \| grep -E "○\|λ"` | manual | pending |
| 01-01-05 | 01 | 1 | Phase SC-4 | unit | `npm run test:run -- tests/experiments.test.ts` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration (greenfield project)
- [ ] `tests/brand-tokens.test.ts` — covers BRAND-04 CSS variable presence
- [ ] `tests/layout.test.ts` — covers BRAND-04 typography font variables in root layout
- [ ] `tests/noise-texture.test.ts` — covers BRAND-07 CSS rule validation
- [ ] `tests/experiments.test.ts` — covers BRAND-04 data model + Phase SC-4
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react` — if not included by create-next-app

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark background renders at #0F1117 with zero white flash | Phase SC-1 | Visual verification in browser | Run `npm run dev`, open browser, confirm dark bg immediate render |
| Color palette renders correctly in browser | BRAND-04 | Visual rendering verification | Inspect elements with brand tokens, confirm correct hex values |
| Noise/grain texture provides tactile depth | BRAND-07 | Visual texture perception | View dark background, confirm subtle grain visible at body level |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s (unit tests); build/smoke exceptions documented
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
