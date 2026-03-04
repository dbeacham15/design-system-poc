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
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | BRAND-04 | unit | `npm run test:run -- tests/brand-tokens.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | BRAND-04 | unit | `npm run test:run -- tests/layout.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | BRAND-07 | unit | `npm run test:run -- tests/noise-texture.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | Phase SC-1 | smoke | `npm run build 2>&1 \| grep -E "○\|λ"` | ❌ manual | ⬜ pending |
| 01-01-05 | 01 | 1 | Phase SC-4 | unit | `npm run test:run -- tests/experiments.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration (greenfield project)
- [ ] `tests/brand-tokens.test.ts` — covers BRAND-04 CSS variable presence
- [ ] `tests/layout.test.ts` — covers BRAND-04 typography in root layout
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
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
