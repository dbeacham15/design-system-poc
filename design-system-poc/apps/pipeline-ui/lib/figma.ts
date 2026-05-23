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
