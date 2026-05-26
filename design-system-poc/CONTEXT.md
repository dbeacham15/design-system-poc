# Design System POC

A proof-of-concept validating a Figma-driven component pipeline: a designer provides a Figma link, the design is read via Figma MCP, ambiguities are resolved through a grill session, a component is built, and a PR is created on designer approval.

## Language

### System

**Design Pipeline**:
The end-to-end automated workflow: Figma link in → Figma MCP reads design → Grill Session resolves props → component built → CLI Approval → PR created.
_Avoid_: "the workflow" (too generic), "the automation"

**Living Design System**:
A component library where Figma is the authoritative source of truth. Components are generated from Figma designs, not written from scratch. The client-facing surface is Storybook.
_Avoid_: "design system" alone when referring to this project — always "Living Design System" to distinguish from generic design systems

**Component**:
A Storybook-renderable React component (TypeScript) built from a Figma design. Its props, variants, and states are determined by the Figma design plus the Grill Session output.
_Avoid_: "widget" (different concept), "element"

### Pipeline stages

**Grill Session**:
The Claude-driven Q&A between the pipeline and the designer. Fires after Figma MCP reads the design. Surfaces ambiguities (which props are required? what states exist? what are valid values?) and resolves them into a concrete prop surface before any code is written.
_Avoid_: "interview", "questionnaire" (implies static form — the Grill Session is interactive and dynamic)

**CLI Approval**:
The designer's `y/n` prompt after viewing the built component in Storybook. A `y` triggers PR creation to the monorepo targeting `main`. A `n` returns to the build step.
_Avoid_: "designer sign-off", "review" (use only for the GitHub PR review step, not this prompt)

**Figma MCP**:
The official Figma MCP server (`@figma/mcp`) that reads Figma design nodes given a Figma URL. The authoritative source of design token values, component structure, and variant definitions.
_Avoid_: "Figma API" (the MCP wraps the API — reference the MCP, not the raw API)

## Relationships

- The **Design Pipeline** begins with a Figma URL and ends with a GitHub PR.
- **Figma MCP** feeds design structure into the **Grill Session**.
- The **Grill Session** produces a resolved prop surface that determines the **Component** API.
- The **Component** is previewed in Storybook before **CLI Approval**.
- **CLI Approval** (`y`) triggers PR creation; (`n`) loops back to the build step.

### Pipeline UI

**Pipeline UI**:
The web application designers use to run the Design Pipeline. A standalone Next.js app co-located in the monorepo at `apps/pipeline-ui/`. Hosts the Grill Session chat interface, Prop Surface Review, Storybook Preview iframe, and Approval controls.
_Avoid_: "admin panel", "dashboard" (implies reporting/monitoring — the Pipeline UI is an active pipeline orchestrator)

**Grill Session Chat**:
The chat interface inside the Pipeline UI where Claude conducts the full Grill Session — from the designer's opening intent through to the resolved prop surface. One continuous conversation under a single system prompt; no phase switch mid-conversation. Backed by the Anthropic API (claude-sonnet-4-6) with custom streaming. Conversation history is preserved across the Build → Approval → Request Changes loop.
_Avoid_: "chatbot" (implies open-ended Q&A — the Grill Session Chat is structured and goal-directed); "landing chat" vs "grill chat" (there is only one chat, one conversation)

**Prop Surface Review**:
The Pipeline UI screen where Claude presents the resolved component API (prop names, types, defaults) before any code is written. The designer confirms or requests changes. A confirmed Prop Surface triggers the Build step.
_Avoid_: "API review", "type review"

**Build Step**:
The Pipeline UI state where the Next.js API route writes component files to disk (`src/components/<Name>/`), runs `npm test` via `child_process`, and commits via `git`. Runs on the designer's local machine (local-first). Initiated after Prop Surface Review is confirmed.
_Avoid_: "code generation", "scaffolding" (the Build Step includes testing and committing, not just file generation)

**Storybook Preview**:
The Pipeline UI screen showing an iframe of Storybook (`localhost:6006`) pointed at the newly built component story. Storybook is auto-started by the API route if not already running. The designer reviews all variants here before Approval.
_Avoid_: "component preview" (use Storybook Preview to be specific about the iframe mechanism)

**Approval**:
The Pipeline UI controls after Storybook Preview: "Looks good" (triggers PR creation) or "Request changes" (returns to Grill Session Chat with preserved context and feedback pre-seeded). Replaces the CLI y/n from the terminal pipeline.
_Avoid_: "sign-off", "CLI Approval" (CLI Approval refers to the terminal-based predecessor)

**Landing Screen**:
The idle-mode view of the Grill Session Chat when no conversation has started. Shows a centered tagline ("What do you want to build today?"), a text input, and suggestion chips. No message is sent to Claude until the designer submits. Submitting transitions the view to the chat thread and sends the designer's message as the first turn — Claude responds and the Grill Session begins.
_Avoid_: "home page", "welcome screen" (implies a static view — the Landing Screen is an active entry point into the pipeline); treating it as a separate component from the Grill Session Chat (it is the idle mode of the same component)

**Component Sidebar**:
The collapsible left rail in the Pipeline UI. Collapsed state: a 48px icon rail with icons for new session, component library, and tokens. Expanded state: ~240px list with a "Tokens" nav link, built component names, and a theme toggle in the footer. Collapsed by default; opens by default when navigating to the Token Reference Page. The embedded `TokenPanel` has been removed — tokens live on their own page.
_Avoid_: "component browser", "nav" (the Component Sidebar is specifically the component list, not general navigation)

**Token Reference Page**:
The Pipeline UI page at `/tokens`. A full-panel reference view of all design tokens in the system, grouped by category: color (large swatches with CSS variable name and computed hex), typography (text rendered at each size), spacing (proportional visual bars), and border-radius. Reached via the Component Sidebar. The AppShell wraps it — the Component Sidebar is present and expanded by default. Theme switching is done via the sidebar footer toggle (application-level), and token values update live as the theme changes.
_Avoid_: "token panel" (the old embedded sidebar widget), "token page" (use Token Reference Page)

**Pipeline Session**:
A persistent record of one end-to-end pipeline run — from the designer's first input through to the PR (or abandonment). Identified by a UUID. Stored in SQLite at `apps/pipeline-ui/data/pipeline.db`. Carries status: `active` (in progress), `completed` (PR created), `failed` (hard error, reason stored), or `abandoned` (detected on next app load). Stores the full Grill Session chat history, Figma design data, prop surface, and pipeline stage so the session can be fully resumed. A Grill Session is the conversation phase *inside* a Pipeline Session.
_Avoid_: "chat session", "conversation" (too generic — a Pipeline Session spans the full pipeline run, not just the chat)

## Token System

**Token Manifest**:
The file `tokens.json` at the repo root. The single source of truth for all design tokens. Drives two outputs: (1) `src/tokens.css` (the generated CSS file containing all custom properties), and (2) the token vocabulary injected into `buildCodegenPrompt` so Claude references token names instead of hardcoded values.
_Avoid_: "token config", "design tokens file"

**Primitive Token**:
A CSS custom property that names a raw design value — e.g. `--blue-500: #3b82f6`. Lives in `:root`. Components never reference primitive tokens directly.
_Avoid_: "base token", "raw token"

**Semantic Token**:
A CSS custom property that aliases a primitive and carries design intent — e.g. `--color-interactive: var(--blue-500)`. Components reference only semantic tokens. Theme overrides redefine semantic tokens only; primitives are never changed by a theme.
_Avoid_: "alias token", "theme token"

**Token Theme**:
A set of semantic token overrides scoped to a named theme. Applied via `@media (prefers-color-scheme: dark)` as the OS-respecting default, with `[data-theme="light"]` and `[data-theme="dark"]` attribute overrides for explicit control. Token themes redefine semantic tokens only — primitives are shared across all themes.
_Avoid_: "color scheme", "dark mode vars"

**Token Categories**:
The four categories of semantic tokens in the POC: **color** (interactive, surface, text, border, status states), **spacing** (sm/md/lg/xl scale), **typography** (font-size, font-weight, line-height), **border-radius** (sm/md/lg/full). Shadow and motion tokens are out of scope for the POC.
_Avoid_: listing specific token names in this glossary — see `tokens.json`

## POC Scope

**Component library stack:** Vite + React + TypeScript + Storybook  
**Pipeline UI stack:** Next.js 15 + React 19 + TypeScript + Vercel AI SDK  
**First component:** Button (complete)  
**PR target:** This monorepo (`main` branch)  
**Directory:** `/Users/dbeacham/Development/design-system-poc/`  
**Apps layout:** `apps/pipeline-ui/` (Pipeline UI), root = component library  
**Config:** `FIGMA_TOKEN` + `ANTHROPIC_API_KEY` in `apps/pipeline-ui/.env.local`  
**Auth:** Out of scope for POC
