import ReactMarkdown from 'react-markdown'

interface Props {
  text: string
  streaming: boolean
}

// Returns text with incomplete multi-line blocks removed.
// A "block" is: a code fence (```) or a [PROP_SURFACE] section.
function stripIncompleteBlocks(text: string): { safe: string; inBlock: boolean } {
  // Check for unclosed code fence
  const fenceMatches = (text.match(/```/g) ?? []).length
  if (fenceMatches % 2 !== 0) {
    const lastFence = text.lastIndexOf('```')
    return { safe: text.slice(0, lastFence).trimEnd(), inBlock: true }
  }

  // Check for unclosed PROP_SURFACE
  const psOpen = text.indexOf('[PROP_SURFACE]')
  if (psOpen !== -1) {
    const psClose = text.indexOf('[/PROP_SURFACE]')
    if (psClose === -1) {
      return { safe: text.slice(0, psOpen).trimEnd(), inBlock: true }
    }
  }

  return { safe: text, inBlock: false }
}

export function StreamingMarkdown({ text, streaming }: Props) {
  if (!streaming) {
    return (
      <div className="streaming-md">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    )
  }

  const lines = text.split('\n')
  const completedLines = lines.slice(0, -1)
  const currentLine = lines[lines.length - 1]

  const completedText = completedLines.join('\n')
  const { safe, inBlock } = stripIncompleteBlocks(completedText)

  return (
    <div className="streaming-md">
      {safe && <ReactMarkdown>{safe}</ReactMarkdown>}
      {!inBlock && currentLine && (
        <span style={{ opacity: 0.85 }}>{currentLine}</span>
      )}
      {inBlock && (
        <span style={{ color: '#666', fontSize: 13 }}>···</span>
      )}
    </div>
  )
}
