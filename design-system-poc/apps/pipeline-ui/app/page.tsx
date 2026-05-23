'use client'
import { useState, useEffect } from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import { GrillScreen } from '@/components/GrillScreen'
import { PropSurfaceReview } from '@/components/PropSurfaceReview'
import { BuildScreen } from '@/components/BuildScreen'
import { StorybookPreview } from '@/components/StorybookPreview'
import { PrCreated } from '@/components/PrCreated'

export default function Page() {
  const { state, dispatch } = usePipeline()
  const [figmaUrl, setFigmaUrl] = useState('')
  const [componentName, setComponentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryIn, setRetryIn] = useState(0)

  useEffect(() => {
    if (retryIn <= 0) return
    const t = setTimeout(() => setRetryIn(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [retryIn])

  if (state.stage === 'grill') return <GrillScreen />
  if (state.stage === 'prop-review') return <PropSurfaceReview />
  if (state.stage === 'building') return <BuildScreen />
  if (state.stage === 'preview') return <StorybookPreview />
  if (state.stage === 'pr-created') return <PrCreated />

  // Try to read Figma; if it fails, proceed with empty design data
  async function tryReadFigma(): Promise<unknown> {
    if (!figmaUrl.trim()) return {}
    try {
      let nodeId = '0:1'
      try { nodeId = new URL(figmaUrl).searchParams.get('node-id') ?? '0:1' } catch {}
      const res = await fetch('/api/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl, nodeId }),
      })
      if (res.status === 429) {
        setError('Figma rate limit hit — proceeding without design data. Claude will ask more questions.')
        setRetryIn(15)
        return {}
      }
      if (!res.ok) {
        const data = await res.json()
        setError(`Figma unavailable (${data.error}) — proceeding without design data.`)
        return {}
      }
      const data = await res.json()
      return data.design
    } catch {
      setError('Could not reach Figma — proceeding without design data.')
      return {}
    }
  }

  async function handleStart() {
    if (!componentName.trim()) return
    setLoading(true)
    setError(null)
    const figmaDesign = await tryReadFigma()
    dispatch({
      type: 'FIGMA_READ',
      figmaUrl: figmaUrl.trim(),
      componentName: componentName.trim(),
      figmaDesign: { nodes: [], ...(figmaDesign as object) },
    })
    setLoading(false)
  }

  async function handleSkipFigma() {
    if (!componentName.trim()) return
    dispatch({
      type: 'FIGMA_READ',
      figmaUrl: '',
      componentName: componentName.trim(),
      figmaDesign: { nodes: [] },
    })
  }

  const canStart = componentName.trim() !== '' && retryIn === 0

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Design System Pipeline</h1>
      <p style={{ color: '#888', marginBottom: 48 }}>Name your component and optionally paste a Figma URL for design context.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="text"
          placeholder="Component name (e.g. Button)"
          value={componentName}
          onChange={e => setComponentName(e.target.value)}
          style={inputStyle}
          autoFocus
        />
        <input
          type="url"
          placeholder="Figma URL (optional — paste to give Claude design context)"
          value={figmaUrl}
          onChange={e => setFigmaUrl(e.target.value)}
          style={{ ...inputStyle, color: figmaUrl ? '#f0f0f0' : '#666' }}
        />

        {error && (
          <p style={{ color: '#f5a623', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            ⚠ {error}
            {retryIn > 0 && <span style={{ color: '#888' }}> ({retryIn}s)</span>}
          </p>
        )}

        <button
          onClick={handleStart}
          disabled={!canStart || loading}
          style={btnStyle(!canStart || loading)}
        >
          {loading ? 'Reading Figma…' : 'Start Grill Session'}
        </button>

        {figmaUrl && retryIn > 0 && (
          <button
            onClick={handleSkipFigma}
            disabled={!componentName.trim()}
            style={{ ...btnStyle(false), background: 'transparent', border: '1px solid #444', color: '#888' }}
          >
            Skip Figma — start without design context
          </button>
        )}
      </div>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 8, border: '1px solid #333',
  background: '#1a1a1a', color: '#f0f0f0', fontSize: 16, outline: 'none',
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '12px 24px', borderRadius: 8, border: 'none',
  background: disabled ? '#333' : '#0BCE83',
  color: disabled ? '#666' : '#000',
  fontSize: 16, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
})
