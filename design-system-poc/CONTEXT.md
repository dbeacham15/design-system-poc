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

## POC Scope

**Stack:** Vite + React + TypeScript + Storybook  
**First component:** Button  
**Figma design:** To be created by the designer before the pipeline runs  
**PR target:** This monorepo (`main` branch)  
**Directory:** `/Users/dbeacham/Development/design-system-poc/`
