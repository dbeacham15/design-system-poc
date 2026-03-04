# Pitfalls Research

**Domain:** Next.js marketing hub / software lab landing page (multi-product, dark UI, SSR, microfrontend subdomain architecture)
**Researched:** 2026-03-03
**Confidence:** HIGH (verified against official Next.js docs, Vercel documentation, and multiple community sources)

---

## Critical Pitfalls

### Pitfall 1: Dark Theme Flash of Unstyled Content (FOUC) — White Flash on Load

**What goes wrong:**
The page renders in light/default state for a brief moment on every load before the dark theme applies. On a dark-first brand like JazLab (bg `#0F1117`), this manifests as a jarring white flash before the dark background appears. Users notice it immediately, and it signals a broken product.

**Why it happens:**
SSR renders HTML on the server before the browser has executed JavaScript. The server has no access to `localStorage` or `window`, so it cannot know the user's theme preference. The browser receives unstyled HTML, begins painting, and only then runs JS that applies the dark class. If `next-themes` is misconfigured or the `suppressHydrationWarning` attribute is missing from the `<html>` tag, this compounds into a React hydration warning on top of the visual flash.

**How to avoid:**
- Install `next-themes` and wrap the app in `<ThemeProvider>` with `defaultTheme="dark"` and `attribute="class"`.
- Add `suppressHydrationWarning` to the `<html>` element in `app/layout.tsx`.
- For JazLab: since it is dark-only (not a theme toggle), set the dark class directly on `<html>` in the root layout rather than using `next-themes` at all. This eliminates the flash entirely — there is nothing to toggle.
- If a theme toggle is ever added, inject a tiny inline `<script>` in the `<head>` that reads the preference from `localStorage` and adds the class before the browser paints (the "blocking script" pattern).
- Never render theme-dependent UI (colors, icons) before the component has mounted on the client.

**Warning signs:**
- Visible white flash when navigating to the site in a new tab.
- React console warning: "Warning: Prop `className` did not match."
- The `<html>` tag in DevTools shows no `dark` class briefly on page load.

**Phase to address:** Foundation / Project Setup phase. This must be solved before any visual work begins — theming is a root-level decision that affects every component.

---

### Pitfall 2: Incorrect Rendering Strategy — Using SSR Where SSG Belongs

**What goes wrong:**
Marketing pages are built with full server-side rendering (SSR, `getServerSideProps` or dynamic rendering) instead of static generation (SSG). The page content — hero copy, feature lists, app descriptions — never changes between requests. Using SSR means every visitor triggers a server render, increasing latency, TTFB, and infrastructure cost for zero benefit.

**Why it happens:**
Developers default to SSR because it feels "safe" and avoids thinking about revalidation. In Next.js App Router, components are server components by default but can inadvertently be made dynamic by using `cookies()`, `headers()`, or uncached `fetch()`.

**How to avoid:**
- Use static generation (no dynamic data fetching, or `fetch` with `cache: 'force-cache'`) for all marketing pages: homepage, per-app marketing pages, and any "coming soon" pages.
- The only content that changes is app status (launched vs. waitlist). Model this as a compile-time data source (a TypeScript config file listing each app's status) so pages are statically generated with the correct state.
- Verify with `next build` output: marketing pages should show the static `○` symbol, not `λ` (server-rendered).

**Warning signs:**
- High TTFB (> 500ms) on pages whose content never changes.
- `next build` output shows dynamic routes for pages that have no dynamic data.
- `cookies()` or `headers()` imported into a marketing page layout.

**Phase to address:** Foundation / Project Setup phase. Rendering strategy must be decided before pages are built, not after.

---

### Pitfall 3: Animation Performance — Animating Layout-Triggering Properties

**What goes wrong:**
Scroll-triggered entrance animations, hover effects, and transitions animate CSS properties like `height`, `width`, `top`, `left`, `margin`, or `box-shadow`. These properties force the browser through full layout and paint cycles on every frame, causing janky 30fps (or worse) animations that look unprofessional — exactly the opposite of the polished lab aesthetic JazLab needs.

**Why it happens:**
It is visually intuitive to animate the property that represents the change you want (e.g., animate `height` to expand a card). Developers do not always know which properties are GPU-composited vs. layout-triggering.

**How to avoid:**
- Animate only `transform` (translate, scale, rotate) and `opacity`. These are GPU-composited and never trigger layout or paint.
- For Framer Motion: use `initial={{ opacity: 0, y: 20 }}` / `animate={{ opacity: 1, y: 0 }}` patterns — not `height` or `margin`.
- Add `will-change: transform` sparingly to elements with complex animations to promote them to their own GPU layer.
- Use CSS `animation` or `transition` on `transform`/`opacity` for hover effects; avoid JavaScript-driven position updates.
- For scroll-triggered animations, use the native CSS Scroll-driven Animations API (available in modern browsers) or Intersection Observer — not JS that reads scroll position on every frame.
- Limit the number of simultaneously animated elements. More than ~20 concurrent GPU layers can cause memory pressure on mobile.

**Warning signs:**
- Chrome DevTools Performance tab shows paint or layout events during animations.
- Frame rate drops to < 60fps visible in the Performance panel.
- Animation feels smooth on desktop but janky on mobile (mobile GPUs are weaker).
- `will-change` applied to dozens of elements at once.

**Phase to address:** UI / Visual Polish phase. Establish the animation pattern library early with correct properties so all animations follow the same GPU-safe approach from the start.

---

### Pitfall 4: Framer Motion + Next.js App Router Incompatibilities

**What goes wrong:**
Framer Motion's `AnimatePresence` (for exit animations), shared layout animations (`layoutId`), and some scroll animation features have documented compatibility issues with Next.js App Router. Shared layout animations do not work reliably across routes in the app directory. Additionally, React 19 compatibility with older Framer Motion versions is incomplete.

**Why it happens:**
Framer Motion was designed around React's component lifecycle model and the older Pages Router. The App Router's different streaming and concurrent rendering model changes when components mount and unmount, breaking assumptions Framer Motion makes about DOM timing.

**How to avoid:**
- Use Motion (formerly Framer Motion) at version 11+ which has improved App Router support.
- Avoid `AnimatePresence` for page-level transitions in App Router — use CSS transitions with `@starting-style` for enter/exit effects instead, which are now well-supported in modern browsers.
- Do not use `layoutId` for cross-route shared element transitions — the App Router does not support the DOM continuity this requires.
- Validate Framer Motion version compatibility against the actual Next.js and React versions at project start.
- Keep animation dependencies (`motion`, `framer-motion`) locked to versions confirmed working with the chosen Next.js version.

**Warning signs:**
- Console errors about "ExitAnimation" or "LayoutGroup" during navigation.
- Elements snap to position instead of animating smoothly on route change.
- Hydration errors that appear only when animations are present.

**Phase to address:** Foundation / Project Setup phase. Validate the animation library version combination before building any animated components.

---

### Pitfall 5: Overusing "use client" — Destroying Server Component Benefits

**What goes wrong:**
Entire page components — or large sections of the layout — are marked `"use client"` because one small interactive element (a mobile menu toggle, a CTA button hover state) needs browser APIs. This sends the entire component tree's JavaScript to the browser, inflating bundle size and eliminating the SSR performance benefits for a marketing site.

**Why it happens:**
When a component needs `useState` or an event handler, developers add `"use client"` at the top of that file. If that component is a page-level component or a large layout section, the entire subtree becomes client-rendered.

**How to avoid:**
- Default to Server Components for all marketing page content: hero sections, feature lists, app cards, footer.
- Extract only the interactive leaf nodes into Client Components: `<MobileMenuButton>`, `<WaitlistForm>`, `<CTAButton>` (if it has hover animation state).
- The rule: `"use client"` belongs on the smallest possible component that actually needs browser APIs or interactivity.
- Use the "push client components to the leaves" pattern — pass server-fetched data as props down into Client Components rather than fetching client-side.

**Warning signs:**
- `"use client"` at the top of page files or layout files.
- Bundle analyzer (e.g., `@next/bundle-analyzer`) showing unexpectedly large client chunks for pages with mostly static content.
- DevTools Network tab shows large JS bundles loading for marketing pages.

**Phase to address:** Foundation / Project Setup phase. Establish the Server vs. Client Component boundary rule before building pages. Enforce during code review.

---

### Pitfall 6: Missing or Broken Open Graph and Social Metadata

**What goes wrong:**
When links to JazLab or individual app pages are shared on LinkedIn, Twitter/X, Slack, or iMessage, no preview card appears — or the wrong title/description/image shows. For a professional portfolio targeting employers and collaborators, this is a significant impression failure.

**Why it happens:**
- `metadataBase` is not set in `layout.tsx`, so relative image URLs in `openGraph.images` are not resolved to absolute URLs.
- Open Graph images are defined with relative paths, which social scrapers cannot follow.
- Per-app marketing pages do not define their own `metadata` export, inheriting only the root layout metadata.
- The OG image file size exceeds 8MB (for `og:image`) or 5MB (for Twitter card images).

**How to avoid:**
- Set `metadataBase` in the root layout to the production domain (use `NEXT_PUBLIC_SITE_URL` env var).
- Every page (`/`, `/apps/blockabye`, `/apps/brickify`, `/apps/sournal`) must export a `metadata` object or `generateMetadata` function with unique `title`, `description`, and `openGraph.images`.
- Generate OG images using Next.js's built-in `ImageResponse` from `next/og` for dynamic, on-brand cards.
- Keep OG image files under 1MB for reliable scraper support.
- Verify with the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and [Twitter Card Validator](https://cards-dev.twitter.com/validator) before launch.

**Warning signs:**
- Sharing a page URL on Slack or iMessage shows only the URL, no preview card.
- `<meta property="og:image">` in the page source contains a relative URL like `/og.png` instead of `https://jazlab.llc/og.png`.
- All pages show the same title and description when shared.

**Phase to address:** SEO / Metadata phase (or integrated into each marketing page's build phase). Must be verified before any public launch or sharing.

---

### Pitfall 7: Hub Homepage Messaging Confusion — No Clear Single Action

**What goes wrong:**
The homepage tries to be everything: introduce JazLab, introduce all 3 apps, explain each app's value proposition, and drive signups — all at once. Visitors who arrive from a search or referral link cannot quickly understand what JazLab is or what they should do next. The page feels like a portfolio dump rather than a compelling hub.

**Why it happens:**
Multi-product hubs naturally accumulate content. Each experiment card competes for attention. Without a clear hierarchy, the primary CTA (explore an app, join a waitlist) gets buried.

**How to avoid:**
- The homepage has one job: make the lab concept instantly clear and route visitors to the right experiment. Keep the hero ruthlessly focused (one headline, one sub-headline, one primary CTA or exploration prompt).
- Each experiment card on the homepage is a navigation element, not a full marketing pitch. Save the pitch for the dedicated per-app marketing page.
- The per-app marketing pages each have one primary CTA: either "Join waitlist" or "Open app" — never both.
- Establish a content hierarchy document before writing copy: what does each page say, and what is the single action it drives?

**Warning signs:**
- The homepage hero section has more than two CTAs.
- Experiment cards contain feature lists (that content belongs on per-app pages).
- User testing shows visitors can't answer "What is JazLab for?" within 5 seconds.

**Phase to address:** Content Architecture phase (before implementation). Write the hierarchy and page goals in a brief before building any UI.

---

### Pitfall 8: Cumulative Layout Shift from Unspecified Image Dimensions

**What goes wrong:**
The SVG logo, app screenshots, and hero images load without explicit `width` and `height` attributes (or Tailwind `aspect-ratio` classes). As images load, they push content down, causing layout shifts that hurt both user experience and Core Web Vitals CLS scores (Google ranking signal).

**Why it happens:**
- Developers use `<img>` tags or Next.js `<Image>` without specifying dimensions.
- SVGs embedded as `<img>` tags without explicit size.
- Lazy-loaded images that don't reserve space before loading.

**How to avoid:**
- Always use Next.js `<Image>` component with explicit `width` and `height` props, or `fill` with a sized container.
- For the SVG logo: give it an explicit container with fixed dimensions.
- For hero sections with dynamic content: reserve space with CSS `min-height` or `aspect-ratio` before content loads.
- Use `priority` prop on the hero/above-the-fold image to preload it and eliminate LCP delay simultaneously.

**Warning signs:**
- Chrome DevTools Lighthouse report shows CLS score above 0.1.
- Visible content jump as the page finishes loading.
- `<img>` tags in the source without `width`/`height` attributes.

**Phase to address:** Foundation / Component Library phase. Establish the image usage pattern early.

---

### Pitfall 9: Font Loading Causing FOUT and CLS

**What goes wrong:**
Custom fonts (e.g., Inter, Space Grotesk, or any display font for the JazLab brand) load after initial paint, causing visible text reflow as the fallback system font swaps out. The layout shift from mismatched fallback metrics degrades both perceived quality and CLS score.

**Why it happens:**
- Using `<link>` tags to Google Fonts instead of `next/font` — this requires a separate HTTP request and does not benefit from Next.js's build-time font optimization.
- Importing the same font in multiple component files, creating duplicate font instances and bundle bloat.
- Not specifying `display: swap` (or using `next/font`'s built-in handling).

**How to avoid:**
- Use `next/font/google` exclusively. Next.js downloads fonts at build time and serves them from the same origin, eliminating the network round-trip to Google Fonts.
- Define all fonts in a single shared file (`/lib/fonts.ts`) and import the CSS variable from there into the root layout. Never import fonts in individual component files.
- Use CSS variable fonts where available (Inter is variable) to minimize font file requests.
- `next/font` handles `adjustFontFallback` automatically, which sizes the fallback font to match the web font metrics, virtually eliminating CLS from font swap.

**Warning signs:**
- Visible text reflow as the page loads (text snaps from system font to custom font).
- Multiple `@font-face` declarations for the same font family in the browser DevTools.
- Google Fonts `<link>` tags in `<head>` instead of `next/font` references.

**Phase to address:** Foundation / Project Setup phase. Font setup is a one-time root decision.

---

### Pitfall 10: Subdomain CORS and Cookie Attribute Mistakes

**What goes wrong:**
The JazLab shell and its experiment apps (on subdomains like `blockabye.jazlab.llc`) share cookies or make cross-origin API calls without correct CORS configuration. In the worst case, shared authentication cookies set by an experiment app are blocked from being sent to the JazLab shell (or vice versa) because of missing `SameSite` or `Domain` cookie attributes, or because CORS headers are missing `Access-Control-Allow-Credentials: true`.

**Why it happens:**
- Developers set cookies without a `Domain` attribute, scoping them to the exact subdomain only.
- When enabling CORS credentials, the response sets `Access-Control-Allow-Origin: *` — which browsers reject when credentials are involved.
- `SameSite=Lax` (the browser default) blocks cookies on cross-site requests, and subdomains are treated differently depending on the browser's definition of "same-site."

**How to avoid:**
- Since JazLab is a navigation hub (it links to apps, does not embed or make API calls to them), actual cross-subdomain API credential sharing is out of scope per the project's own requirements. Keep this boundary clean.
- If any analytics or telemetry needs to span subdomains, use a first-party analytics solution configured at the parent domain level.
- If future cross-subdomain cookies are needed: set `Domain=.jazlab.llc` and `SameSite=None; Secure` (requires HTTPS, which Vercel provides).
- Never use `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` — this is rejected by all browsers.

**Warning signs:**
- Browser console shows: "CORS error: Credentials flag is 'true' but 'Access-Control-Allow-Origin' is '*'."
- Cookies set on `app.jazlab.llc` are not visible when inspecting `jazlab.llc` in DevTools Application tab.
- Authentication state is lost when navigating between the shell and an experiment app.

**Phase to address:** Architecture / Deployment phase. Understand this boundary before building any cross-subdomain interaction.

---

### Pitfall 11: Environment Variables Exposed to Client or Missing in Production

**What goes wrong:**
- Server-only secrets (API keys for waitlist providers like Resend, Mailchimp, or Loops) are accidentally exposed to the browser because the developer adds `NEXT_PUBLIC_` prefix to a secret variable.
- Waitlist form submissions work in development but fail silently in production because environment variables were set in `.env.local` but never added to Vercel's environment settings.
- Production deployment succeeds but forms are broken — error only discovered after launch.

**Why it happens:**
- The distinction between `NEXT_PUBLIC_` (client-safe) and plain env vars (server-only) is easy to confuse.
- Vercel's environment variables are separate from local `.env` files — adding to one does not add to the other.

**How to avoid:**
- Rule: any variable used in an API Route or Server Action → no `NEXT_PUBLIC_` prefix. Any variable the browser must see → `NEXT_PUBLIC_` prefix. Never put secrets in `NEXT_PUBLIC_` variables.
- Maintain a `.env.example` file that lists all required variables (with placeholder values) committed to the repo. Use this as the checklist when configuring Vercel.
- Before launch: audit every `process.env` reference against the Vercel dashboard's environment variable list.
- Set up a validation step in `next.config.ts` that throws a build error if required server-side variables are missing (using a library like `@t3-oss/env-nextjs`).

**Warning signs:**
- `process.env.NEXT_PUBLIC_SECRET_KEY` pattern in the codebase.
- Form submission returns a network error in production but works in development.
- Vercel function logs show `undefined` for an expected environment variable.

**Phase to address:** Foundation / Project Setup phase AND pre-launch verification checklist.

---

### Pitfall 12: Missing Sitemap and Canonical Tags — App Pages Not Getting Indexed

**What goes wrong:**
The dedicated per-app marketing pages (`/apps/blockabye`, `/apps/brickify`, `/apps/sournal`) are not included in the sitemap, or the sitemap is a static file that is not updated when new apps are added. Search engines may not discover or prioritize these pages, undermining the SEO value of the marketing hub.

**Why it happens:**
- Static `sitemap.xml` created once and never updated.
- `robots.txt` accidentally blocks `/apps/` routes.
- No canonical tags, leaving it ambiguous if Google should index `jazlab.llc/apps/blockabye` or some other URL variant.

**How to avoid:**
- Use Next.js App Router's built-in `sitemap.ts` file that programmatically generates the sitemap from the list of apps. When a new app is added to the config, the sitemap updates automatically at build time.
- Define canonical URLs explicitly via `metadata.alternates.canonical` in each page's metadata export.
- Generate a `robots.ts` file that explicitly allows all marketing page routes and the sitemap URL.
- Submit the sitemap to Google Search Console immediately after launch.

**Warning signs:**
- `curl https://jazlab.llc/sitemap.xml` returns a 404.
- Per-app pages do not appear in Google Search Console's Coverage report after several weeks.
- `robots.txt` contains a `Disallow: /apps/` line.

**Phase to address:** SEO / Metadata phase, integrated with each marketing page build.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline styles for one-off dark UI tweaks | Fast to ship | Bypasses the design token system; inconsistent palette across components; harder to update brand colors | Never — use Tailwind CSS variables tied to the palette |
| Copying the same hero section markup into each app page | Fast first page | 3x maintenance burden when brand or layout changes; inconsistency guaranteed | Never — extract a `<HeroSection>` component |
| `"use client"` on entire page files | Avoids thinking about Server/Client boundary | Large JS bundles; slower LCP; eliminates SSR benefits | Never for marketing pages |
| Hardcoded domain in metadata (e.g., `https://jazlab.com`) | Simple | Build breaks or metadata is wrong when domain changes or in preview deployments | Never — use `NEXT_PUBLIC_SITE_URL` env var |
| Static `sitemap.xml` file in `/public` | Simplest possible sitemap | Must be manually updated each time an app page is added | MVP only — replace with generated `sitemap.ts` before launch |
| Skipping `next/font` and linking Google Fonts directly | Familiar pattern | FOUT, CLS, extra network request, no build-time optimization | Never — `next/font` is zero-cost and mandatory |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Waitlist email (Resend, Loops, etc.) | API key set as `NEXT_PUBLIC_` env var, exposed to browser | Use server-only env var; form submission hits a Next.js API Route or Server Action |
| Next.js `<Image>` with SVG | SVG files don't benefit from `next/image` optimization (no format conversion); using `<Image>` for SVGs adds complexity for no gain | Use `<img>` or inline SVG for the JazLab logo; use `next/image` for raster images (screenshots, photos) |
| Tailwind CSS v4 + dark mode | In Tailwind v4, `darkMode: 'class'` configuration syntax changed from v3 | Read Tailwind v4 release notes; use the current CSS-based dark mode config syntax |
| Framer Motion `AnimatePresence` + App Router | Exit animations do not fire on route change | Use CSS `@starting-style` for enter animations; avoid `AnimatePresence` for page transitions in App Router |
| Vercel Analytics + environment variables | Analytics script loaded in development, polluting production metrics | Gate analytics with `process.env.NODE_ENV === 'production'` or use Vercel's automatic environment detection |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all 3 app screenshots above the fold | LCP > 3s; large image payloads on mobile | Use `priority` only on the hero image; lazy-load below-fold screenshots with `<Image loading="lazy">` | Any time |
| Gradient backgrounds implemented as heavy box-shadow or filter blur | Low FPS on scroll; paint events in DevTools | Use CSS `background: linear-gradient(...)` — these are GPU-composited; avoid animated `filter: blur()` | Mobile devices immediately |
| Too many concurrent Framer Motion animations on the homepage | Janky scroll on mid-range mobile devices | Limit simultaneous animations; use Intersection Observer to defer off-screen animations | Devices with < 4GB RAM |
| Importing all Lucide or Heroicons (full library) | Unexpectedly large client bundle | Import individual icons: `import { ArrowRight } from 'lucide-react'` not `import * from 'lucide-react'` | From day one; worsens with each icon added |
| Unoptimized video background in hero section | High bandwidth consumption; poor mobile experience | Avoid video backgrounds; use CSS animations/gradients instead; if video is essential, use very short looping WebM < 500KB | Mobile networks immediately |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing waitlist API keys via `NEXT_PUBLIC_` prefix | Any visitor can extract the key from the page source and submit unlimited fake signups or spam the email provider's API | Never prefix email service API keys with `NEXT_PUBLIC_`. Route all form submissions through a Server Action or API Route |
| No rate limiting on waitlist API Route | Spam signups overwhelm the email list; provider charges for volume | Add rate limiting at the API Route level (Vercel's built-in middleware, or `upstash/ratelimit`) |
| Accepting and storing email addresses without a privacy policy | GDPR/CAN-SPAM compliance failure; legal liability | Add a brief privacy policy page; include a checkbox/link on waitlist forms acknowledging data use |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Experiment cards that look identical for launched vs. not-yet-launched apps | Users click through expecting to access an app that isn't ready; disappointed experience | Visually differentiate: "Join Waitlist" badge vs. "Open App" badge; different card treatment for beta vs. coming-soon |
| CTA copy "Learn More" instead of action-specific text | Vague CTAs reduce click-through rates; users don't know what they're clicking into | Use specific labels: "Join BlockAbye Waitlist", "Open Sournal", "See How Brickify Works" |
| No success state after waitlist form submission | Users don't know if submission worked; may submit multiple times | Show an inline success message immediately after submission; do not redirect (loses context) |
| Mobile menu that overlaps content instead of sliding in/pushing content | Disorienting on mobile; content jumps | Use a fixed-position overlay menu that covers content predictably, with a clear close button |
| Animated entrance effects that replay every time a user scrolls back up | Disorienting on second view; animations become noise | Use `once: true` in Framer Motion `whileInView` to fire entrance animations only once per page visit |

---

## "Looks Done But Isn't" Checklist

- [ ] **Dark theme**: Verify no white flash on page load in a fresh incognito tab. Check `<html>` tag has `dark` class before any JavaScript runs.
- [ ] **Open Graph**: Share each app's marketing URL on Slack or iMessage — confirm a preview card appears with the correct title, description, and image.
- [ ] **Sitemap**: Visit `/sitemap.xml` and confirm all app pages are listed with absolute URLs.
- [ ] **Waitlist form**: Submit the form in production (not dev). Confirm the email arrives in the configured provider's list. Confirm the success state shows.
- [ ] **Mobile responsiveness**: Test on a real iPhone and Android device (not just browser DevTools). Check the lab hero, experiment cards, and app marketing pages.
- [ ] **Environment variables**: Confirm no `NEXT_PUBLIC_` variables contain secrets. Confirm all production env vars are set in Vercel.
- [ ] **Canonical tags**: Inspect each page's `<head>` and confirm a canonical URL is present and points to the correct production URL.
- [ ] **Animation on mobile**: Test scroll-triggered animations on a mid-range Android device. Verify 60fps in Chrome DevTools Performance panel.
- [ ] **App cards for non-launched apps**: Confirm "coming soon" apps show waitlist CTA, not a broken "Open App" link.
- [ ] **Font loading**: Run Lighthouse. Confirm CLS score is < 0.1. Confirm no FOUT visible during the recorded load.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| FOUC dark theme flash | LOW | Add `suppressHydrationWarning` to `<html>`; set `defaultTheme="dark"` in `next-themes`; or switch to inline `class="dark"` on `<html>` for dark-only sites |
| Wrong rendering strategy (SSR instead of SSG) | LOW | Remove dynamic data fetching from the page; audit `next build` output to confirm static generation |
| Broken Open Graph images | LOW | Set `metadataBase` in root layout; verify OG image URLs are absolute in page source; regenerate OG images with `next/og` |
| Animation jank on mobile | MEDIUM | Audit animated properties in DevTools; replace layout-triggering properties with `transform`/`opacity`; reduce number of simultaneous animations |
| Secrets exposed via `NEXT_PUBLIC_` | HIGH | Rotate the exposed API key immediately; move all secret usage to Server Actions or API Routes; audit all `NEXT_PUBLIC_` variables |
| No sitemap / pages not indexed | MEDIUM | Generate `sitemap.ts` programmatically; submit to Google Search Console; add canonical tags; wait 1-4 weeks for re-indexing |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dark theme FOUC | Phase 1: Foundation & Setup | Fresh incognito tab load shows no white flash |
| Wrong rendering strategy (SSR instead of SSG) | Phase 1: Foundation & Setup | `next build` output shows `○` for all marketing page routes |
| Framer Motion App Router compatibility | Phase 1: Foundation & Setup | Test animation library in a minimal branch before committing |
| "use client" overuse | Phase 1: Foundation & Setup | Bundle analyzer shows < 50KB JS for marketing page routes |
| Font loading FOUT/CLS | Phase 1: Foundation & Setup | Lighthouse CLS < 0.1; no visible text reflow |
| Environment variables exposed/missing | Phase 1: Foundation & Setup + Pre-launch | No secrets in `NEXT_PUBLIC_`; production form submissions succeed |
| Animation performance (layout-triggering properties) | Phase 2: UI / Component Library | DevTools Performance panel shows no paint/layout events during animations |
| Image dimension CLS | Phase 2: UI / Component Library | All `<Image>` components have explicit dimensions or `fill` with sized container |
| Hub homepage messaging confusion | Phase 2: Content & Copy | User can explain what JazLab is within 5 seconds of landing |
| Open Graph / social metadata | Phase 3: SEO / Marketing Pages | Link preview cards render correctly on LinkedIn, Slack, iMessage |
| Sitemap and canonical tags | Phase 3: SEO / Marketing Pages | `/sitemap.xml` lists all pages; each page has canonical tag |
| Waitlist form UX and success state | Phase 3: Marketing Pages | Form submission tested in production; success state visible |
| Subdomain CORS and cookie attributes | Phase 4: Deployment & Architecture | No CORS errors in production console when navigating between shell and app subdomains |
| Multi-product content confusion (app cards) | Phase 3: Marketing Pages | Cards distinguish clearly between launched and waitlist-only apps |

---

## Sources

- [Next.js Eliminating Theme Flicker and Hydration Issues](https://medium.com/@ajayrajthakur111/eliminating-theme-flicker-and-hydration-issues-in-next-js-3acbae58faa8) — FOUC and dark theme
- [next-themes GitHub — no-flash dark mode](https://github.com/pacocoursey/next-themes) — Official library for theme management
- [Next.js Fonts Documentation](https://nextjs.org/docs/app/getting-started/fonts) — Official font optimization guidance
- [Framer Motion App Router Issue #49279](https://github.com/vercel/next.js/issues/49279) — Shared layout animation compatibility bug
- [Next.js Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) — Official metadata API
- [metadataBase discussion #57251](https://github.com/vercel/next.js/discussions/57251) — Common OG image URL resolution issue
- [Core Web Vitals 2026 Optimization Guide](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide) — LCP, CLS, INP thresholds and fixes
- [Chrome Developers — Scroll Animation Performance](https://developer.chrome.com/blog/scroll-animation-performance-case-study) — GPU compositing for scroll animations
- [Next.js Environment Variables Guide](https://nextjs.org/docs/pages/guides/environment-variables) — Official env var documentation
- [Why Next.js 15 Cookies Break in Production](https://www.wisp.blog/blog/why-your-nextjs-15-cookies-work-locally-but-break-in-production-and-how-to-fix-it) — Cookie and env var production pitfalls
- [CORS-Friendly Domain Architecture](https://www.namesilo.com/blog/en/website-development/cors-friendly-domain-architecture-preventing-cross-origin-headaches-by-design) — Subdomain CORS patterns
- [Typical Next.js SEO Pitfalls 2024](https://focusreactive.com/typical-next-js-seo-pitfalls-to-avoid-in-2024/) — SEO rendering strategy mistakes
- [Landing Page Mistakes Killing Conversions](https://www.apexure.com/blog/landing-page-mistakes-that-make-you-lose-revenue) — Multi-product messaging pitfalls
- [Waitlist Landing Page Optimization Guide 2026](https://waitlister.me/growth-hub/guides/waitlist-landing-page-optimization-guide) — CTA and form conversion pitfalls
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — Official guidance on "use client" usage

---
*Pitfalls research for: Next.js marketing hub / software lab landing page (JazLab)*
*Researched: 2026-03-03*
