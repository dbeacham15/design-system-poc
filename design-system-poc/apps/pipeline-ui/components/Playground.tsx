'use client'
import { usePipeline } from '@/lib/pipeline-context'

export function Playground() {
  const { state } = usePipeline()
  const isBuilding = state.stage === 'building'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
      {isBuilding ? (
        <div style={{ color: '#f5a623', fontSize: 14 }}>Build in progress…</div>
      ) : (
        <div style={{ color: '#444', fontSize: 14 }}>
          {state.selectedComponent ? `Playground: ${state.selectedComponent}` : 'No component selected'}
        </div>
      )}
    </div>
  )
}
