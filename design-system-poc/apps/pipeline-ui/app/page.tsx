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

  async function handleStart() {
    if (!figmaUrl.trim() || !componentName.trim()) return
    setLoading(true)
    setError(null)
    try {
      let nodeId = '0:1'
      try { nodeId = new URL(figmaUrl).searchParams.get('node-id') ?? '0:1' } catch {}
      const res = await fetch('/api/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl, nodeId }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setRetryIn(15)
        throw new Error('Figma rate limit hit — you can retry in a few seconds.')
      }
      if (!res.ok) throw new Error(data.error)
      dispatch({ type: 'FIGMA_READ', figmaUrl, componentName: componentName.trim(), figmaDesign: data.design })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const canStart = figmaUrl.trim() !== '' && componentName.trim() !== '' && retryIn === 0

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Design System Pipeline</h1>
      <p style={{ color: '#888', marginBottom: 48 }}>Paste a Figma URL to build a component.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="url"
          placeholder="https://figma.com/design/..."
          value={figmaUrl}
          onChange={e => setFigmaUrl(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Component name (e.g. Button)"
          value={componentName}
          onChange={e => setComponentName(e.target.value)}
          style={inputStyle}
        />
        {error && (
          <p style={{ color: '#ff6b6b', fontSize: 14, margin: 0 }}>
            {error}
            {retryIn > 0 && <span style={{ color: '#888' }}> Retry in {retryIn}s…</span>}
          </p>
        )}
        <button
          onClick={handleStart}
          disabled={!canStart || loading}
          style={btnStyle(!canStart || loading)}
        >
          {loading ? 'Reading Figma…' : retryIn > 0 ? `Retry in ${retryIn}s` : 'Start'}
        </button>
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
