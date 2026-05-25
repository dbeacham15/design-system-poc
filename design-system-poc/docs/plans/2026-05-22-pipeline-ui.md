# Pipeline UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js 15 web UI at `apps/pipeline-ui/` so designers can run the Figma-driven component pipeline through a browser instead of the terminal.

**Architecture:** Next.js 15 App Router, local-first (not deployed). Designers paste a Figma URL → app reads design via Figma REST API → streams a Grill Session chat via Anthropic API (`claude-sonnet-4-6`) → designer confirms prop surface → API route generates component code, writes files to disk, runs tests, commits → Storybook is auto-started and shown in an iframe → designer approves → PR created via `gh pr create` from a feature branch cherry-picked from `main`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), `@anthropic-ai/sdk`, Vitest, React Testing Library, jsdom

---

## Phase 1 — Scaffold

### Task 1: Initialize Next.js 15 app

**Files:**
- Create: `apps/pipeline-ui/package.json`
- Create: `apps/pipeline-ui/next.config.ts`
- Create: `apps/pipeline-ui/tsconfig.json`
- Create: `apps/pipeline-ui/vitest.config.ts`
- Create: `apps/pipeline-ui/vitest.setup.ts`
- Create: `apps/pipeline-ui/app/layout.tsx`
- Create: `apps/pipeline-ui/.env.local` (gitignored)

**Step 1: Create the apps directory and scaffold Next.js**

Run from `/Users/dbeacham/Development/design-system-poc/`:
```bash
mkdir -p apps
cd apps && npx create-next-app@latest pipeline-ui --typescript --app --no-tailwind --no-src-dir --no-eslint --import-alias "@/*"
```

When prompted about Turbopack: Yes.

**Step 2: Install additional dependencies**

Run from `apps/pipeline-ui/`:
```bash
npm install ai @ai-sdk/anthropic
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 3: Create `apps/pipeline-ui/vitest.config.ts`**
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
})
```

**Step 4: Create `apps/pipeline-ui/vitest.setup.ts`**
```ts
import '@testing-library/jest-dom'
```

**Step 5: Add test scripts to `apps/pipeline-ui/package.json`**

Add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 6: Create `apps/pipeline-ui/.env.local`**
```
FIGMA_TOKEN=YOUR_FIGMA_TOKEN_HERE
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
COMPONENT_LIBRARY_PATH=../../
```

Verify `.env.local` is in `apps/pipeline-ui/.gitignore` (Next.js scaffold includes this by default).

**Step 7: Replace `apps/pipeline-ui/app/layout.tsx`**
```tsx
export const metadata = { title: 'Design System Pipeline' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f0f0f', color: '#f0f0f0', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
```

**Step 8: Verify the dev server starts**
```bash
npm run dev
```
Expected: Next.js ready at `http://localhost:3000`. Stop with ctrl+c.

**Step 9: Commit**

Run from `/Users/dbeacham/Development/design-system-poc/` (monorepo root):
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): scaffold Next.js 15 app"
```

---

## Phase 2 — Core Infrastructure

### Task 2: Pipeline state machine

**Files:**
- Create: `apps/pipeline-ui/lib/pipeline-state.ts`
- Create: `apps/pipeline-ui/lib/pipeline-state.test.ts`
- Create: `apps/pipeline-ui/lib/pipeline-context.tsx`

**Step 1: Write the failing test**

Create `apps/pipeline-ui/lib/pipeline-state.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createPipelineState, transition } from './pipeline-state'

describe('pipeline state machine', () => {
  it('starts at landing stage', () => {
    const state = createPipelineState()
    expect(state.stage).toBe('landing')
  })

  it('transitions landing → grill when figma read succeeds', () => {
    const state = createPipelineState()
    const next = transition(state, {
      type: 'FIGMA_READ',
      figmaUrl: 'https://figma.com/design/abc',
      componentName: 'Button',
      figmaDesign: { nodes: [] },
    })
    expect(next.stage).toBe('grill')
    expect(next.figmaUrl).toBe('https://figma.com/design/abc')
    expect(next.componentName).toBe('Button')
  })

  it('transitions grill → prop-review when prop surface ready', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    const next = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    expect(next.stage).toBe('prop-review')
    expect(next.propSurface).toEqual({ componentName: 'Button', props: [] })
  })

  it('transitions prop-review → building on BUILD_START', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    expect(transition(state, { type: 'BUILD_START' }).stage).toBe('building')
  })

  it('transitions building → preview on BUILD_SUCCESS', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    state = transition(state, { type: 'BUILD_START' })
    const next = transition(state, { type: 'BUILD_SUCCESS', commitSha: 'abc123', preBuildSha: 'def456', storyUrl: 'http://localhost:6006/?path=/story/button--primary' })
    expect(next.stage).toBe('preview')
    expect(next.commitSha).toBe('abc123')
    expect(next.preBuildSha).toBe('def456')
  })

  it('transitions preview → pr-created on APPROVED', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    state = transition(state, { type: 'BUILD_START' })
    state = transition(state, { type: 'BUILD_SUCCESS', commitSha: 'abc123', preBuildSha: 'def456', storyUrl: 'http://localhost:6006' })
    const next = transition(state, { type: 'APPROVED', prUrl: 'https://github.com/dbeacham15/design-system-poc/pull/2' })
    expect(next.stage).toBe('pr-created')
    expect(next.prUrl).toBe('https://github.com/dbeacham15/design-system-poc/pull/2')
  })

  it('transitions preview → grill on REQUEST_CHANGES and pre-seeds feedback message', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    state = transition(state, { type: 'BUILD_START' })
    state = transition(state, { type: 'BUILD_SUCCESS', commitSha: 'abc123', preBuildSha: 'def456', storyUrl: 'http://localhost:6006' })
    const next = transition(state, { type: 'REQUEST_CHANGES', feedback: 'The ghost variant needs a border' })
    expect(next.stage).toBe('grill')
    expect(next.messages.at(-1)?.content).toContain('ghost variant')
  })
})
```

**Step 2: Run to verify it fails**

Run from `apps/pipeline-ui/`:
```bash
npm test
```
Expected: FAIL — `Cannot find module './pipeline-state'`

**Step 3: Create `apps/pipeline-ui/lib/pipeline-state.ts`**
```ts
export type PipelineStage = 'landing' | 'grill' | 'prop-review' | 'building' | 'preview' | 'pr-created'

export interface FigmaDesign {
  nodes: unknown[]
}

export interface PropDefinition {
  name: string
  type: string
  required: boolean
  defaultValue: string | null
}

export interface PropSurface {
  componentName: string
  props: PropDefinition[]
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface PipelineState {
  stage: PipelineStage
  figmaUrl: string
  componentName: string
  figmaDesign: FigmaDesign | null
  messages: Message[]
  propSurface: PropSurface | null
  commitSha: string | null
  preBuildSha: string | null
  storyUrl: string | null
  prUrl: string | null
}

export type PipelineAction =
  | { type: 'FIGMA_READ'; figmaUrl: string; componentName: string; figmaDesign: FigmaDesign }
  | { type: 'PROP_SURFACE_READY'; propSurface: PropSurface }
  | { type: 'BUILD_START' }
  | { type: 'BUILD_SUCCESS'; commitSha: string; preBuildSha: string; storyUrl: string }
  | { type: 'APPROVED'; prUrl: string }
  | { type: 'REQUEST_CHANGES'; feedback: string }

export function createPipelineState(): PipelineState {
  return {
    stage: 'landing',
    figmaUrl: '',
    componentName: '',
    figmaDesign: null,
    messages: [],
    propSurface: null,
    commitSha: null,
    preBuildSha: null,
    storyUrl: null,
    prUrl: null,
  }
}

export function transition(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case 'FIGMA_READ':
      return { ...state, stage: 'grill', figmaUrl: action.figmaUrl, componentName: action.componentName, figmaDesign: action.figmaDesign }
    case 'PROP_SURFACE_READY':
      return { ...state, stage: 'prop-review', propSurface: action.propSurface }
    case 'BUILD_START':
      return { ...state, stage: 'building' }
    case 'BUILD_SUCCESS':
      return { ...state, stage: 'preview', commitSha: action.commitSha, preBuildSha: action.preBuildSha, storyUrl: action.storyUrl }
    case 'APPROVED':
      return { ...state, stage: 'pr-created', prUrl: action.prUrl }
    case 'REQUEST_CHANGES':
      return {
        ...state,
        stage: 'grill',
        messages: [
          ...state.messages,
          { role: 'user', content: `I reviewed the component in Storybook and want changes: ${action.feedback}` },
        ],
      }
    default:
      return state
  }
}
```

**Step 4: Run tests**
```bash
npm test
```
Expected: 7 tests PASS.

**Step 5: Create `apps/pipeline-ui/lib/pipeline-context.tsx`**
```tsx
'use client'
import { createContext, useContext, useReducer, ReactNode } from 'react'
import { createPipelineState, transition, PipelineState, PipelineAction } from './pipeline-state'

interface PipelineContextValue {
  state: PipelineState
  dispatch: (action: PipelineAction) => void
}

const PipelineContext = createContext<PipelineContextValue | null>(null)

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transition, undefined, createPipelineState)
  return <PipelineContext.Provider value={{ state, dispatch }}>{children}</PipelineContext.Provider>
}

export function usePipeline() {
  const ctx = useContext(PipelineContext)
  if (!ctx) throw new Error('usePipeline must be used inside PipelineProvider')
  return ctx
}
```

**Step 6: Commit**

Run from monorepo root:
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add pipeline state machine + React context"
```

---

### Task 3: Figma read API route

**Files:**
- Create: `apps/pipeline-ui/lib/figma.ts`
- Create: `apps/pipeline-ui/lib/figma.test.ts`
- Create: `apps/pipeline-ui/app/api/figma/route.ts`

**Step 1: Write the failing test**

Create `apps/pipeline-ui/lib/figma.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseFigmaFileKey } from './figma'

describe('parseFigmaFileKey', () => {
  it('extracts file key from figma.com/design URL', () => {
    expect(parseFigmaFileKey('https://www.figma.com/design/nZWd2gIdibUaIcmwUvy6qk/My-File?node-id=116-828'))
      .toBe('nZWd2gIdibUaIcmwUvy6qk')
  })

  it('extracts file key from figma.com/file URL', () => {
    expect(parseFigmaFileKey('https://www.figma.com/file/abc123XYZ/My-Design'))
      .toBe('abc123XYZ')
  })

  it('returns null for a non-Figma URL', () => {
    expect(parseFigmaFileKey('https://example.com/not-figma')).toBeNull()
  })
})
```

**Step 2: Run to verify it fails**
```bash
npm test
```
Expected: FAIL — `Cannot find module './figma'`

**Step 3: Create `apps/pipeline-ui/lib/figma.ts`**
```ts
export function parseFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/)
  return match?.[1] ?? null
}

export async function readFigmaNode(fileKey: string, nodeId: string, token: string): Promise<unknown> {
  const encodedNodeId = encodeURIComponent(nodeId)
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodedNodeId}&depth=3`,
    { headers: { 'X-Figma-Token': token } }
  )
  if (!res.ok) throw new Error(`Figma API error: ${res.status} ${res.statusText}`)
  return res.json()
}
```

**Step 4: Run tests**
```bash
npm test
```
Expected: 3 tests PASS.

**Step 5: Create `apps/pipeline-ui/app/api/figma/route.ts`**
```ts
import { NextRequest, NextResponse } from 'next/server'
import { parseFigmaFileKey, readFigmaNode } from '@/lib/figma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { figmaUrl, nodeId } = await req.json()

  const fileKey = parseFigmaFileKey(figmaUrl)
  if (!fileKey) return NextResponse.json({ error: 'Invalid Figma URL' }, { status: 400 })

  const token = process.env.FIGMA_TOKEN
  if (!token) return NextResponse.json({ error: 'FIGMA_TOKEN not configured' }, { status: 500 })

  try {
    const design = await readFigmaNode(fileKey, nodeId ?? '0:1', token)
    return NextResponse.json({ design })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

**Step 6: Commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add Figma read API route"
```

---

### Task 4: Grill Session streaming API route

**Files:**
- Create: `apps/pipeline-ui/lib/grill-prompt.ts`
- Create: `apps/pipeline-ui/lib/grill-prompt.test.ts`
- Create: `apps/pipeline-ui/app/api/chat/route.ts`

**Step 1: Write the failing test**

Create `apps/pipeline-ui/lib/grill-prompt.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildGrillSystemPrompt, extractPropSurface } from './grill-prompt'

describe('buildGrillSystemPrompt', () => {
  it('includes component name in prompt', () => {
    const prompt = buildGrillSystemPrompt('Button', '{}')
    expect(prompt).toContain('Button')
  })

  it('includes figma data in prompt', () => {
    const figmaData = JSON.stringify({ nodes: [{ name: 'Primary' }] })
    const prompt = buildGrillSystemPrompt('Button', figmaData)
    expect(prompt).toContain('Primary')
  })
})

describe('extractPropSurface', () => {
  it('extracts prop surface from a message containing a [PROP_SURFACE] block', () => {
    const message = `Here is the resolved surface:\n\n[PROP_SURFACE]\n{"componentName":"Button","props":[{"name":"variant","type":"\\"primary\\"","required":true,"defaultValue":null}]}\n[/PROP_SURFACE]`
    const result = extractPropSurface(message)
    expect(result).not.toBeNull()
    expect(result?.componentName).toBe('Button')
    expect(result?.props[0].name).toBe('variant')
  })

  it('returns null when no [PROP_SURFACE] block is present', () => {
    expect(extractPropSurface('No prop surface here')).toBeNull()
  })
})
```

**Step 2: Run to verify it fails**
```bash
npm test
```
Expected: FAIL — `Cannot find module './grill-prompt'`

**Step 3: Create `apps/pipeline-ui/lib/grill-prompt.ts`**
```ts
import type { PropSurface } from './pipeline-state'

export function buildGrillSystemPrompt(componentName: string, figmaData: string): string {
  return `You are a design system engineer grilling a designer to resolve the complete React TypeScript prop surface for a component.

Component name: ${componentName}

Figma design data:
${figmaData}

## Your job

Ask ONE question at a time. Wait for the answer before continuing.
Cover all of the following topics before finishing:
- All visual variants (exact lowercase string values, e.g. "primary" not "Primary")
- All sizes (exact string values)
- States: disabled, loading
- Icon support (left icon? icon-only mode?)
- onClick optional or required? type="submit" support?
- Any additional variants not shown in Figma (e.g. destructive/danger)
- Full-width option?

## When all ambiguities are resolved

Output the prop surface in this EXACT format — nothing after [/PROP_SURFACE]:

[PROP_SURFACE]
{"componentName":"${componentName}","props":[{"name":"variant","type":"\\"primary\\" | \\"secondary\\" | \\"ghost\\"","required":true,"defaultValue":null}]}
[/PROP_SURFACE]

Replace the example with the actual resolved props.`
}

export function extractPropSurface(message: string): PropSurface | null {
  const match = message.match(/\[PROP_SURFACE\]\s*([\s\S]*?)\s*\[\/PROP_SURFACE\]/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as PropSurface
  } catch {
    return null
  }
}
```

**Step 4: Run tests**
```bash
npm test
```
Expected: 4 tests PASS (+ all prior).

**Step 5: Create `apps/pipeline-ui/app/api/chat/route.ts`**
```ts
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { buildGrillSystemPrompt } from '@/lib/grill-prompt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { messages, componentName, figmaDesign } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildGrillSystemPrompt(componentName, JSON.stringify(figmaDesign)),
    messages,
    maxTokens: 2048,
  })

  return result.toDataStreamResponse()
}
```

**Step 6: Commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add Grill Session streaming API route"
```

---

### Task 5: Build API route

**Files:**
- Create: `apps/pipeline-ui/lib/build.ts`
- Create: `apps/pipeline-ui/lib/build.test.ts`
- Create: `apps/pipeline-ui/app/api/build/route.ts`

**Step 1: Write the failing test**

Create `apps/pipeline-ui/lib/build.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { componentDir, buildCodegenPrompt } from './build'

describe('componentDir', () => {
  it('returns correct absolute path for a component', () => {
    expect(componentDir('Button', '/repo/root')).toBe('/repo/root/src/components/Button')
  })

  it('preserves the component name casing', () => {
    expect(componentDir('MyCard', '/repo/root')).toBe('/repo/root/src/components/MyCard')
  })
})

describe('buildCodegenPrompt', () => {
  it('includes component name in the prompt', () => {
    const surface = { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] }
    expect(buildCodegenPrompt(surface)).toContain('Button')
  })

  it('includes each prop name in the prompt', () => {
    const surface = { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] }
    expect(buildCodegenPrompt(surface)).toContain('variant')
  })
})
```

**Step 2: Run to verify it fails**
```bash
npm test
```
Expected: FAIL — `Cannot find module './build'`

**Step 3: Create `apps/pipeline-ui/lib/build.ts`**
```ts
import path from 'path'
import type { PropSurface } from './pipeline-state'

export function componentDir(componentName: string, repoRoot: string): string {
  return path.join(repoRoot, 'src', 'components', componentName)
}

export function buildCodegenPrompt(surface: PropSurface): string {
  const propLines = surface.props
    .map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type}${p.defaultValue ? ` // default: ${p.defaultValue}` : ''}`)
    .join('\n')

  return `Generate a React TypeScript component. Return ONLY a valid JSON object — no markdown, no explanation.

Component: ${surface.componentName}

Props:
${propLines}

Requirements:
- Use inline React styles (no CSS modules, no Tailwind, no external CSS)
- Named export: export function ${surface.componentName}(...)
- If a loading prop exists: show a CSS spinner, hide children while loading
- If a disabled prop exists: apply 50% opacity, block pointer events
- All TypeScript types must be explicit

Return a JSON object with these exact keys:
{
  "component": "...full Button.tsx content...",
  "test": "...full Button.test.tsx content using Vitest + @testing-library/react...",
  "stories": "...full Button.stories.tsx content using Storybook 8 Meta/StoryObj...",
  "index": "export { ${surface.componentName} } from './${surface.componentName}'"
}`
}
```

**Step 4: Run tests**
```bash
npm test
```
Expected: 4 tests PASS (+ all prior).

**Step 5: Create `apps/pipeline-ui/app/api/build/route.ts`**
```ts
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { componentDir, buildCodegenPrompt } from '@/lib/build'
import type { PropSurface } from '@/lib/pipeline-state'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { propSurface }: { propSurface: PropSurface } = await req.json()

  const repoRoot = path.resolve(process.cwd(), process.env.COMPONENT_LIBRARY_PATH ?? '../../')
  const dir = componentDir(propSurface.componentName, repoRoot)

  const preBuildSha = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim()

  // Generate all four files via Claude
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt: buildCodegenPrompt(propSurface),
    maxTokens: 4096,
  })

  let files: Record<string, string>
  try {
    files = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Code generation returned invalid JSON', raw: text }, { status: 500 })
  }

  // Write files to disk
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${propSurface.componentName}.tsx`), files.component)
  fs.writeFileSync(path.join(dir, `${propSurface.componentName}.test.tsx`), files.test)
  fs.writeFileSync(path.join(dir, `${propSurface.componentName}.stories.tsx`), files.stories)
  fs.writeFileSync(path.join(dir, 'index.ts'), files.index)

  // Run tests — if they fail, clean up and return error
  try {
    execSync('npm test', { cwd: repoRoot, stdio: 'pipe' })
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true })
    return NextResponse.json({ error: 'Tests failed after code generation', details: String(err) }, { status: 422 })
  }

  // Commit
  execSync(`git add src/components/${propSurface.componentName}/`, { cwd: repoRoot })
  execSync(
    `git commit -m "feat(design-system-poc): add ${propSurface.componentName} component from Figma design"`,
    { cwd: repoRoot }
  )

  const commitSha = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim()
  const storySlug = propSurface.componentName.toLowerCase()
  const storyUrl = `http://localhost:6006/?path=/story/${storySlug}--primary`

  return NextResponse.json({ commitSha, preBuildSha, storyUrl })
}
```

**Step 6: Commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add Build API route"
```

---

### Task 6: Storybook auto-start + PR creation API routes

**Files:**
- Create: `apps/pipeline-ui/app/api/storybook/route.ts`
- Create: `apps/pipeline-ui/app/api/pr/route.ts`

These routes are pure side-effects (process spawn, shell exec) — no unit tests. Verify manually in Task 10.

**Step 1: Create `apps/pipeline-ui/app/api/storybook/route.ts`**
```ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export const runtime = 'nodejs'

async function isStorybookRunning(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:6006', { signal: AbortSignal.timeout(1000) })
    return res.ok
  } catch {
    return false
  }
}

async function waitForStorybook(maxMs = 90000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (await isStorybookRunning()) return true
    await new Promise(r => setTimeout(r, 2000))
  }
  return false
}

export async function POST(req: NextRequest) {
  const { storyUrl } = await req.json()

  if (!(await isStorybookRunning())) {
    const repoRoot = path.resolve(process.cwd(), process.env.COMPONENT_LIBRARY_PATH ?? '../../')
    const proc = spawn('npm', ['run', 'storybook'], { cwd: repoRoot, stdio: 'ignore', detached: true })
    proc.unref()

    const ready = await waitForStorybook()
    if (!ready) return NextResponse.json({ error: 'Storybook failed to start within 90s' }, { status: 500 })
  }

  return NextResponse.json({ storybookUrl: storyUrl ?? 'http://localhost:6006' })
}
```

**Step 2: Create `apps/pipeline-ui/app/api/pr/route.ts`**
```ts
import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { componentName, preBuildSha, commitSha } = await req.json()
  const repoRoot = path.resolve(process.cwd(), process.env.COMPONENT_LIBRARY_PATH ?? '../../')

  const branch = `component/${componentName.toLowerCase()}`

  // Create feature branch from the commit just before the build
  execSync(`git checkout -b ${branch} ${preBuildSha}`, { cwd: repoRoot })

  // Cherry-pick the component commits onto the feature branch
  execSync(`git cherry-pick ${preBuildSha}..${commitSha}`, { cwd: repoRoot })

  // Push the feature branch
  execSync(`git push -u origin ${branch}`, { cwd: repoRoot })

  // Create the PR and capture the URL
  const prUrl = execSync(
    `gh pr create --title "feat(design-system-poc): ${componentName} component — Figma pipeline" --body "Built via Figma-driven design pipeline UI." --base main --head ${branch}`,
    { cwd: repoRoot }
  ).toString().trim()

  // Return to main
  execSync('git checkout main', { cwd: repoRoot })

  return NextResponse.json({ prUrl })
}
```

**Step 3: Commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add Storybook auto-start + PR creation API routes"
```

---

## Phase 3 — UI Screens

### Task 7: Landing screen

**Files:**
- Modify: `apps/pipeline-ui/app/layout.tsx` (add PipelineProvider)
- Modify: `apps/pipeline-ui/app/page.tsx`
- Create: `apps/pipeline-ui/app/page.test.tsx`

**Step 1: Write the failing test**

Create `apps/pipeline-ui/app/page.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { PipelineProvider } from '@/lib/pipeline-context'
import Page from './page'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ design: { nodes: [] } }),
  })
})

function renderPage() {
  return render(<PipelineProvider><Page /></PipelineProvider>)
}

describe('Landing screen', () => {
  it('renders the Figma URL input', () => {
    renderPage()
    expect(screen.getByPlaceholderText(/figma\.com\/design/i)).toBeInTheDocument()
  })

  it('renders the component name input', () => {
    renderPage()
    expect(screen.getByPlaceholderText(/component name/i)).toBeInTheDocument()
  })

  it('Start button is disabled when inputs are empty', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('Start button is enabled when both inputs are filled', () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText(/figma\.com\/design/i), { target: { value: 'https://figma.com/design/abc' } })
    fireEvent.change(screen.getByPlaceholderText(/component name/i), { target: { value: 'Button' } })
    expect(screen.getByRole('button', { name: /start/i })).not.toBeDisabled()
  })
})
```

**Step 2: Run to verify it fails**
```bash
npm test
```
Expected: FAIL — test expectations don't match the scaffolded page.

**Step 3: Update `apps/pipeline-ui/app/layout.tsx` to wrap with PipelineProvider**
```tsx
import { PipelineProvider } from '@/lib/pipeline-context'

export const metadata = { title: 'Design System Pipeline' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f0f0f', color: '#f0f0f0', minHeight: '100vh' }}>
        <PipelineProvider>
          {children}
        </PipelineProvider>
      </body>
    </html>
  )
}
```

**Step 4: Replace `apps/pipeline-ui/app/page.tsx`**
```tsx
'use client'
import { useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import { GrillScreen } from '@/components/GrillScreen'
import { PropSurfaceReview } from '@/components/PropSurfaceReview'
import { BuildScreen } from '@/components/BuildScreen'
import { StorybookPreview } from '@/components/StorybookPreview'
import { PrCreated } from '@/components/PrCreated'

export default function Page() {
  const { state, dispatch } = usePipeline()
  const [figmaUrl, setFigmaUrl] = useState('')
  const [componentName, setComponentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state.stage === 'grill') return <GrillScreen />
  if (state.stage === 'prop-review') return <PropSurfaceReview />
  if (state.stage === 'building') return <BuildScreen />
  if (state.stage === 'preview') return <StorybookPreview />
  if (state.stage === 'pr-created') return <PrCreated />

  async function handleStart() {
    if (!figmaUrl.trim() || !componentName.trim()) return
    setLoading(true)
    setError(null)
    try {
      let nodeId = '0:1'
      try { nodeId = new URL(figmaUrl).searchParams.get('node-id') ?? '0:1' } catch {}
      const res = await fetch('/api/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl, nodeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      dispatch({ type: 'FIGMA_READ', figmaUrl, componentName: componentName.trim(), figmaDesign: data.design })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const canStart = figmaUrl.trim() !== '' && componentName.trim() !== ''

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Design System Pipeline</h1>
      <p style={{ color: '#888', marginBottom: 48 }}>Paste a Figma URL to build a component.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="url"
          placeholder="https://figma.com/design/..."
          value={figmaUrl}
          onChange={e => setFigmaUrl(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Component name (e.g. Button)"
          value={componentName}
          onChange={e => setComponentName(e.target.value)}
          style={inputStyle}
        />
        {error && <p style={{ color: '#ff6b6b', fontSize: 14, margin: 0 }}>{error}</p>}
        <button
          onClick={handleStart}
          disabled={!canStart || loading}
          style={btnStyle(!canStart || loading)}
        >
          {loading ? 'Reading Figma…' : 'Start'}
        </button>
      </div>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 8, border: '1px solid #333',
  background: '#1a1a1a', color: '#f0f0f0', fontSize: 16, outline: 'none',
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '12px 24px', borderRadius: 8, border: 'none',
  background: disabled ? '#333' : '#0BCE83',
  color: disabled ? '#666' : '#000',
  fontSize: 16, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
})
```

**Step 5: Run tests**
```bash
npm test
```
Expected: 4 landing tests PASS (+ all prior).

**Step 6: Commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add Landing screen"
```

---

### Task 8: Grill Session chat UI

**Files:**
- Create: `apps/pipeline-ui/components/GrillScreen.tsx`
- Create: `apps/pipeline-ui/components/GrillScreen.test.tsx`

**Step 1: Write the failing test**

Create `apps/pipeline-ui/components/GrillScreen.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { PipelineProvider } from '@/lib/pipeline-context'
import { GrillScreen } from './GrillScreen'

vi.mock('ai/react', () => ({
  useChat: () => ({
    messages: [{ id: '1', role: 'assistant', content: 'What variants does this component have?' }],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}))

function renderScreen() {
  return render(<PipelineProvider><GrillScreen /></PipelineProvider>)
}

describe('GrillScreen', () => {
  it('renders the Grill Session heading', () => {
    renderScreen()
    expect(screen.getByText(/grill session/i)).toBeInTheDocument()
  })

  it('renders assistant messages from the chat', () => {
    renderScreen()
    expect(screen.getByText('What variants does this component have?')).toBeInTheDocument()
  })

  it('renders a text input for the designer to reply', () => {
    renderScreen()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify it fails**
```bash
npm test
```
Expected: FAIL — `Cannot find module './GrillScreen'`

**Step 3: Create `apps/pipeline-ui/components/GrillScreen.tsx`**
```tsx
'use client'
import { useChat } from 'ai/react'
import { usePipeline } from '@/lib/pipeline-context'
import { extractPropSurface } from '@/lib/grill-prompt'

export function GrillScreen() {
  const { state, dispatch } = usePipeline()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: state.messages.map((m, i) => ({ id: String(i), role: m.role, content: m.content })),
    body: { componentName: state.componentName, figmaDesign: state.figmaDesign },
    onFinish(message) {
      const surface = extractPropSurface(message.content)
      if (surface) dispatch({ type: 'PROP_SURFACE_READY', propSurface: surface })
    },
  })

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Grill Session</h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 24px' }}>Component: <strong style={{ color: '#f0f0f0' }}>{state.componentName}</strong></p>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#0BCE83' : '#1a1a1a',
              color: msg.role === 'user' ? '#000' : '#f0f0f0',
              padding: '12px 16px', borderRadius: 12, maxWidth: '80%',
              fontSize: 15, whiteSpace: 'pre-wrap', lineHeight: 1.5,
            }}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: '#888', fontSize: 14 }}>Claude is thinking…</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Your answer…"
          disabled={isLoading}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#f0f0f0', fontSize: 15, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 20px', borderRadius: 8, border: 'none',
            background: isLoading || !input.trim() ? '#333' : '#0BCE83',
            color: isLoading || !input.trim() ? '#666' : '#000',
            fontWeight: 600, cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </main>
  )
}
```

**Step 4: Run tests**
```bash
npm test
```
Expected: 3 GrillScreen tests PASS (+ all prior).

**Step 5: Commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add Grill Session chat UI"
```

---

### Task 9: Prop Surface Review, Build, Storybook Preview, Approval, and PR Created screens

**Files:**
- Create: `apps/pipeline-ui/components/PropSurfaceReview.tsx`
- Create: `apps/pipeline-ui/components/BuildScreen.tsx`
- Create: `apps/pipeline-ui/components/StorybookPreview.tsx`
- Create: `apps/pipeline-ui/components/ApprovalControls.tsx`
- Create: `apps/pipeline-ui/components/PrCreated.tsx`
- Create: `apps/pipeline-ui/components/screens.test.tsx`

**Step 1: Write failing tests for PropSurfaceReview**

Create `apps/pipeline-ui/components/screens.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { PipelineProvider } from '@/lib/pipeline-context'
import { usePipeline } from '@/lib/pipeline-context'
import { PropSurfaceReview } from './PropSurfaceReview'
import { PrCreated } from './PrCreated'

function WithState({ setup, children }: { setup: (dispatch: ReturnType<typeof usePipeline>['dispatch']) => void, children: React.ReactNode }) {
  const { dispatch } = usePipeline()
  setup(dispatch)
  return <>{children}</>
}

describe('PropSurfaceReview', () => {
  it('renders component name', () => {
    render(
      <PipelineProvider>
        <WithState setup={d => {
          d({ type: 'FIGMA_READ', figmaUrl: 'http://f.com', componentName: 'Button', figmaDesign: { nodes: [] } })
          d({ type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] } })
        }}>
          <PropSurfaceReview />
        </WithState>
      </PipelineProvider>
    )
    expect(screen.getByText('Button')).toBeInTheDocument()
  })

  it('renders prop names in the table', () => {
    render(
      <PipelineProvider>
        <WithState setup={d => {
          d({ type: 'FIGMA_READ', figmaUrl: 'http://f.com', componentName: 'Button', figmaDesign: { nodes: [] } })
          d({ type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] } })
        }}>
          <PropSurfaceReview />
        </WithState>
      </PipelineProvider>
    )
    expect(screen.getByText('variant')).toBeInTheDocument()
  })
})

describe('PrCreated', () => {
  it('renders View Pull Request link', () => {
    render(
      <PipelineProvider>
        <WithState setup={d => {
          d({ type: 'FIGMA_READ', figmaUrl: 'http://f.com', componentName: 'Button', figmaDesign: { nodes: [] } })
          d({ type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
          d({ type: 'BUILD_START' })
          d({ type: 'BUILD_SUCCESS', commitSha: 'abc', preBuildSha: 'def', storyUrl: 'http://localhost:6006' })
          d({ type: 'APPROVED', prUrl: 'https://github.com/dbeacham15/design-system-poc/pull/2' })
        }}>
          <PrCreated />
        </WithState>
      </PipelineProvider>
    )
    expect(screen.getByRole('link', { name: /view pull request/i })).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify it fails**
```bash
npm test
```
Expected: FAIL — `Cannot find module './PropSurfaceReview'` and `'./PrCreated'`

**Step 3: Create `apps/pipeline-ui/components/PropSurfaceReview.tsx`**
```tsx
'use client'
import { usePipeline } from '@/lib/pipeline-context'

export function PropSurfaceReview() {
  const { state, dispatch } = usePipeline()
  const { propSurface } = state
  if (!propSurface) return null

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Prop Surface Review</h2>
      <p style={{ color: '#888', marginBottom: 32 }}>Confirm the component API before building.</p>

      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>{propSurface.componentName}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ color: '#888', textAlign: 'left' }}>
              <th style={{ paddingBottom: 10, width: '30%' }}>Prop</th>
              <th style={{ paddingBottom: 10, width: '50%' }}>Type</th>
              <th style={{ paddingBottom: 10 }}>Required</th>
            </tr>
          </thead>
          <tbody>
            {propSurface.props.map(prop => (
              <tr key={prop.name} style={{ borderTop: '1px solid #222' }}>
                <td style={{ padding: '10px 0', fontFamily: 'monospace', color: '#0BCE83' }}>{prop.name}</td>
                <td style={{ padding: '10px 0', fontFamily: 'monospace', color: '#888', fontSize: 13 }}>{prop.type}</td>
                <td style={{ padding: '10px 0' }}>{prop.required ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => dispatch({ type: 'BUILD_START' })}
          style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: '#0BCE83', color: '#000', fontWeight: 600, cursor: 'pointer' }}
        >
          Build Component
        </button>
        <button
          onClick={() => dispatch({ type: 'REQUEST_CHANGES', feedback: 'Please revise the prop surface.' })}
          style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#f0f0f0', cursor: 'pointer' }}
        >
          Back to Chat
        </button>
      </div>
    </main>
  )
}
```

**Step 4: Create `apps/pipeline-ui/components/BuildScreen.tsx`**

This screen auto-triggers the build API on mount and transitions to preview when done.

```tsx
'use client'
import { useEffect, useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'

export function BuildScreen() {
  const { state, dispatch } = usePipeline()
  const [status, setStatus] = useState('Generating component code…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function runBuild() {
      try {
        setStatus('Generating component code…')
        const buildRes = await fetch('/api/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propSurface: state.propSurface }),
        })
        const buildData = await buildRes.json()
        if (!buildRes.ok) throw new Error(buildData.error + (buildData.details ? `\n${buildData.details}` : ''))

        setStatus('Starting Storybook…')
        const sbRes = await fetch('/api/storybook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyUrl: buildData.storyUrl }),
        })
        const sbData = await sbRes.json()
        if (!sbRes.ok) throw new Error(sbData.error)

        dispatch({
          type: 'BUILD_SUCCESS',
          commitSha: buildData.commitSha,
          preBuildSha: buildData.preBuildSha,
          storyUrl: sbData.storybookUrl,
        })
      } catch (err) {
        setError(String(err))
      }
    }
    runBuild()
  }, [])

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Building Component</h2>
      {error ? (
        <>
          <p style={{ color: '#ff6b6b', whiteSpace: 'pre-wrap', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => dispatch({ type: 'REQUEST_CHANGES', feedback: 'Build failed. Please review and clarify.' })}
            style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#f0f0f0', cursor: 'pointer' }}
          >
            Back to Chat
          </button>
        </>
      ) : (
        <p style={{ color: '#888' }}>{status}</p>
      )}
    </main>
  )
}
```

**Step 5: Create `apps/pipeline-ui/components/ApprovalControls.tsx`**
```tsx
'use client'
import { useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'

export function ApprovalControls() {
  const { state, dispatch } = usePipeline()
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: state.componentName,
          preBuildSha: state.preBuildSha,
          commitSha: state.commitSha,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      dispatch({ type: 'APPROVED', prUrl: data.prUrl })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (showFeedback) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Describe what needs to change…"
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#f0f0f0', fontSize: 14, width: 280, outline: 'none' }}
        />
        <button
          onClick={() => { dispatch({ type: 'REQUEST_CHANGES', feedback }); setShowFeedback(false) }}
          disabled={!feedback.trim()}
          style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#000', fontWeight: 600, cursor: 'pointer' }}
        >
          Send
        </button>
        <button
          onClick={() => setShowFeedback(false)}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {error && <span style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</span>}
      <button
        onClick={() => setShowFeedback(true)}
        style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#f0f0f0', cursor: 'pointer' }}
      >
        Request Changes
      </button>
      <button
        onClick={handleApprove}
        disabled={loading}
        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: loading ? '#333' : '#0BCE83', color: loading ? '#666' : '#000', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Creating PR…' : 'Looks Good — Create PR'}
      </button>
    </div>
  )
}
```

**Step 6: Create `apps/pipeline-ui/components/StorybookPreview.tsx`**
```tsx
'use client'
import { usePipeline } from '@/lib/pipeline-context'
import { ApprovalControls } from './ApprovalControls'

export function StorybookPreview() {
  const { state } = usePipeline()

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 24, gap: 16, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Storybook Preview</h2>
          <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>Review all stories, then approve or request changes.</p>
        </div>
        <ApprovalControls />
      </div>
      <iframe
        src={state.storyUrl ?? 'http://localhost:6006'}
        style={{ flex: 1, border: '1px solid #333', borderRadius: 12, background: '#fff' }}
        title="Storybook Preview"
      />
    </main>
  )
}
```

**Step 7: Create `apps/pipeline-ui/components/PrCreated.tsx`**
```tsx
'use client'
import { usePipeline } from '@/lib/pipeline-context'

export function PrCreated() {
  const { state } = usePipeline()

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>PR Created</h2>
      <p style={{ color: '#888', marginBottom: 32 }}>Your component is ready for review.</p>
      <a
        href={state.prUrl ?? '#'}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 8, background: '#0BCE83', color: '#000', fontWeight: 600, textDecoration: 'none', marginBottom: 40 }}
      >
        View Pull Request
      </a>
      <br />
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 14 }}
      >
        Start another component
      </button>
    </main>
  )
}
```

**Step 8: Run tests**
```bash
npm test
```
Expected: 2 PropSurfaceReview tests + 1 PrCreated test PASS (+ all prior).

**Step 9: Commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): add PropSurfaceReview, Build, StorybookPreview, Approval, PrCreated screens"
```

---

## Phase 4 — End-to-End Verification

### Task 10: End-to-end smoke test

**This task is manual. It verifies the full pipeline works in the browser.**

**Step 1: Configure `.env.local`**

In `apps/pipeline-ui/.env.local`, fill in real values:
```
FIGMA_TOKEN=<your-figma-token>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
COMPONENT_LIBRARY_PATH=../../
```

**Step 2: Start the Pipeline UI**
```bash
cd apps/pipeline-ui && npm run dev
```
Expected: `http://localhost:3000` ready.

**Step 3: Walk through the full flow**

1. Open `http://localhost:3000`
2. Paste a Figma URL (e.g. `https://www.figma.com/design/nZWd2gIdibUaIcmwUvy6qk/...?node-id=116-828`)
3. Enter a component name (e.g. `Card`)
4. Click **Start** → app reads Figma, transitions to Grill Session
5. Answer Claude's questions until it outputs a `[PROP_SURFACE]` block and the UI transitions to Prop Surface Review
6. Click **Build Component** → Build screen runs, writes files, runs tests, commits, starts Storybook
7. Storybook Preview loads in iframe at `localhost:6006` — navigate to the new component
8. Click **Looks Good — Create PR** → PR is created, PR Created screen shows the URL
9. Verify: `gh pr list` shows the new PR targeting `main`

**Step 4: Final commit**
```bash
git add apps/pipeline-ui/
git commit -m "feat(pipeline-ui): complete Pipeline UI — end-to-end smoke test passed"
```

**POC complete** when the Storybook Preview shows the component and a GitHub PR exists.
