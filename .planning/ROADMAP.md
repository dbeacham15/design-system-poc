# Roadmap: JazLab

## Overview

JazLab is built in four phases that follow a strict dependency chain: scaffold the project and brand tokens first, assemble shared UI components second, build the actual pages third, and add SEO metadata and launch verification last. This order prevents rework — brand tokens must exist before components, components must exist before pages, and pages must be stable before SEO files can reference their URLs.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Next.js 16 project scaffolded with Tailwind v4 brand tokens, dark theme wired, experiments data model defined (completed 2026-03-04)
- [x] **Phase 2: UI System** - Shared component library built (nav, footer, cards, badges, gradient text, bento grid) (completed 2026-03-04)
- [ ] **Phase 3: Pages** - Homepage and all 3 app marketing pages assembled with animations and waitlist forms
- [ ] **Phase 4: SEO & Launch** - SEO metadata, Open Graph tags, structured data, and pre-launch verification complete

## Phase Details

### Phase 1: Foundation
**Goal**: The project runs locally with the JazLab brand system in place and every downstream phase can build on it without revisiting setup
**Depends on**: Nothing (first phase)
**Requirements**: BRAND-04, BRAND-07
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the app and renders a dark background (#0F1117) with zero white flash on load
  2. The JazLab color palette (violet, teal, cyan, sparkle, dark foundation) is available as Tailwind CSS custom properties and renders correctly in a browser
  3. Dark backgrounds display a subtle noise/grain texture providing tactile depth
  4. `lib/experiments.ts` exports a typed array with all 3 experiments (BlockAbye, Brickify, Sournal) including slugs, status, subdomain URLs, and feature lists
  5. `npm run build` completes without errors and all marketing pages render as static (`○`) not dynamic (`λ`)
**Plans:** 2/2 plans complete
Plans:
- [ ] 01-01-PLAN.md — Scaffold Next.js 16 project and wire JazLab brand system (tokens, typography, noise, shadcn bridge)
- [ ] 01-02-PLAN.md — Experiments data model, [slug] route, Vitest test suite, build verification

### Phase 2: UI System
**Goal**: Every reusable UI component exists, enforces the brand system, and is validated in isolation before any page is assembled
**Depends on**: Phase 1
**Requirements**: BRAND-02, BRAND-03, BRAND-05, BRAND-06, SHOW-02, SHOW-05
**Success Criteria** (what must be TRUE):
  1. A sticky navigation header persists across scroll on all pages, linking to the hub and all 3 app pages, using lab-flavored terminology ("experiments," "lab")
  2. A consistent footer appears on every page with app links, social links, and contact info
  3. Experiment cards display title, description, a status badge (Active / Beta / Coming Soon), and a link to the app subdomain
  4. Key headings render with the violet-to-teal gradient text treatment as a signature visual element
  5. The experiment grid uses a bento-style layout with variable card sizes (not a uniform grid)
**Plans:** 2/2 plans complete
Plans:
- [ ] 02-01-PLAN.md — Install shadcn primitives, build leaf components (GradientHeading, ExperimentBadge, SiteHeader, SiteFooter) with tests
- [ ] 02-02-PLAN.md — Build composite components (ExperimentCard, BentoGrid), wire layout, visual verification

### Phase 3: Pages
**Goal**: Visitors can land on the JazLab homepage, understand what the lab is, explore all three experiment cards, and navigate to a dedicated marketing page for any app
**Depends on**: Phase 2
**Requirements**: BRAND-01, SHOW-01, SHOW-03, SHOW-04, APP-01, APP-02, APP-03, SEO-03
**Success Criteria** (what must be TRUE):
  1. The homepage hero section shows the JazLab logo, value proposition headline, and primary CTA within 3 seconds of landing
  2. The homepage displays an animated cosmic/space particle background with floating effects matching the reference mockup
  3. Experiment cards and page sections animate into view as the user scrolls, using GPU-composited transforms
  4. Each of the 3 apps has a dedicated marketing page with a hero section, feature highlights, distinct visual treatment, and a CTA
  5. Each app marketing page includes a working waitlist/email capture form that accepts a submission and shows a success state
  6. All pages render correctly across desktop, tablet, and mobile breakpoints with no layout breakage
**Plans**: TBD

### Phase 4: SEO & Launch
**Goal**: Every page is discoverable by search engines, generates correct social sharing previews, and passes a pre-launch checklist before the site goes live
**Depends on**: Phase 3
**Requirements**: SEO-01, SEO-02, SEO-04
**Success Criteria** (what must be TRUE):
  1. Every page has a unique title and meta description tag optimized for its content
  2. Pasting any page URL into the LinkedIn Post Inspector (or equivalent) generates a correct title, description, and preview image
  3. Each app marketing page includes Schema.org SoftwareApplication structured data validated by Google's Rich Results Test
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-04 |
| 2. UI System | 2/2 | Complete   | 2026-03-04 |
| 3. Pages | 0/TBD | Not started | - |
| 4. SEO & Launch | 0/TBD | Not started | - |
