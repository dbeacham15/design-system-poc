'use client'
import { usePipeline } from '@/lib/pipeline-context'
import { ApprovalControls } from './ApprovalControls'

export function StorybookPreview() {
  const { state } = usePipeline()

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 24, gap: 16, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Storybook Preview</h2>
          <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>Review all stories, then approve or request changes.</p>
        </div>
        <ApprovalControls />
      </div>
      <iframe
        src={state.storyUrl ?? 'http://localhost:6006'}
        style={{ flex: 1, border: '1px solid #333', borderRadius: 12, background: '#fff' }}
        title="Storybook Preview"
      />
    </main>
  )
}
