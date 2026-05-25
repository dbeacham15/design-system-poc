import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { componentDir, buildCodegenPrompt } from '@/lib/build'
import { regenerateRegistry, readRegistryNames } from '@/lib/registry-writer'
import type { PropSurface } from '@/lib/pipeline-state'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { propSurface }: { propSurface: PropSurface } = await req.json()

  if (!/^[A-Z][A-Za-z0-9]*$/.test(propSurface.componentName)) {
    return new Response(
      JSON.stringify({ error: 'Invalid component name — must be PascalCase (e.g. Button, MyCard)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const encoder = new TextEncoder()

  function sse(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
    controller.enqueue(encoder.encode('data: ' + JSON.stringify(data) + '\n\n'))
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const repoRoot = path.resolve(process.cwd(), process.env.COMPONENT_LIBRARY_PATH ?? '../../')
        const dir = componentDir(propSurface.componentName, repoRoot)

        sse(controller, { status: 'Capturing current HEAD…' })
        const preBuildSha = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim()

        sse(controller, { status: 'Generating component code with Claude…' })
        const { text } = await generateText({
          model: anthropic('claude-sonnet-4-6'),
          prompt: buildCodegenPrompt(propSurface),
          maxOutputTokens: 8000,  // FIX: was 4096; increase budget to avoid truncated JSON
        })

        sse(controller, { status: 'Parsing generated code…' })
        // Strip markdown code fences — Claude sometimes wraps JSON even when told not to.
        // Also handles preamble text before the opening fence (e.g. "Here is the JSON:\n```json\n...")
        const fenceMatch = text.match(/```(?:json|typescript|ts)?\s*\n([\s\S]*?)\n```/)
        const cleanText = fenceMatch ? fenceMatch[1].trim() : text.trim()

        let files: Record<string, string>
        try {
          files = JSON.parse(cleanText)
        } catch {
          sse(controller, { error: 'Claude returned invalid JSON. The model may have added unexpected text. Try building again.' })
          return
        }

        const requiredKeys = ['component', 'test', 'stories', 'index']
        const missingKeys = requiredKeys.filter(k => typeof files[k] !== 'string' || !files[k])
        if (missingKeys.length > 0) {
          sse(controller, { error: `Code generation missing keys: ${missingKeys.join(', ')}. Try building again.` })
          return
        }

        sse(controller, { status: 'Writing files to disk…' })
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, `${propSurface.componentName}.tsx`), files.component)
        fs.writeFileSync(path.join(dir, `${propSurface.componentName}.test.tsx`), files.test)
        fs.writeFileSync(path.join(dir, `${propSurface.componentName}.stories.tsx`), files.stories)
        fs.writeFileSync(path.join(dir, 'index.ts'), files.index)

        sse(controller, { status: 'Running tests…' })
        try {
          execSync('npm test', { cwd: repoRoot, stdio: 'pipe' })
        } catch (err) {
          fs.rmSync(dir, { recursive: true, force: true })
          const msg = err instanceof Error ? err.message : String(err)
          sse(controller, { error: `Tests failed: ${msg.slice(0, 400)}` })
          return
        }

        sse(controller, { status: 'Committing component…' })
        execSync(`git add src/components/${propSurface.componentName}/`, { cwd: repoRoot })
        execSync(
          `git commit -m "feat(design-system-poc): add ${propSurface.componentName} component from Figma design"`,
          { cwd: repoRoot }
        )

        const commitSha = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim()

        sse(controller, { status: 'Updating component registry…' })
        const appRoot = process.cwd()
        try {
          const existingNames = readRegistryNames(appRoot)
          const allNames = Array.from(new Set([...existingNames, propSurface.componentName]))
          regenerateRegistry(allNames, appRoot)
        } catch (err) {
          console.error('[registry-writer] Failed to regenerate registry:', err)
          // Non-fatal — component is committed; registry will be repaired on next build
        }

        sse(controller, { done: true, commitSha, preBuildSha })
      } catch (err) {
        sse(controller, { error: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
