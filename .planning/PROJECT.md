# JazLab

## What This Is

JazLab is a software laboratory and project hub created by Daniel Beacham (JazLab LLC). It serves as both a landing page showcasing active experiments and a marketing platform for individual applications. The site is the central entry point for multiple independent apps — each treated as an "experiment" running inside the lab — providing brand identity, navigation, and dedicated marketing pages while each app operates on its own subdomain as a microfrontend.

## Core Value

Visitors instantly understand what JazLab is and can explore, learn about, and access any experiment from one compelling hub.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Homepage "lab dashboard" with experiment cards for all 3 current apps
- [ ] Dedicated marketing sub-page per app (hero, features, waitlist/CTA, demo link)
- [ ] JazLab brand identity with dark lab aesthetic and violet/teal palette
- [ ] SVG logo integration (dog + flask icon with JazLab wordmark)
- [ ] Responsive design across desktop, tablet, mobile
- [ ] SEO-friendly marketing pages for app discoverability
- [ ] Microfrontend host shell architecture (apps on subdomains)
- [ ] Next.js framework with SSR for the shell site

### Out of Scope

- Blog or updates section — defer to later milestone
- Actual microfrontend runtime integration (Module Federation, etc.) — JazLab links to subdomains, doesn't embed apps
- User authentication on the JazLab site itself
- Pricing pages — apps are in experimental stages
- Mobile native app

## Context

**Brand Identity:**
- Inspired by Jasmine, a golden retriever, combined with a laboratory concept
- Logo: dog silhouette + lab flask with sparkle accents
- Dark modern interface with vibrant accent colors evoking discovery and experimentation
- Tone: modern AI research lab mixed with playful invention workshop

**Visual Reference (provided mockup):**
- Deep space/cosmic background with floating particle effects (stars, glowing dots, bokeh)
- Perspective grid lines at the bottom edge creating depth and a "digital horizon" feel
- Centered layout: logo at top, headline "A laboratory for software experiments", subheading "Experiments currently running:"
- Three experiment cards in a horizontal row with teal/cyan glowing borders
- Each card has: green "ACTIVE" status badge, uppercase app name, description text, app-specific illustration
- Overall aesthetic: cosmic laboratory — deep space meets tech lab with ambient particle effects

**Color Palette:**
- Primary: JazLab Violet (#5B3DF5)
- Secondary: JazLab Teal (#28C7B7)
- Energy Accent: Cyan (#00D4FF)
- Sparkle: (#FFD36B)
- Dark foundation: #0F1117 (bg), #1A1E2A (cards), #242938 (panels), #32384A (borders)
- Typography: #F2F4F8 (primary), #A4A9B6 (secondary), #6C7385 (muted)
- Gradients: violet-to-teal primary, teal-to-cyan accent

**Current Experiments (3):**

1. **BlockAbye** — AI-powered system that generates personalized children's storybooks from family photos and prompts
2. **Brickify** — AI tool that converts images or concepts into structurally valid LEGO-style builds and instructions
3. **Sournal** — Structured journaling and thinking companion for capturing ideas, reflection, and thought organization

Each app is at a different stage of development. Marketing pages should accommodate apps that aren't fully launched yet (waitlist/coming soon states).

**Audience:**
- Potential users discovering BlockAbye, Brickify, or Sournal
- Professional network: employers, collaborators, investors viewing Daniel's work

**Architecture:**
- JazLab shell site: Next.js (SSR, SEO)
- Apps live on subdomains: blockabye.jazlab.llc, brickify.jazlab.llc, sournal.jazlab.llc
- JazLab provides navigation hub + marketing pages; apps run independently

## Constraints

- **Tech stack**: Next.js with SSR for SEO and marketing page performance
- **Brand**: Must strictly follow JazLab color palette and visual identity described above
- **Architecture**: Microfrontend approach — subdomain per app, JazLab is the shell/hub
- **Domain**: Not yet decided — design should be domain-agnostic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js for shell site | SSR for SEO, React ecosystem for future microfrontend integration | — Pending |
| Subdomains per app | Clean separation, independent deployment, each app can use its own stack | — Pending |
| Marketing pages per app | Both user acquisition and professional showcase value | — Pending |
| Dark UI with violet/teal palette | Matches lab/experimentation brand, modern and distinctive | — Pending |

---
*Last updated: 2026-03-03 after initialization*
