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
