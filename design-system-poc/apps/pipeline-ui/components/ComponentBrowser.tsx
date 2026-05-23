'use client'
import { useEffect, useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'

export function ComponentBrowser() {
  const { state, dispatch } = usePipeline()
  const [components, setComponents] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/components')
      .then(r => r.json())
      .then(d => setComponents(d.components ?? []))
  }, [state.stage])

  return (
    <aside style={{
      width: 200, flexShrink: 0, borderRight: '1px solid #222',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ padding: '16px 12px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#555', textTransform: 'uppercase' }}>
        Components
      </div>
      {components.length === 0 ? (
        <div style={{ padding: '8px 12px', fontSize: 13, color: '#444' }}>None built yet</div>
      ) : (
        components.map(name => (
          <button
            key={name}
            onClick={() => dispatch({ type: 'SELECT_COMPONENT', componentName: name, propSurface: null })}
            style={{
              background: state.selectedComponent === name ? '#1a1a1a' : 'transparent',
              border: 'none',
              color: state.selectedComponent === name ? '#f0f0f0' : '#888',
              padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontSize: 14,
              borderLeft: state.selectedComponent === name ? '2px solid #0BCE83' : '2px solid transparent',
              transition: 'all .15s',
            }}
          >
            {name}
          </button>
        ))
      )}
    </aside>
  )
}
