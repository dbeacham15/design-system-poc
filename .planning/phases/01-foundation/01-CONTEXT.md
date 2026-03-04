# Phase 1: Foundation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Next.js 16 project scaffolded with Tailwind v4 brand tokens, dark theme wired, and experiments data model defined. The project runs locally with the JazLab brand system in place and every downstream phase can build on it without revisiting setup.

Requirements covered: BRAND-04 (consistent brand system), BRAND-07 (noise/grain texture).

</domain>

<decisions>
## Implementation Decisions

### Experiment Data Model
- Each experiment has its own accent color for visual identity (not shared brand palette)
- Three-tier status system: Active / Beta / Coming Soon
- Current statuses: BlockAbye = Beta, Brickify = Beta, Sournal = Coming Soon
- Feature lists use rich feature objects: `{title, description, icon}` per feature
- Model includes: slug, name, description, status, subdomain URL, accent color, and feature list

### Noise/Grain Texture
- Barely-there intensity (5-8% opacity) — subconscious depth, not visible noise
- Applied to page background (#0F1117) only — cards and panels stay clean/smooth
- Static texture, no animation
- Creates natural surface hierarchy: textured base → smooth elevated surfaces

### Typography System
- Three-font system:
  - **Display font** (headings): Geometric sans — Space Grotesk or Outfit style, technical/lab feel
  - **Body font**: Inter — clean, readable
  - **Mono accents**: JetBrains Mono or similar — for status badges, technical labels, "lab" terminology
- Hero heading weight: Extrabold (800) — punchy, works well with gradient text treatment

### Token Naming Convention
- **Hybrid approach**: semantic names for surfaces/text, literal names for brand colors
- Surface tokens: `surface`, `surface-raised`, `surface-overlay`, `border`
- Text tokens: `text-primary`, `text-secondary`, `text-muted`
- Brand color tokens: `violet`, `teal`, `cyan`, `sparkle` (literal names)
- Per-app accent tokens named by app: `blockabye`, `brickify`, `sournal`
- Pre-defined gradient tokens as CSS custom properties (e.g., `--gradient-brand`, `--gradient-accent`)
- shadcn/ui CSS variables wired to JazLab tokens in this phase — components brand-ready for Phase 2

### Claude's Discretion
- Grain pattern type (film grain vs digital noise — match cosmic lab aesthetic)
- Specific display font selection (Space Grotesk vs Outfit vs similar)
- Specific monospace font selection
- Per-app accent color values (colors that complement the violet/teal palette on dark backgrounds)
- shadcn/ui variable mapping details
- Gradient direction and exact stops

</decisions>

<specifics>
## Specific Ideas

- Cosmic laboratory aesthetic — deep space meets tech lab
- Logo described as dog silhouette + lab flask with sparkle accents (SVG integration in future phases)
- Reference mockup: centered layout, teal/cyan glowing card borders, perspective grid lines at bottom edge
- "Experiments currently running:" with active/status badges — monospace accents reinforce the lab identity here

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing JazLab codebase — greenfield project
- Sibling projects in ~/Development (blockabye, brickify, sournal) can be referenced for app descriptions and feature lists

### Established Patterns
- No prior patterns — this phase establishes all conventions for downstream phases

### Integration Points
- `lib/experiments.ts` will be the single data source consumed by Phase 2 components and Phase 3 pages
- Tailwind v4 custom properties will be the design token interface for all future UI work
- shadcn/ui theme variables bridge brand tokens to component library

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-03*
