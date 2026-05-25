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
