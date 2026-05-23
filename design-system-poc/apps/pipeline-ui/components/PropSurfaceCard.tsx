'use client'
import { usePipeline } from '@/lib/pipeline-context'
import type { PropSurface } from '@/lib/pipeline-state'

export function PropSurfaceCard({ surface }: { surface: PropSurface }) {
  const { state, dispatch } = usePipeline()
  const alreadyBuilt = state.stage === 'building' || state.stage === 'playground'

  function handleBuild() {
    dispatch({ type: 'BUILD_START' })
  }

  return (
    <div className="chat-msg" style={{ alignSelf: 'flex-start', width: '100%', maxWidth: 460, marginTop: 8 }}>
      <div style={{ background: '#111', border: '1px solid #0BCE8333', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0BCE83' }}>{surface.componentName}</span>
          <span style={{ fontSize: 11, color: '#555' }}>{surface.props.length} props</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              <th style={{ padding: '6px 16px', textAlign: 'left', color: '#555', fontWeight: 600 }}>Prop</th>
              <th style={{ padding: '6px 16px', textAlign: 'left', color: '#555', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '6px 16px', textAlign: 'left', color: '#555', fontWeight: 600 }}>Req</th>
            </tr>
          </thead>
          <tbody>
            {surface.props.map(prop => (
              <tr key={prop.name} style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '6px 16px', color: '#f0f0f0', fontFamily: 'monospace' }}>{prop.name}</td>
                <td style={{ padding: '6px 16px', color: '#888', fontFamily: 'monospace', fontSize: 11 }}>{prop.type}</td>
                <td style={{ padding: '6px 16px', color: prop.required ? '#0BCE83' : '#444' }}>{prop.required ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={handleBuild}
            disabled={alreadyBuilt}
            style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: alreadyBuilt ? '#1a1a1a' : '#0BCE83',
              color: alreadyBuilt ? '#444' : '#000',
              fontWeight: 700, fontSize: 14, cursor: alreadyBuilt ? 'default' : 'pointer',
            }}
          >
            {alreadyBuilt ? 'Building…' : 'Build Component'}
          </button>
        </div>
      </div>
    </div>
  )
}
