export function parseFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/)
  return match?.[1] ?? null
}

export async function readFigmaNode(fileKey: string, nodeId: string, token: string): Promise<unknown> {
  // Figma URLs use dashes (116-828) but the API requires colons (116:828)
  const apiNodeId = nodeId.replace(/-/g, ':')

  // Use file-level endpoint if no specific node; nodes endpoint otherwise
  const url = apiNodeId && apiNodeId !== '0:1'
    ? `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(apiNodeId)}&depth=1`
    : `https://api.figma.com/v1/files/${fileKey}?depth=1`

  const res = await fetch(url, { headers: { 'X-Figma-Token': token } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Figma API error: ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`)
  }
  return res.json()
}
