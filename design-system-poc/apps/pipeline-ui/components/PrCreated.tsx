'use client'
import { usePipeline } from '@/lib/pipeline-context'

export function PrCreated() {
  const { state } = usePipeline()

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>PR Created</h2>
      <p style={{ color: '#888', marginBottom: 32 }}>Your component is ready for review.</p>
      <a
        href={state.prUrl ?? '#'}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 8, background: '#0BCE83', color: '#000', fontWeight: 600, textDecoration: 'none', marginBottom: 40 }}
      >
        View Pull Request
      </a>
      <br />
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 14 }}
      >
        Start another component
      </button>
    </main>
  )
}
