# Phase 3: Pages - Research

**Researched:** 2026-03-03
**Domain:** Next.js 16 page assembly, Motion animations, Canvas particles, Server Actions, waitlist forms
**Confidence:** HIGH (stack confirmed, patterns verified against official docs)

---

## Summary

Phase 3 replaces two placeholder pages (`app/page.tsx` and `app/experiments/[slug]/page.tsx`) with fully realized marketing pages. The homepage needs a cosmic particle background, hero section with the JazLab logo/headline, and the BentoGrid of experiment cards with scroll-reveal animations. Each of the three experiment slug pages becomes a full marketing page with hero, feature list, per-app visual accent, and a working waitlist email form.

The stack is already locked: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui. Motion (`motion` npm package, `motion/react` import) is the animation library called out in STATE.md. All animation client components must be thin "use client" wrappers — server components should remain server components wherever possible. The cosmic particle background is best implemented as a custom HTML5 Canvas component using `useRef` and `requestAnimationFrame`, with no third-party library needed. For waitlist forms, a Server Action (`"use server"`) calling Resend is the current idiomatic Next.js 16 / React 19 pattern using `useActionState`.

**Primary recommendation:** Motion 12.x (`npm install motion`) for scroll-reveal animations with thin "use client" wrappers; custom Canvas hook for particles; Resend + Server Action for email capture — all keeping every page statically pre-rendered.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRAND-01 | Hero section shows JazLab logo, value proposition headline, and primary CTA within 3 seconds of landing | Homepage hero section layout with SVG logo (already at public/jazlab-logo.svg), GradientHeading component, CTA button from shadcn |
| SHOW-01 | Homepage displays experiment grid with cards for all 3 apps | BentoGrid + ExperimentCard already built; homepage needs to render them in the hero page layout |
| SHOW-03 | Homepage has animated cosmic/space particle background with floating effects matching reference mockup | Custom Canvas particle component ("use client"), requestAnimationFrame loop, star/dot particles with opacity drift |
| SHOW-04 | Experiment cards and page sections animate in with scroll-triggered reveal effects | Motion 12.x whileInView + viewport={{ once: true }}, thin "use client" MotionWrapper component |
| APP-01 | Each of 3 apps has a dedicated marketing page with hero section, feature highlights, and CTA | Fills in `app/experiments/[slug]/page.tsx` placeholder using experiment data from lib/experiments.ts |
| APP-02 | Each app marketing page includes a waitlist/email capture form | Server Action ("use server") + Resend SDK + useActionState React 19 hook for pending/success/error |
| APP-03 | Each app marketing page has distinct visual identity per app | Per-app accentColor already in experiments.ts; CSS custom property pattern to style hero accent |
| SEO-03 | All pages fully responsive across desktop, tablet, and mobile breakpoints | Tailwind responsive utilities (existing pattern), verify BentoGrid breakpoints md/lg |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.x | Scroll-reveal and entrance animations | The `motion` package (formerly framer-motion) is the renamed successor; project STATE.md already calls it out as "Motion 11.x" — 12.x is backward-compatible. Import from `motion/react`. |
| resend | ^4.x | Transactional email for waitlist form | Official Next.js integration with Server Actions; free tier (3,000 emails/month); SDK returns `{ data, error }` pattern |
| Next.js | 16.1.6 (already installed) | App Router, Server Actions, generateStaticParams | Already in use; Server Actions stable in Next.js 14+ |
| React | 19.2.3 (already installed) | useActionState for form pending/success state | React 19 built-in hook; replaces useFormState (React 18 experimental) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Input | (install via npx shadcn@latest add input) | Email input field in waitlist form | Keeps form consistent with existing shadcn badge/card components |
| shadcn Button | (install via npx shadcn@latest add button) | CTA buttons and form submit | shadcn Button has built-in disabled/loading state support |
| lucide-react | ^0.576.0 (already installed) | Feature icons (book, palette, clock, etc.) | Already installed; icon names already defined in experiments.ts features |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Canvas particles | tsParticles / @tsparticles/react | tsParticles is 140KB+ bundle hit. Custom canvas hook is ~50 lines, zero dependency, fully controlled |
| Resend | Loops or Mailchimp | Resend has the cleanest Next.js Server Action integration with `{ data, error }` return; no webhooks needed for basic capture |
| Motion whileInView | CSS @keyframes + IntersectionObserver | Motion gives declarative viewport API and GPU-composited transforms without writing raw observer code |

### Installation
```bash
npm install motion resend
npx shadcn@latest add input button
```

---

## Architecture Patterns

### Recommended File Structure for Phase 3

```
src/
├── app/
│   ├── page.tsx                       # Replace placeholder with full homepage
│   └── experiments/
│       └── [slug]/
│           └── page.tsx               # Replace placeholder with marketing page
├── components/
│   ├── ParticleBackground.tsx         # "use client" canvas particle animation
│   ├── MotionWrapper.tsx              # "use client" thin motion wrapper
│   ├── HeroSection.tsx                # Server Component: homepage hero
│   ├── FeatureGrid.tsx                # Server Component: 3-feature grid
│   └── WaitlistForm.tsx              # "use client" form with useActionState
└── actions/
    └── waitlist.ts                    # "use server" Server Action for email
```

### Pattern 1: Thin "use client" Motion Wrapper

**What:** A minimal client component that wraps `motion.div` (or `motion.section`, etc.) and exposes all motion props. Server component pages import this wrapper without becoming client components themselves.

**When to use:** Any element that needs entrance animation, whileInView, or whileHover.

```typescript
// src/components/MotionWrapper.tsx
"use client";

import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  className?: string;
}

export function MotionWrapper({ children, className, ...motionProps }: MotionWrapperProps) {
  return (
    <motion.div className={cn(className)} {...motionProps}>
      {children}
    </motion.div>
  );
}
```

Usage in a Server Component page:
```tsx
// app/page.tsx (Server Component — no "use client" needed here)
import { MotionWrapper } from "@/components/MotionWrapper";

export default function Home() {
  return (
    <MotionWrapper
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h1>Content that fades in</h1>
    </MotionWrapper>
  );
}
```

### Pattern 2: Canvas Particle Background

**What:** Full-viewport HTML5 Canvas with floating star/dot particles using requestAnimationFrame. Fixed-position, behind all content via z-index.

**When to use:** Homepage hero section only (not on individual app marketing pages).

```typescript
// src/components/ParticleBackground.tsx
"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;     // depth — used for size and opacity falloff
  vx: number;    // drift velocity x
  vy: number;    // drift velocity y
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const PARTICLE_COUNT = 120;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles with random positions and gentle drift
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random(),            // 0 = far (small/dim), 1 = near (larger/bright)
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const radius = 0.5 + p.z * 1.5;   // 0.5px to 2px
        const opacity = 0.2 + p.z * 0.6;  // 20% to 80%

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        // Mix teal and white for cosmic feel matching JazLab palette
        ctx.fillStyle = p.z > 0.7
          ? `rgba(40, 199, 183, ${opacity})`   // teal for bright particles
          : `rgba(242, 244, 248, ${opacity})`;  // near-white for dim particles
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
```

**Critical:** Canvas must be `fixed` and `pointer-events-none`. Content must have `position: relative` and `z-index: 1` (already set by `body > * { position: relative; z-index: 1; }` in globals.css).

### Pattern 3: Scroll-Reveal with Stagger

**What:** Animate cards/sections into view as user scrolls. Use `whileInView` + `viewport={{ once: true }}` + stagger delay via `transition.delay`.

```typescript
// Staggered card reveal — used for BentoGrid section on homepage
// In a "use client" wrapper or direct motion component
<motion.div
  initial={{ opacity: 0, y: 32 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-10% 0px" }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
  <ExperimentCard experiment={exp} />
</motion.div>
```

**GPU-composited rule:** Only animate `opacity`, `transform` (`y`, `x`, `scale`). Never animate `height`, `width`, `top`, `left`, or `margin` — those trigger layout and paint, not just composite.

### Pattern 4: Server Action Waitlist Form

**What:** Server Action validates email and calls Resend. Client form uses `useActionState` for pending/success/error state without a database.

```typescript
// src/actions/waitlist.ts
"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function joinWaitlist(
  _prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  // slug passed as hidden input to identify which app
  const app = formData.get("app") as string;

  const { error } = await resend.emails.send({
    from: "JazLab <waitlist@jazlab.llc>",
    to: [process.env.WAITLIST_RECIPIENT_EMAIL ?? "daniel@jazlab.llc"],
    subject: `New waitlist signup: ${app}`,
    text: `${email} joined the ${app} waitlist.`,
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return { status: "success", message: "You're on the list! We'll be in touch." };
}
```

```typescript
// src/components/WaitlistForm.tsx
"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/actions/waitlist";

const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm({ appSlug }: { appSlug: string }) {
  const [state, formAction, isPending] = useActionState(joinWaitlist, initialState);

  if (state.status === "success") {
    return (
      <p className="text-teal font-body">{state.message}</p>
    );
  }

  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="app" value={appSlug} />
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        className="..."
        disabled={isPending}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? "Joining..." : "Join Waitlist"}
      </button>
      {state.status === "error" && (
        <p className="text-destructive text-sm">{state.message}</p>
      )}
    </form>
  );
}
```

**Static compatibility:** Server Actions work with statically pre-rendered pages (`generateStaticParams`). The page renders as `●` (SSG) — only the action endpoint runs dynamically when submitted.

### Pattern 5: Per-App Visual Accent

**What:** Each experiment has an `accentColor` hex in `lib/experiments.ts`. Pass it as a CSS custom property inline style to the hero section for per-app theming without conditional class names.

```tsx
// In [slug]/page.tsx
<section
  style={{ "--app-accent": experiment.accentColor } as React.CSSProperties}
  className="border-t-4"
  // Tailwind can't reference CSS vars in utilities, but inline works
>
```

Or use Tailwind arbitrary values:
```tsx
<div style={{ borderColor: experiment.accentColor }} className="border-t-4" />
```

The per-app accent colors from `globals.css` @theme:
- BlockAbye: `#FF7B9C` (warm rose) → `bg-blockabye` utility available
- Brickify: `#FF9843` (bright amber) → `bg-brickify` utility available
- Sournal: `#9B8AFB` (soft lavender) → `bg-sournal` utility available

Use the Tailwind token utilities (`bg-blockabye`, `text-brickify`, etc.) in the marketing page hero sections since they already exist in the `@theme` block.

### Anti-Patterns to Avoid

- **Animating layout properties:** Never `motion.div` with `height`, `width`, `top`, `left` — use `y`/`x`/`opacity` transforms only (GPU-composited).
- **"use client" on page files:** Keep `app/page.tsx` and `app/experiments/[slug]/page.tsx` as Server Components. Isolate "use client" to wrapper components only.
- **Database in a static site:** Do not add a database for waitlist. Resend receives the email directly; the owner gets notified and manages signups in Resend's audience dashboard.
- **External particle library:** tsParticles/particles-bg add 100-200KB+ to bundle. Custom canvas hook is 50 lines with zero weight.
- **Animating on every scroll:** Use `viewport={{ once: true }}` to prevent re-animation on scroll-up (avoids animation fatigue and reduces JS work).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation with CSS only | Custom @keyframes + IntersectionObserver | Motion `whileInView` | Motion handles Intersection Observer, cancellation, and GPU compositing automatically |
| Email sending | Custom SMTP / nodemailer | Resend SDK | SMTP in serverless functions is unreliable; Resend is designed for this pattern |
| Form state management | Custom useState for pending/error/success | `useActionState` (React 19 built-in) | Built-in, handles concurrent transitions, no extra library |
| Scroll position tracking | scroll event listeners | Motion `viewport` / `useInView` | Intersection Observer-based, no scroll listeners (better performance) |
| CSS-in-JS per-app theming | styled-components or emotion | Tailwind token utilities + inline `borderColor` | Brand token utilities already exist in @theme; no runtime styling needed |

**Key insight:** Phase 3 is assembly, not invention. Every atomic problem (email, animation, form state, per-app color) has an established solution that the existing stack already supports or a single small package provides.

---

## Common Pitfalls

### Pitfall 1: Canvas z-index Conflict with Noise Texture
**What goes wrong:** The `body::before` noise layer is at `z-index: 0`. A canvas particle background also at `z-index: 0` will fight with it. `body > * { z-index: 1 }` in globals.css already applies to direct children, but the canvas needs to be `fixed` and behind page content.
**Why it happens:** The noise texture uses `position: fixed; z-index: 0`. Canvas needs similar treatment but must not cover interactive elements.
**How to avoid:** Canvas: `position: fixed; inset: 0; z-index: 0; pointer-events: none`. Noise body::before is already at z-index 0. Both coexist because they're both at z-index 0 in stacking context; the canvas renders on top of the noise since it's a DOM element after body::before pseudo-element.
**Warning signs:** Particles invisible (behind noise), or clicks blocked on cards (missing pointer-events: none).

### Pitfall 2: Motion Breaks Static Build
**What goes wrong:** Using `motion` hooks (`useScroll`, `useSpring`, `useMotionValue`) in a Server Component throws a "You're importing a component that needs useState" build error.
**Why it happens:** Motion hooks require the React runtime (client-side). Server Components don't have access to useState/useEffect.
**How to avoid:** Only use `motion.div` (and other motion primitives) inside files with `"use client"`. Keep page files as Server Components. Use the MotionWrapper pattern described above.
**Warning signs:** Build error mentioning "useState" or "useEffect not a function at server component".

### Pitfall 3: useActionState Signature Change
**What goes wrong:** Server Action function signature is `(prevState, formData)` when used with `useActionState`, but many tutorials show `(formData)` for direct form action use.
**Why it happens:** `useActionState` injects `prevState` as the first argument. If the action only accepts `formData`, the first argument received will be `prevState` (the initial state object) and the second will be `formData`.
**How to avoid:** Always write Server Actions for form use as `async function action(prevState: State, formData: FormData)` — include `prevState` even if not used.
**Warning signs:** `email` is always undefined or equal to the initial state object.

### Pitfall 4: Resend "from" Domain Restriction
**What goes wrong:** Using an unverified "from" domain in Resend causes email sending to fail silently or return an error.
**Why it happens:** Resend requires domain verification before sending from custom addresses. The free plan allows sending from `onboarding@resend.dev` without verification.
**How to avoid:** For the initial implementation, use `onboarding@resend.dev` as the `from` address (Resend's verified testing address). Owner sets up domain verification in a follow-up. Alternatively, send TO owner's email FROM the Resend testing domain with the user's email in the body.
**Warning signs:** `error.message: "The gmail.com domain is not verified"` or similar Resend API errors.

### Pitfall 5: BentoGrid Already Hardcoded to experiments.map()
**What goes wrong:** `BentoGrid.tsx` currently imports `experiments` directly and renders all of them. On the homepage, this is correct. But the same component cannot be reused on individual app pages without modification.
**Why it happens:** BentoGrid is a standalone data-driven component, not a presentational component.
**How to avoid:** BentoGrid is used only on the homepage. The individual app marketing pages (`[slug]/page.tsx`) build their own layout from `experiment.features` array — they do not use BentoGrid.
**Warning signs:** Trying to pass a single experiment to BentoGrid and seeing all three cards rendered.

### Pitfall 6: Motion + React 19 Peer Dependency Warning
**What goes wrong:** `npm install motion` may print a peer dependency warning with React 19 since older versions of motion listed `"peerDependencies": { "react": "^18.0.0" }`.
**Why it happens:** Motion 12.x added React 19 support but npm still shows warnings based on the declared peer range.
**How to avoid:** Motion 12.x is compatible with React 19 at runtime. The warning is cosmetic. Use `npm install motion --legacy-peer-deps` only if npm refuses to install; do not downgrade React.
**Warning signs:** `npm error ERESOLVE could not resolve` — add `--legacy-peer-deps` flag only if this hard error occurs.

---

## Code Examples

Verified patterns from official sources and project-established conventions:

### Staggered Scroll Reveal for BentoGrid Section
```tsx
// Source: motion.dev/docs/react-motion-component + staticmania.com/blog/add-scroll-based-animations-nextjs-motion-dev
"use client";

import { motion } from "motion/react";
import { ExperimentCard } from "@/components/ExperimentCard";
import { experiments } from "@/lib/experiments";

export function AnimatedBentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[280px] gap-4">
      {experiments.map((experiment, index) => (
        <motion.div
          key={experiment.slug}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.5, delay: index * 0.12 }}
          className={index === 0 ? "md:col-span-1 lg:col-span-2" : undefined}
        >
          <ExperimentCard experiment={experiment} featured={index === 0} />
        </motion.div>
      ))}
    </div>
  );
}
```

### Hero Section Entrance Animation
```tsx
// Source: motion.dev/docs/react-animation
"use client";
import { motion } from "motion/react";

export function HeroHeadline({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### Per-App Accent Color Pattern
```tsx
// Source: established project pattern — globals.css @theme has --color-blockabye etc.
// app/experiments/[slug]/page.tsx (Server Component)

// Map slug to Tailwind token class
const ACCENT_CLASSES: Record<string, string> = {
  blockabye: "border-blockabye text-blockabye",
  brickify:  "border-brickify text-brickify",
  sournal:   "border-sournal text-sournal",
};

// Use in JSX:
<div className={`border-t-4 ${ACCENT_CLASSES[experiment.slug] ?? "border-violet"}`}>
  {/* hero content */}
</div>
```

### WaitlistForm useActionState Pattern
```tsx
// Source: resend.com/docs/send-with-nextjs + react.dev/reference/react/useActionState
"use client";
import { useActionState } from "react";
import { joinWaitlist } from "@/actions/waitlist";

const initial = { status: "idle" as const };

export function WaitlistForm({ appSlug }: { appSlug: string }) {
  const [state, formAction, isPending] = useActionState(joinWaitlist, initial);

  if (state.status === "success") {
    return <p className="text-teal">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-3 mt-6">
      <input type="hidden" name="app" value={appSlug} />
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        disabled={isPending}
        className="flex-1 bg-surface-raised border border-border rounded-md px-4 py-2 text-text-primary placeholder:text-text-muted"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-violet text-text-primary rounded-md px-6 py-2 font-display font-semibold hover:bg-violet/80 transition-colors disabled:opacity-50"
      >
        {isPending ? "Joining..." : "Join Waitlist"}
      </button>
      {state.status === "error" && (
        <p className="text-destructive text-sm mt-2">{state.message}</p>
      )}
    </form>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, import from `motion/react` | Motion v11 (2024) | Same API, smaller bundle; `framer-motion` still works as alias but motion is canonical |
| `useFormState` (React 18 experimental) | `useActionState` (React 19 stable) | React 19 GA (2024) | Built-in to React 19; no separate react-dom/server import needed |
| Client-side `fetch` to API route for forms | Server Actions (`"use server"`) | Next.js 14+ | No separate API route file; action co-located with page or in `actions/` directory |
| `bg-gradient-to-r` Tailwind class | `bg-linear-to-r` | Tailwind v4 | Already established in project — critical not to regress |
| `particles.js` library | Custom canvas hook or tsParticles | ~2022 | particles.js abandoned; tsParticles is successor but heavy; custom is lightest |

**Deprecated/outdated:**
- `useFormState`: Replaced by `useActionState` in React 19 — do not use `useFormState`
- `framer-motion` package name: Still works (re-exports `motion`) but `npm install motion` is the canonical install going forward
- `bg-gradient-to-r`: Tailwind v3 syntax — use `bg-linear-to-r` (established in project, tested in gradient-heading.test.ts)

---

## Open Questions

1. **Resend API key / "from" domain for waitlist**
   - What we know: Resend requires a verified sending domain for custom `from` addresses. `onboarding@resend.dev` works without verification on the free plan.
   - What's unclear: Whether `jazlab.llc` domain verification will be set up before Phase 3 execution.
   - Recommendation: Use `onboarding@resend.dev` in the initial implementation with a TODO comment. The planner should include an "env setup" task that documents `RESEND_API_KEY` and `WAITLIST_RECIPIENT_EMAIL` as required environment variables.

2. **Email service selection: STATE.md says "evaluate Resend vs. Loops vs. Mailchimp in Phase 3"**
   - What we know: All three work. Resend has the cleanest Next.js Server Action integration. Loops is designed for SaaS (audience management, sequences). Mailchimp has a more complex API.
   - What's unclear: Whether Daniel wants Loops' audience-building features (marketing sequences, etc.) vs. simple notification.
   - Recommendation: Default to Resend for simplicity. If Daniel wants automated email sequences later, migrate to Loops. The Server Action interface is the same — only the SDK changes.

3. **Cosmic particle density on mobile**
   - What we know: Canvas performance on mobile varies. 120 particles at 60fps is fine on modern phones but may cause frame drops on older budget devices.
   - What's unclear: Target device profile.
   - Recommendation: Reduce `PARTICLE_COUNT` to 60 on mobile using `window.matchMedia("(max-width: 768px)")` inside the useEffect.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | jazlab-hub/vitest.config.ts |
| Quick run command | `cd jazlab-hub && npm run test:run` |
| Full suite command | `cd jazlab-hub && npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRAND-01 | Homepage renders hero section with logo img, h1 headline, and CTA link | file-read | `cd jazlab-hub && npm run test:run -- tests/homepage.test.ts` | ❌ Wave 0 |
| SHOW-01 | Homepage renders BentoGrid (or AnimatedBentoGrid) component | file-read | `cd jazlab-hub && npm run test:run -- tests/homepage.test.ts` | ❌ Wave 0 |
| SHOW-03 | ParticleBackground component exists with canvas, requestAnimationFrame, "use client" | file-read | `cd jazlab-hub && npm run test:run -- tests/particle-background.test.ts` | ❌ Wave 0 |
| SHOW-04 | MotionWrapper or AnimatedBentoGrid has "motion/react" import, whileInView, viewport | file-read | `cd jazlab-hub && npm run test:run -- tests/motion-wrapper.test.ts` | ❌ Wave 0 |
| APP-01 | Experiment slug page renders hero, features section, and CTA link | file-read | `cd jazlab-hub && npm run test:run -- tests/experiment-page.test.ts` | ❌ Wave 0 |
| APP-02 | WaitlistForm has useActionState import, form element, email input, success/error states | file-read | `cd jazlab-hub && npm run test:run -- tests/waitlist-form.test.ts` | ❌ Wave 0 |
| APP-02 | waitlist.ts Server Action has "use server", Resend import, prevState+formData signature | file-read | `cd jazlab-hub && npm run test:run -- tests/waitlist-action.test.ts` | ❌ Wave 0 |
| APP-03 | Experiment slug page references experiment.accentColor or per-app Tailwind token | file-read | `cd jazlab-hub && npm run test:run -- tests/experiment-page.test.ts` | ❌ Wave 0 |
| SEO-03 | BentoGrid or page uses responsive Tailwind breakpoint classes (md:, lg:) | file-read | `cd jazlab-hub && npm run test:run -- tests/homepage.test.ts` | ❌ Wave 0 |
| ALL | `npm run build` exits 0, all pages remain ○ or ●, no λ pages | build | `cd jazlab-hub && npm run build` | ❌ Wave 0 (manual) |

### Sampling Rate
- **Per task commit:** `cd jazlab-hub && npm run test:run`
- **Per wave merge:** `cd jazlab-hub && npm run test:run`
- **Phase gate:** Full suite green + `npm run build` static-only before `/gsd:verify-work`

### Wave 0 Gaps

All phase-3-specific test files need to be created as part of the first task:

- [ ] `jazlab-hub/tests/homepage.test.ts` — covers BRAND-01, SHOW-01, SEO-03
- [ ] `jazlab-hub/tests/particle-background.test.ts` — covers SHOW-03
- [ ] `jazlab-hub/tests/motion-wrapper.test.ts` — covers SHOW-04
- [ ] `jazlab-hub/tests/experiment-page.test.ts` — covers APP-01, APP-03
- [ ] `jazlab-hub/tests/waitlist-form.test.ts` — covers APP-02 (client component)
- [ ] `jazlab-hub/tests/waitlist-action.test.ts` — covers APP-02 (server action)

Existing test infrastructure (Vitest config, path aliases, file-read pattern) fully covers all test needs — no framework or config gaps.

---

## Sources

### Primary (HIGH confidence)
- motion.dev/docs/react — Motion package import paths, whileInView, viewport API
- motion.dev/docs/react-installation — npm package is `motion`, import from `motion/react`
- resend.com/docs/send-with-nextjs — Server Action pattern, `{ data, error }` return, useActionState integration
- react.dev/reference/react/useActionState — useActionState hook signature `(action, initialState)` returns `[state, formAction, isPending]`
- Project SUMMARY files (01-01, 01-02, 02-01, 02-02) — established patterns, existing components, test conventions

### Secondary (MEDIUM confidence)
- staticmania.com/blog/add-scroll-based-animations-nextjs-motion-dev — whileInView + viewport once:true verified against motion.dev docs
- dev.to/sushilmagare10/animate-like-a-pro-creating-a-reusable-motiondiv-using-motion-1h7i — MotionWrapper pattern with HTMLMotionProps

### Tertiary (LOW confidence)
- blog.designly.biz (blocked 403) — Canvas starfield React pattern referenced from search snippet only; code above is synthesized from known canvas/React patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — motion, resend, useActionState all verified against official docs; package versions from npm search
- Architecture: HIGH — patterns follow established project conventions (file-read tests, Server Component preference, static-first)
- Pitfalls: HIGH — z-index/canvas conflict verified against existing globals.css; useActionState signature verified against React 19 docs; Resend domain restriction verified against Resend docs
- Particle animation: MEDIUM — custom canvas pattern synthesized from React/Canvas fundamentals; no single official source, but pattern is standard

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (Motion and Resend APIs are stable; 30-day window appropriate)
