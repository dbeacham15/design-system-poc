import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { componentName, preBuildSha, commitSha } = await req.json()

  if (!/^[A-Z][A-Za-z0-9]*$/.test(componentName)) {
    return NextResponse.json(
      { error: 'Invalid component name — must be PascalCase (e.g. Button, MyCard)' },
      { status: 400 }
    )
  }

  if (!/^[0-9a-f]{7,40}$/.test(preBuildSha) || !/^[0-9a-f]{7,40}$/.test(commitSha)) {
    return NextResponse.json({ error: 'Invalid SHA — expected a hex git commit hash' }, { status: 400 })
  }

  const repoRoot = path.resolve(process.cwd(), process.env.COMPONENT_LIBRARY_PATH ?? '../../')
  const branch = `component/${componentName.toLowerCase()}`

  try {
    execSync(`git checkout -b ${branch} ${preBuildSha}`, { cwd: repoRoot })
    execSync(`git cherry-pick ${preBuildSha}..${commitSha}`, { cwd: repoRoot })
    execSync(`git push -u origin ${branch}`, { cwd: repoRoot })

    const prUrl = execSync(
      `gh pr create --title "feat(design-system-poc): ${componentName} component — Figma pipeline" --body "Built via Figma-driven design pipeline UI." --base main --head ${branch}`,
      { cwd: repoRoot }
    ).toString().trim()

    return NextResponse.json({ prUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    try { execSync('git checkout main', { cwd: repoRoot }) } catch {}
  }
}
