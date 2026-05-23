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
  )
    .toString()
    .trim()

  // Return to main
  execSync('git checkout main', { cwd: repoRoot })

  return NextResponse.json({ prUrl })
}
