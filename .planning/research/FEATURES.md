# Feature Research

**Domain:** Software lab / project portfolio / marketing hub (multi-app showcase site)
**Researched:** 2026-03-03
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero section with clear value proposition | Every marketing site has one; users orient themselves here in the first 3 seconds | LOW | Headline under 10 words, subheadline, single primary CTA; dark bg with violet/teal gradient treatment |
| Experiment/project cards on homepage | The entire point of a hub — "show me what you build"; card-based navigation is the expected pattern for multi-product hubs | MEDIUM | Cards need title, description, status badge (Active / Beta / Coming Soon), and CTA link to subdomain |
| Per-app dedicated marketing page | Users discovering BlockAbye or Brickify via search expect a standalone page about that app, not just a card | MEDIUM | Hero, features section, CTA/waitlist per app; treated as a true landing page |
| Responsive design (desktop, tablet, mobile) | Over 50% of traffic is mobile; failing this signals an unserious product | LOW | Next.js + Tailwind makes this straightforward; dark palette needs testing on OLED screens |
| Sticky / persistent navigation header | Users expect to be able to navigate between apps and back to hub without scrolling up | LOW | Logo + nav links + optional CTA button; should be subtle/translucent on dark bg |
| Footer with links and contact | Signals legitimacy; professional network visitors specifically check for this | LOW | Links to apps, social, email or contact; minimal is fine |
| Fast page load (LCP < 2.5s) | Every second of delay costs ~7% conversions; slow sites signal poor quality | MEDIUM | Next.js SSR handles this; image optimization and font loading need attention |
| SEO-friendly URLs and meta tags | Apps need to be discoverable via search; marketing pages with no SEO are invisible | LOW | Next.js `<Head>` with title, description, Open Graph tags per page; straightforward with SSR |
| Status indicators for apps | Users need to know if an app is live, in beta, or coming soon before clicking | LOW | Status badge on each card and at top of app marketing page; avoids confusion and sets expectations |
| Mobile-friendly CTA / waitlist form | The conversion action on pre-launch apps; users on mobile must be able to sign up | LOW | Simple email input + submit; needs accessible tap targets |

### Differentiators (Competitive Advantage)

Features that set JazLab apart from generic portfolios or plain developer pages. Not required to launch, but create the "this is different" reaction.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Lab/experiment framing with consistent visual language | Transforms a portfolio into a brand — visitors remember JazLab, not just the individual apps; the "dog + flask" identity is inherently memorable and warm | MEDIUM | Use lab terminology throughout ("experiments," "running," "incubating"); consistent violet/teal gradient treatment; sparkle accents; not just an "about me" page |
| Animated hero with scroll-triggered reveals | Sites like Vercel and Raycast use motion to demonstrate craft; static pages read as cheap | HIGH | Framer Motion scroll-linked animations; staggered card entry; gradient blob or particle background in hero; performance budget must be respected |
| Bento grid layout for app showcase | Modern grid treatment (popularized by Apple, Linear, Raycast) reads as premium and deliberate vs. plain card lists | MEDIUM | CSS grid with variable card sizes; each card can have a distinct visual/illustration; not a simple equal-column list |
| App-specific visual identity per marketing page | Each app getting its own hero illustration or screenshot creates a polished product-level feel; professional network visitors see depth | HIGH | Custom illustration or product screenshot treatment per app; distinct accent color within JazLab palette per app |
| Inline demo preview or video on app marketing pages | "Up to 80% lift" in conversions when included; shows confidence in the product | HIGH | Muted autoplay short-form video or animated GIF for apps that have UI to show; skip for fully pre-launch apps |
| Waitlist with count or social proof signal | "412 people waiting" creates urgency and validates the concept to new visitors | MEDIUM | Waitlist signup captures email; showing count requires backend or static counter; can fake momentum with "Join 100+ early readers" |
| Gradient text and accent typography | Defines the premium dark-mode aesthetic; sites like Vercel, Linear, and Raycast all use it | LOW | CSS `background-clip: text` with violet-to-teal gradient on key headings; Tailwind supports this cleanly |
| Subtle noise/grain texture on dark backgrounds | Differentiates from flat dark mode; used by Raycast (noisy overlays) and high-end SaaS sites to add tactile depth | LOW | CSS `backdrop-filter` or SVG noise filter on hero bg; 4-8% opacity so it's felt not seen |
| "Labs" status page or experiment log | Signals transparency and active development; professional audience values the narrative of a working lab | MEDIUM | Simple list or timeline of experiments, their status, and what was learned — even for experiments that didn't ship |
| Schema.org structured data | Structured data gets 30% more clicks from search; `SoftwareApplication` schema per app page boosts discoverability for AI search and rich results | LOW | JSON-LD in Next.js `<Head>` per app; `SoftwareApplication`, `Organization` types; straightforward to implement |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for JazLab's specific context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Blog / updates section | Signals activity and helps SEO; many portfolio sites have one | Requires ongoing content investment; empty blog is worse than no blog; not in scope per PROJECT.md | Defer to Milestone 2; a "latest experiments" section with static changelog entries is lower-maintenance substitute |
| User authentication on shell site | Feels like "real product"; could gate exclusive content | JazLab is a marketing hub, not an app; auth adds complexity, security surface, and maintenance with no clear user value at this stage | Individual apps handle their own auth on subdomains; JazLab stays stateless |
| Pricing pages | Signals maturity and revenue intent | All 3 apps are experimental/pre-launch; pricing pages set false expectations and date poorly | Use waitlist CTA + "Pricing coming soon" text on app pages if needed |
| Embedded microfrontend runtime (Module Federation) | Technical elegance; one domain shows all apps | Out of scope per PROJECT.md; adds significant complexity, cross-origin coordination, and deployment coupling | Link to subdomains; JazLab is hub-and-spoke, not an embedded shell |
| Dark/light mode toggle | Accessibility win; many users prefer light | JazLab's entire brand identity is dark; a light mode would require designing two complete visual systems and dilute the lab aesthetic | Commit fully to dark; honor `prefers-color-scheme` by making dark the default that also satisfies dark-mode OS users |
| Real-time visitor counter or live stats | Adds "activity" signal; Product Hunt-style urgency | Requires backend/WebSockets for a static marketing site; adds complexity for minimal conversion gain; can look desperate if counts are low | Static social proof ("built by JazLab LLC") or email waitlist count if/when numbers justify it |
| Contact / inquiry form with backend | Professional visitors want to reach out | Full form backend (spam filtering, email delivery, storage) is a maintenance burden; simpler to start with mailto link | `mailto:` link in footer or contact page; upgrade to form only if volume justifies it |
| Infinite scroll or pagination for experiments | Future-proof for more apps | 3 apps do not need pagination; over-engineering this wastes time and adds complexity | Simple grid; revisit when experiments exceed 8-10 |

## Feature Dependencies

```
App Marketing Page (per-app)
    └──requires──> Brand System (colors, typography, logo)
    └──requires──> Status Indicator Pattern (Active/Beta/Coming Soon)
    └──requires──> CTA / Waitlist Form

Homepage Experiment Grid
    └──requires──> App Cards (title, desc, status, CTA)
                       └──requires──> Status Indicator Pattern
    └──requires──> Brand System

SEO (discoverability)
    └──requires──> SSR / Next.js (meta tags rendered server-side)
    └──requires──> Unique per-page title + description + OG tags
    └──enhances──> Schema.org structured data (optional but high value)

Scroll Animations
    └──requires──> Core pages built and stable (animate after structure is right)
    └──conflicts──> Performance budget (must stay under LCP 2.5s)

Waitlist Form
    └──requires──> Email capture backend or third-party service (e.g. Resend, Mailchimp, Beehiiv)
    └──enhances──> Waitlist count signal (if backend tracks count)

App-specific Visual Identity
    └──requires──> Brand System
    └──enhances──> App Marketing Page (makes each feel like a real product)

Bento Grid
    └──requires──> Homepage Experiment Grid
    └──enhances──> App-specific Visual Identity (variable card sizes enable visual differentiation)
```

### Dependency Notes

- **App Marketing Page requires Brand System:** Colors, type scale, logo, and spacing must exist before per-app pages can be designed consistently.
- **SSR requires Next.js:** Per PROJECT.md this is already decided; SSR is the prerequisite for SEO meta tags being indexed.
- **Scroll Animations conflict with Performance:** Every animation adds JS weight; must gate behind `useReducedMotion` and keep under 50KB animation JS budget.
- **Waitlist Form requires a backend service:** Even a simple email capture needs somewhere to send and store emails; third-party services (Resend + database, or a form service like Loops/Beehiiv) keep this LOW complexity.
- **Bento Grid enhances App-specific Visual Identity:** Variable card sizing lets each app card have a distinct visual treatment without extra design work.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept and serve both audiences (potential users + professional network).

- [ ] Homepage hero with JazLab value proposition, logo, and primary CTA — establishes identity in 3 seconds
- [ ] Experiment grid with 3 app cards (title, description, status badge, link to subdomain) — the core function of the hub
- [ ] App marketing page for each of the 3 apps (hero, feature list, CTA/waitlist) — table stakes for user acquisition and SEO
- [ ] Brand system applied consistently (violet/teal palette, dark foundation, typography) — without this nothing else holds together
- [ ] Sticky navigation header linking hub to all app pages — users need to move between sections
- [ ] SEO meta tags + Open Graph per page — marketing pages need to be indexable from day one
- [ ] Responsive layout (desktop + mobile) — over half of traffic is mobile
- [ ] Status badges per app (Active / Beta / Coming Soon) — sets user expectations without confusion
- [ ] Footer with links and contact — legitimacy signal for professional audience

### Add After Validation (v1.x)

Features to add once core is working and traffic patterns are understood.

- [ ] Scroll-triggered animations (Framer Motion entry reveals on experiment cards) — add after structure is stable; trigger when pages feel "done but flat"
- [ ] Waitlist with signup count display — add when waitlist volume justifies social proof signal
- [ ] Schema.org structured data per app page — add after pages are live; low effort, high SEO return
- [ ] Noise/grain texture on hero — subtle polish; add once core visual system is validated
- [ ] Bento grid upgrade from uniform cards — upgrade from equal-column grid after seeing how the 3-card layout actually reads

### Future Consideration (v2+)

Features to defer until product-market fit is established or more experiments are added.

- [ ] Blog / updates section — requires content strategy and ongoing maintenance; defer per PROJECT.md
- [ ] "Labs" experiment log / status page — valuable narrative but low immediate conversion value; add when 5+ experiments exist
- [ ] Inline video demo per app page — high conversion value but requires apps to have UI worth demoing; defer until apps are further along
- [ ] App-specific illustrated hero per marketing page — high polish differentiator; defer until brand system is locked and apps are more mature

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Homepage hero + brand identity | HIGH | LOW | P1 |
| Experiment grid with 3 app cards | HIGH | LOW | P1 |
| App marketing pages (x3) | HIGH | MEDIUM | P1 |
| Status badges on cards | HIGH | LOW | P1 |
| Responsive layout | HIGH | LOW | P1 |
| SEO meta + Open Graph per page | HIGH | LOW | P1 |
| Sticky navigation | MEDIUM | LOW | P1 |
| Footer | MEDIUM | LOW | P1 |
| Waitlist CTA / email capture | HIGH | MEDIUM | P1 |
| Scroll-triggered animations | MEDIUM | MEDIUM | P2 |
| Bento grid layout | MEDIUM | MEDIUM | P2 |
| Gradient text / accent typography | MEDIUM | LOW | P2 |
| Schema.org structured data | MEDIUM | LOW | P2 |
| Noise/grain texture | LOW | LOW | P2 |
| Waitlist count display | MEDIUM | MEDIUM | P2 |
| App-specific visual identity per page | HIGH | HIGH | P2 |
| Inline video / animated demo | HIGH | HIGH | P3 |
| Labs status / experiment log | MEDIUM | MEDIUM | P3 |
| Blog / updates section | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Reference sites analyzed: Vercel, Linear, Raycast (dark modern aesthetic, developer-focused product marketing).

| Feature | Vercel | Linear | Raycast | JazLab Approach |
|---------|--------|--------|---------|-----------------|
| Hero section | Dual CTA (deploy + demo), tabbed product showcase | Animated grid-dot background, bold single CTA | 3D animated cube, dual CTA | Single primary CTA to hub or most prominent app; gradient blob hero bg |
| Social proof | Customer logos + performance metrics | Implied through design prestige | 24+ testimonial quotes + community size | Professional framing ("by Daniel Beacham / JazLab LLC"); waitlist count when available; skip logos until earned |
| Navigation | Products mega-menu, sticky header | Minimal sticky header | Minimal sticky header | Hub nav: JazLab logo + app links + optional CTA; no mega-menu needed at 3 apps |
| Feature presentation | Tabbed content sections, code examples | Animated feature cards | Keyboard imagery + feature grid | App marketing pages: feature list with icon + description; bento grid on homepage |
| Dark aesthetic | True dark + gradient text, glassmorphism | Dark bg + animated grid dots | Noisy dark bg + bold red accent | Dark foundation (#0F1117) + violet/teal gradients + subtle grain |
| Per-product pages | No (single product) | No (single product) | No (single product) | Yes — JazLab has 3 dedicated app marketing pages; this is a key structural differentiator vs. single-product sites |
| Status / state handling | N/A (product is live) | N/A (product is live) | N/A (product is live) | Explicit status badges (Active/Beta/Coming Soon) per app card; "join waitlist" CTA for pre-launch apps |
| Footer | Comprehensive multi-column | Minimal | Comprehensive with newsletter | Minimal-medium: app links + social + contact; no newsletter unless blog is added |

## Sources

- Vercel marketing site (vercel.com) — hero, navigation, feature showcase patterns
- Raycast marketing site (raycast.com) — dark aesthetic, noise overlay, testimonial patterns, extension marketplace tabs
- Linear design analysis (blog.logrocket.com/ux-design/linear-design/) — linear design principles, dark mode patterns, gradient use
- SaaS landing page best practices (userpilot.com/blog/saas-landing-pages/) — section structure, table stakes vs differentiators
- SaaS marketing page analysis (designrevision.com/blog/marketing-saas-landing-pages) — conversion benchmarks, video demo impact, hero CTA patterns
- Schema.org structured data for SEO (seranking.com/blog/structured-data/) — 30% CTR improvement finding, JSON-LD implementation
- Portfolio design trends 2026 (colorlib.com/wp/portfolio-design-trends/) — dark aesthetic, IDE-style themes, chapter-based structure
- Landing page design trends 2026 (moburst.com/blog/landing-page-design-trends-2026/) — mobile-first, bold typography, AI personalization trends

---
*Feature research for: JazLab — software lab / project portfolio / marketing hub*
*Researched: 2026-03-03*
