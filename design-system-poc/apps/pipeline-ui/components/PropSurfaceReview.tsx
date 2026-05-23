'use client'
import { usePipeline } from '@/lib/pipeline-context'

export function PropSurfaceReview() {
  const { state, dispatch } = usePipeline()
  const { propSurface } = state
  if (!propSurface) return null

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Prop Surface Review</h2>
      <p style={{ color: '#888', marginBottom: 32 }}>Confirm the component API before building.</p>

      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>{propSurface.componentName}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ color: '#888', textAlign: 'left' }}>
              <th style={{ paddingBottom: 10, width: '30%' }}>Prop</th>
              <th style={{ paddingBottom: 10, width: '50%' }}>Type</th>
              <th style={{ paddingBottom: 10 }}>Required</th>
            </tr>
          </thead>
          <tbody>
            {propSurface.props.map(prop => (
              <tr key={prop.name} style={{ borderTop: '1px solid #222' }}>
                <td style={{ padding: '10px 0', fontFamily: 'monospace', color: '#0BCE83' }}>{prop.name}</td>
                <td style={{ padding: '10px 0', fontFamily: 'monospace', color: '#888', fontSize: 13 }}>{prop.type}</td>
                <td style={{ padding: '10px 0' }}>{prop.required ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => dispatch({ type: 'BUILD_START' })}
          style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: '#0BCE83', color: '#000', fontWeight: 600, cursor: 'pointer' }}
        >
          Build Component
        </button>
        <button
          onClick={() => dispatch({ type: 'REQUEST_CHANGES', feedback: 'Please revise the prop surface.' })}
          style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#f0f0f0', cursor: 'pointer' }}
        >
          Back to Chat
        </button>
      </div>
    </main>
  )
}
