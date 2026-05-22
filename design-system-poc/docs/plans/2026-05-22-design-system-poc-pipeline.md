# Design System POC — Figma-Driven Component Pipeline

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a proof-of-concept pipeline that reads a Figma Button design, grills the designer about component props, builds a typed React component, previews it in Storybook, and creates a PR on designer approval — proving the end-to-end pipeline is viable.

**Architecture:** Vite + React + TypeScript project with Storybook as the component showcase. The pipeline is a Claude Code skill (`.claude/skills/design-from-figma.md`) that orchestrates: Figma MCP reads design → Claude grills designer about props → Claude writes component + story + test → user previews in Storybook → CLI y/n → `gh pr create`. No custom scripts. The pipeline IS a Claude Code session.

**Tech Stack:** Vite 5, React 19, TypeScript 5, Storybook 8, Vitest + React Testing Library, official Figma MCP (`@figma/mcp`), GitHub CLI (`gh`)

---

## Phase 1 — Project Scaffold

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `design-system-poc/package.json` (via `npm create vite`)
- Create: `design-system-poc/vite.config.ts`
- Create: `design-system-poc/tsconfig.json`
- Create: `design-system-poc/src/main.tsx`

**Step 1: Scaffold the project**

Run from `/Users/dbeacham/Development/design-system-poc/`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted "Current directory is not empty. Remove existing files and continue?" — answer `y` (only `CONTEXT.md` and `docs/` are there, they won't be overwritten by Vite, but the prompt may appear).

**Step 2: Install dependencies**
```bash
npm install
```
Expected: `node_modules/` created, no errors.

**Step 3: Verify dev server starts**
```bash
npm run dev
```
Expected: `VITE v5.x.x ready` at `http://localhost:5173`. Stop with `ctrl+c`.

**Step 4: Delete Vite boilerplate we don't need**
```bash
rm src/App.css src/assets/react.svg public/vite.svg
```

Replace `src/App.tsx` with a minimal placeholder:
```tsx
export function App() {
  return <div>Design System POC</div>
}
```

Replace `src/index.css` with:
```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: sans-serif; }
```

**Step 5: Commit**
```bash
git add design-system-poc/
git commit -m "feat(design-system-poc): scaffold Vite + React + TypeScript project"
```

---

### Task 2: Install Vitest + React Testing Library

**Files:**
- Modify: `design-system-poc/vite.config.ts`
- Modify: `design-system-poc/package.json`
- Create: `design-system-poc/src/test/setup.ts`

**Step 1: Install test dependencies**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 2: Update `vite.config.ts`**
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

**Step 3: Create `src/test/setup.ts`**
```ts
import '@testing-library/jest-dom'
```

**Step 4: Add test script to `package.json`**

Add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Write a sanity-check test**

Create `src/test/sanity.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { App } from '../App'

test('renders without crashing', () => {
  render(<App />)
  expect(screen.getByText('Design System POC')).toBeInTheDocument()
})
```

**Step 6: Run the test and verify it passes**
```bash
npm test
```
Expected: `1 passed`.

**Step 7: Commit**
```bash
git add design-system-poc/
git commit -m "feat(design-system-poc): add Vitest + React Testing Library"
```

---

### Task 3: Install and configure Storybook

**Files:**
- Create: `design-system-poc/.storybook/main.ts`
- Create: `design-system-poc/.storybook/preview.ts`
- Modify: `design-system-poc/package.json`

**Step 1: Initialize Storybook**

Run from `design-system-poc/`:
```bash
npx storybook@latest init --type react
```
When asked about ESLint plugin: `y`. When asked about onboarding: skip.

Expected: `.storybook/` directory created, example stories added in `src/stories/`.

**Step 2: Delete example stories — we don't need them**
```bash
rm -rf src/stories/
```

**Step 3: Verify Storybook starts**
```bash
npm run storybook
```
Expected: Storybook opens at `http://localhost:6006`. It will show an empty sidebar (no stories yet — that's correct). Stop with `ctrl+c`.

**Step 4: Commit**
```bash
git add design-system-poc/
git commit -m "feat(design-system-poc): add Storybook 8"
```

---

## Phase 2 — Figma MCP Configuration

### Task 4: Configure the official Figma MCP

**Context:** The official Figma MCP is a remote HTTP server run by Figma. It does not require a local install — only a Figma API token and a one-time Claude Code configuration.

**Step 1: Get your Figma API token**

1. Open [figma.com](https://figma.com) → Profile → Settings → Security
2. Under "Personal access tokens", click "Generate new token"
3. Name it `design-system-poc`, set expiry as desired
4. Copy the token — you will not see it again

**Step 2: Add the Figma MCP to Claude Code**

Run from anywhere:
```bash
claude mcp add --transport http figma "https://mcp.figma.com/v1/figma" \
  --header "X-Figma-Token: YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the token from step 1.

> **Note:** If the above command syntax differs from what your Claude Code version supports, check `claude mcp --help` for the correct flags. The key values are: transport = `http`, server URL = `https://mcp.figma.com/v1/figma`, header = `X-Figma-Token: <token>`.

**Step 3: Verify the MCP is registered**
```bash
claude mcp list
```
Expected: `figma` appears in the list.

**Step 4: Smoke-test the MCP**

Open a Claude Code session and ask:
```
Use the Figma MCP to describe the top-level nodes at this URL: [paste any Figma file URL you have access to]
```
Expected: Claude returns a description of the Figma nodes. If it errors, re-check the token and transport configuration.

---

## Phase 3 — The Pipeline Skill

### Task 5: Create the pipeline skill

**Context:** The pipeline is a Claude Code skill. When triggered with a Figma URL, it orchestrates the full workflow: read design → grill designer → build component → preview → approve → PR. No shell scripts. Claude is the pipeline executor.

**Files:**
- Create: `design-system-poc/.claude/skills/design-from-figma.md`
- Create: `design-system-poc/CLAUDE.md`

**Step 1: Create the skill directory**
```bash
mkdir -p design-system-poc/.claude/skills
```

**Step 2: Create `design-system-poc/.claude/skills/design-from-figma.md`**

```markdown
# design-from-figma

Triggered when user provides a Figma URL and wants to build a component from it.

## Pipeline

Execute these steps in order. Do not skip steps. Do not ask "should I continue?" between steps — just execute.

### Step 1 — Read the Figma design

Use the Figma MCP to read the design at the provided URL. Collect:
- Component name
- All visible variants (e.g. Primary, Secondary, Ghost)
- All visible sizes
- All visible states (default, hover, focus, disabled, loading)
- Color tokens used
- Typography used
- Any icons or slots

### Step 2 — Grill the designer

Ask the designer ONE question at a time. Wait for the answer before continuing.
Resolve every ambiguity before writing any code.

Required questions to ask (adapt wording based on what Figma already answered):
1. Is there a `loading` state (spinner replaces content)? If yes, what triggers it?
2. Can the button render with only an icon (no label)? What size is the icon?
3. Is `onClick` always required, or can the button be used as a `<button type="submit">`?
4. Are there additional variants not shown in Figma (e.g. destructive/danger)?
5. What happens on mobile / small screens — does size behavior change?
6. Confirm the full list of valid `variant` values (exact strings, e.g. "primary" not "Primary").
7. Confirm the full list of valid `size` values (exact strings).

### Step 3 — Define the prop surface

Before writing code, state the resolved component API in this format and wait for confirmation:

```
Component: Button
Props:
  variant: "primary" | "secondary" | "ghost" [required]
  size: "sm" | "md" | "lg" [required]
  disabled?: boolean [default: false]
  loading?: boolean [default: false]
  iconOnly?: boolean [default: false]
  children: React.ReactNode [required unless iconOnly]
  onClick?: () => void
  type?: "button" | "submit" | "reset" [default: "button"]

Confirmed? (y to continue, or describe changes)
```

### Step 4 — Write the failing test first

Create `src/components/Button/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="primary" size="md">Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button variant="primary" size="md" onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button variant="primary" size="md" disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<Button variant="primary" size="md" disabled onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders as submit button when type is submit', () => {
    render(<Button variant="primary" size="md" type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
```

Run: `npm test`
Expected: FAIL — `Cannot find module './Button'`

### Step 5 — Build the component

Create `src/components/Button/Button.tsx` using the resolved prop surface and Figma color/size values.
Create `src/components/Button/index.ts` that re-exports Button.

Run: `npm test`
Expected: All 5 tests PASS.

### Step 6 — Write the Storybook story

Create `src/components/Button/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { variant: 'primary', size: 'md', children: 'Button' } }
export const Secondary: Story = { args: { variant: 'secondary', size: 'md', children: 'Button' } }
export const Ghost: Story = { args: { variant: 'ghost', size: 'md', children: 'Button' } }
export const Disabled: Story = { args: { variant: 'primary', size: 'md', disabled: true, children: 'Button' } }
export const Small: Story = { args: { variant: 'primary', size: 'sm', children: 'Button' } }
export const Large: Story = { args: { variant: 'primary', size: 'lg', children: 'Button' } }
```

### Step 7 — Preview in Storybook

Tell the designer:
```
Component built. Open Storybook to review:

  npm run storybook

Navigate to Button in the sidebar. Check all stories (Primary, Secondary, Ghost, Disabled, Small, Large).

When done reviewing, come back here and answer: does the component match the Figma design? [y/n]
```

Wait for response.

If `n`: Ask what's wrong. Fix. Re-run tests. Return to Step 7.

### Step 8 — CLI Approval and PR

If `y`:

1. Run tests one final time:
```bash
npm test
```
Expected: All pass.

2. Stage and commit:
```bash
git add design-system-poc/src/components/Button/
git commit -m "feat(design-system-poc): add Button component from Figma design"
```

3. Create the PR:
```bash
gh pr create \
  --title "feat(design-system-poc): Button component — Figma-driven pipeline POC" \
  --body "$(cat <<'EOF'
## Summary

- Proves the Figma → grill → build → Storybook → approve → PR pipeline end-to-end
- Button component built from Figma design via Figma MCP
- Props surface resolved through grill session with designer
- All variants (primary, secondary, ghost), sizes (sm, md, lg), and states (default, disabled) implemented

## Test plan

- [ ] All Vitest tests pass (`npm test`)
- [ ] Storybook renders all 6 stories without errors (`npm run storybook`)
- [ ] Button visually matches Figma design for all variants
- [ ] Disabled state is non-interactive

🤖 Generated via Figma-driven design pipeline
EOF
)"
```

4. Output the PR URL to the designer.
```

**Step 3: Create `design-system-poc/CLAUDE.md`**
```markdown
# Design System POC

Figma-driven component pipeline POC. Vite + React + TypeScript + Storybook.

## Pipeline

To build a component from a Figma design, provide the Figma URL and the `design-from-figma` skill will run automatically.

## Commands

\`\`\`bash
npm run dev          # Dev server (port 5173)
npm run storybook    # Storybook (port 6006)
npm test             # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
\`\`\`

## Structure

\`\`\`
src/
  components/
    Button/
      Button.tsx         # Component implementation
      Button.test.tsx    # Vitest tests
      Button.stories.tsx # Storybook stories
      index.ts           # Re-export
  test/
    setup.ts             # Testing Library setup
\`\`\`
```

**Step 4: Commit**
```bash
git add design-system-poc/
git commit -m "feat(design-system-poc): add pipeline skill and CLAUDE.md"
```

---

## Phase 4 — First Pipeline Run

### Task 6: Design the Button in Figma (designer step — not code)

**This task is manual. No code is written here.**

Before running the pipeline, the Figma design must exist. In Figma:

1. Create a new file named `Design System POC`
2. Create a component frame named `Button`
3. Add at minimum:
   - 3 variants: Primary (filled), Secondary (outlined), Ghost (text-only)
   - 3 sizes: Small (32px height), Medium (40px height), Large (48px height)
   - Disabled state (reduced opacity or greyed fill)
4. Apply real color values — don't use placeholder grey
5. Publish/share the file so the Figma MCP can read it (file must not be private-only)
6. Copy the file URL (format: `https://www.figma.com/design/...`)

When done, proceed to Task 7.

---

### Task 7: Run the pipeline end-to-end

**This task validates the full POC.**

**Step 1: Open Claude Code in the design-system-poc directory**
```bash
cd /Users/dbeacham/Development/design-system-poc
claude
```

**Step 2: Trigger the pipeline**

In the Claude Code session, say:
```
Here's the Figma URL for the Button component: [paste URL]
Build it using the design-from-figma pipeline.
```

**Step 3: Follow the pipeline**

Claude will:
1. Read the Figma design via Figma MCP
2. Grill you with questions — answer each one
3. Show you the resolved prop surface — confirm with `y`
4. Write the failing test
5. Write the component
6. Write the story
7. Ask you to open Storybook and review
8. Wait for your `y/n`
9. Commit + create PR

**Step 4: Verify the PR**

```bash
gh pr list
```
Expected: PR appears targeting `main` with the Button component.

**Step 5: Verify Storybook**
```bash
npm run storybook
```
Expected: Button appears in sidebar with all 6 stories rendering correctly.

**POC complete** when the PR exists and Storybook renders the Button.
