import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  const repoRoot = path.resolve(process.cwd(), process.env.COMPONENT_LIBRARY_PATH ?? '../../')
  const componentsDir = path.join(repoRoot, 'src', 'components')

  try {
    const entries = fs.readdirSync(componentsDir, { withFileTypes: true })
    const components = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => {
        const tsx = path.join(componentsDir, name, `${name}.tsx`)
        return fs.existsSync(tsx)
      })
    return NextResponse.json({ components })
  } catch {
    return NextResponse.json({ components: [] })
  }
}
