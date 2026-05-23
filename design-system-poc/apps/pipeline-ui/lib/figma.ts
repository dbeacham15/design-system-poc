export function parseFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/)
  return match?.[1] ?? null
}

export async function readFigmaNode(fileKey: string, nodeId: string, token: string): Promise<unknown> {
  // If we have a specific node, use the nodes endpoint (depth=1 is cheaper than depth=3)
  // Fall back to top-level file endpoint if no node specified
  const url = nodeId && nodeId !== '0:1'
    ? `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&depth=1`
    : `https://api.figma.com/v1/files/${fileKey}?depth=1`

  const res = await fetch(url, { headers: { 'X-Figma-Token': token } })
  if (!res.ok) throw new Error(`Figma API error: ${res.status} ${res.statusText}`)
  return res.json()
}
