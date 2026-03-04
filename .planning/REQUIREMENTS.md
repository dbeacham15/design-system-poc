# Requirements: JazLab

**Defined:** 2026-03-03
**Core Value:** Visitors instantly understand what JazLab is and can explore, learn about, and access any experiment from one compelling hub.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Brand & Layout

- [x] **BRAND-01**: User sees a hero section with JazLab logo, value proposition headline, and primary CTA within 3 seconds of landing
- [x] **BRAND-02**: User can navigate between hub and all app pages via a sticky header that persists across scroll
- [x] **BRAND-03**: User finds app links, social links, and contact info in a consistent footer on every page
- [x] **BRAND-04**: All pages consistently use the JazLab brand system (violet/teal palette, dark foundation, Inter typography)
- [x] **BRAND-05**: Lab/experiment terminology is used throughout ("experiments," "running," "active") reinforcing the lab identity
- [x] **BRAND-06**: Key headings use gradient text treatment (violet-to-teal) as a signature visual element
- [x] **BRAND-07**: Dark backgrounds include subtle noise/grain texture for tactile depth

### Experiment Showcase

- [x] **SHOW-01**: User sees an experiment grid on the homepage with cards for all 3 apps (BlockAbye, Brickify, Sournal)
- [x] **SHOW-02**: Each experiment card displays title, description, status badge (Active/Beta/Coming Soon), and link to app
- [x] **SHOW-03**: Homepage has an animated cosmic/space particle background with floating effects matching the reference image
- [x] **SHOW-04**: Experiment cards and page sections animate in with scroll-triggered reveal effects
- [x] **SHOW-05**: Experiment grid uses a bento-style layout with variable card sizes

### App Marketing Pages

- [ ] **APP-01**: Each of the 3 apps has a dedicated marketing page with hero section, feature highlights, and CTA
- [ ] **APP-02**: Each app marketing page includes a waitlist/email capture form for early access signup
- [ ] **APP-03**: Each app marketing page has a distinct visual identity (custom illustration or accent treatment)

### SEO & Performance

- [ ] **SEO-01**: Every page has unique title and description meta tags optimized for search
- [ ] **SEO-02**: Every page has Open Graph tags generating correct social sharing previews
- [x] **SEO-03**: All pages are fully responsive across desktop, tablet, and mobile breakpoints
- [ ] **SEO-04**: App pages include Schema.org SoftwareApplication structured data for rich search results

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Engagement

- **ENG-01**: App marketing pages include inline demo preview or short video
- **ENG-02**: Waitlist forms display signup count as social proof
- **ENG-03**: "Labs" experiment log page showing experiment history and learnings

### Content

- **CONT-01**: Blog or updates section for announcing new experiments and sharing progress

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication on shell site | JazLab is a marketing hub, not an app; auth adds complexity with no user value |
| Pricing pages | All 3 apps are experimental/pre-launch; pricing sets false expectations |
| Embedded microfrontend runtime (Module Federation) | JazLab links to subdomains; embedding adds deployment coupling and complexity |
| Dark/light mode toggle | JazLab's brand identity is dark-only; two visual systems would dilute the aesthetic |
| Real-time visitor counter | Requires backend/WebSockets for a static marketing site; low ROI |
| Contact form with backend | Maintenance burden for spam filtering; mailto link is sufficient initially |
| Infinite scroll / pagination | 3 apps don't need it; revisit at 8+ experiments |
| Mobile native app | Web-first; no native app needed for a marketing hub |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 3 | Complete |
| BRAND-02 | Phase 2 | Complete |
| BRAND-03 | Phase 2 | Complete |
| BRAND-04 | Phase 1 | Complete |
| BRAND-05 | Phase 2 | Complete |
| BRAND-06 | Phase 2 | Complete |
| BRAND-07 | Phase 1 | Complete |
| SHOW-01 | Phase 3 | Complete |
| SHOW-02 | Phase 2 | Complete |
| SHOW-03 | Phase 3 | Complete |
| SHOW-04 | Phase 3 | Complete |
| SHOW-05 | Phase 2 | Complete |
| APP-01 | Phase 3 | Pending |
| APP-02 | Phase 3 | Pending |
| APP-03 | Phase 3 | Pending |
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 4 | Pending |
| SEO-03 | Phase 3 | Complete |
| SEO-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 — traceability populated after roadmap creation*
