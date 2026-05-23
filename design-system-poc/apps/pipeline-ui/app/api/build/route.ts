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

  if (!/^[A-Z][A-Za-z0-9]*$/.test(propSurface.componentName)) {
    return NextResponse.json({ error: 'Invalid component name — must be PascalCase (e.g. Button, MyCard)' }, { status: 400 })
  }

  const repoRoot = path.resolve(process.cwd(), process.env.COMPONENT_LIBRARY_PATH ?? '../../')
  const dir = componentDir(propSurface.componentName, repoRoot)

  // Capture the current HEAD before writing any files
  const preBuildSha = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim()

  // Generate all four files via Claude
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt: buildCodegenPrompt(propSurface),
    maxOutputTokens: 4096,
  })

  let files: Record<string, string>
  try {
    files = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Code generation returned invalid JSON', raw: text }, { status: 500 })
  }

  const requiredKeys = ['component', 'test', 'stories', 'index']
  const missingKeys = requiredKeys.filter(k => typeof files[k] !== 'string' || !files[k])
  if (missingKeys.length > 0) {
    return NextResponse.json({ error: `Code generation missing keys: ${missingKeys.join(', ')}`, raw: text }, { status: 500 })
  }

  // Write files to disk
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${propSurface.componentName}.tsx`), files.component)
  fs.writeFileSync(path.join(dir, `${propSurface.componentName}.test.tsx`), files.test)
  fs.writeFileSync(path.join(dir, `${propSurface.componentName}.stories.tsx`), files.stories)
  fs.writeFileSync(path.join(dir, 'index.ts'), files.index)

  // Run tests in the component library — if they fail, clean up and return 422
  try {
    execSync('npm test', { cwd: repoRoot, stdio: 'pipe' })
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true })
    return NextResponse.json({ error: 'Tests failed after code generation', details: String(err) }, { status: 422 })
  }

  // Commit the new component
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
