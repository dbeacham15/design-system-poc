# Requirements: JazLab

**Defined:** 2026-03-03
**Core Value:** Visitors instantly understand what JazLab is and can explore, learn about, and access any experiment from one compelling hub.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Brand & Layout

- [ ] **BRAND-01**: User sees a hero section with JazLab logo, value proposition headline, and primary CTA within 3 seconds of landing
- [ ] **BRAND-02**: User can navigate between hub and all app pages via a sticky header that persists across scroll
- [ ] **BRAND-03**: User finds app links, social links, and contact info in a consistent footer on every page
- [ ] **BRAND-04**: All pages consistently use the JazLab brand system (violet/teal palette, dark foundation, Inter typography)
- [ ] **BRAND-05**: Lab/experiment terminology is used throughout ("experiments," "running," "active") reinforcing the lab identity
- [ ] **BRAND-06**: Key headings use gradient text treatment (violet-to-teal) as a signature visual element
- [ ] **BRAND-07**: Dark backgrounds include subtle noise/grain texture for tactile depth

### Experiment Showcase

- [ ] **SHOW-01**: User sees an experiment grid on the homepage with cards for all 3 apps (BlockAbye, Brickify, Sournal)
- [ ] **SHOW-02**: Each experiment card displays title, description, status badge (Active/Beta/Coming Soon), and link to app
- [ ] **SHOW-03**: Homepage has an animated cosmic/space particle background with floating effects matching the reference image
- [ ] **SHOW-04**: Experiment cards and page sections animate in with scroll-triggered reveal effects
- [ ] **SHOW-05**: Experiment grid uses a bento-style layout with variable card sizes

### App Marketing Pages

- [ ] **APP-01**: Each of the 3 apps has a dedicated marketing page with hero section, feature highlights, and CTA
- [ ] **APP-02**: Each app marketing page includes a waitlist/email capture form for early access signup
- [ ] **APP-03**: Each app marketing page has a distinct visual identity (custom illustration or accent treatment)

### SEO & Performance

- [ ] **SEO-01**: Every page has unique title and description meta tags optimized for search
- [ ] **SEO-02**: Every page has Open Graph tags generating correct social sharing previews
- [ ] **SEO-03**: All pages are fully responsive across desktop, tablet, and mobile breakpoints
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
| BRAND-01 | — | Pending |
| BRAND-02 | — | Pending |
| BRAND-03 | — | Pending |
| BRAND-04 | — | Pending |
| BRAND-05 | — | Pending |
| BRAND-06 | — | Pending |
| BRAND-07 | — | Pending |
| SHOW-01 | — | Pending |
| SHOW-02 | — | Pending |
| SHOW-03 | — | Pending |
| SHOW-04 | — | Pending |
| SHOW-05 | — | Pending |
| APP-01 | — | Pending |
| APP-02 | — | Pending |
| APP-03 | — | Pending |
| SEO-01 | — | Pending |
| SEO-02 | — | Pending |
| SEO-03 | — | Pending |
| SEO-04 | — | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after initial definition*
