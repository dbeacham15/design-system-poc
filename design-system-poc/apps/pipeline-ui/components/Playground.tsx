'use client'
import { useState, useEffect } from 'react'
import type React from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import { componentRegistry } from '@/lib/component-registry.generated'
import type { PropDefinition } from '@/lib/pipeline-state'

// ---------------------------------------------------------------------------
// Prop-inference helpers
// ---------------------------------------------------------------------------

function extractStringUnionOptions(type: string): string[] | null {
  // Match patterns like: "primary" | "secondary" | "danger"
  const matches = type.matchAll(/"([^"]+)"/g)
  const options = Array.from(matches, m => m[1])
  return options.length >= 2 ? options : null
}

function inferDefault(prop: PropDefinition): unknown {
  if (prop.defaultValue !== null && prop.defaultValue !== '') return prop.defaultValue
  const unionOptions = extractStringUnionOptions(prop.type)
  if (unionOptions) return unionOptions[0]
  if (prop.type === 'boolean') return false
  if (prop.name === 'children') return 'Button'
  return ''
}

// ---------------------------------------------------------------------------
// Individual prop control
// ---------------------------------------------------------------------------

interface PropControlProps {
  prop: PropDefinition
  value: unknown
  onChange: (val: unknown) => void
}

function PropControl({ prop, value, onChange }: PropControlProps) {
  const unionOptions = extractStringUnionOptions(prop.type)

  if (unionOptions) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#888', minWidth: 80 }}>{prop.name}</span>
        <div style={{ display: 'flex', border: '1px solid #333', borderRadius: 6, overflow: 'hidden' }}>
          {unionOptions.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: value === opt ? '#4ade80' : '#1a1a1a',
                color: value === opt ? '#000' : '#ccc',
                border: 'none',
                cursor: 'pointer',
                borderRight: '1px solid #333',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (prop.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#888', minWidth: 80 }}>{prop.name}</span>
        <button
          onClick={() => onChange(!value)}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            background: value ? '#4ade80' : '#1a1a1a',
            color: value ? '#000' : '#ccc',
            border: '1px solid #333',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {value ? 'true' : 'false'}
        </button>
      </div>
    )
  }

  // string / ReactNode — text input
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#888', minWidth: 80 }}>{prop.name}</span>
      <input
        type="text"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '4px 8px',
          fontSize: 12,
          background: '#1a1a1a',
          color: '#ccc',
          border: '1px solid #333',
          borderRadius: 6,
          outline: 'none',
          width: 160,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Playground
// ---------------------------------------------------------------------------

export function Playground() {
  const { state, dispatch } = usePipeline()
  const isBuilding = state.stage === 'building'
  const name = state.selectedComponent

  const [Component, setComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [propValues, setPropValues] = useState<Record<string, unknown>>({})
  const [prLoading, setPrLoading] = useState(false)
  const [prError, setPrError] = useState<string | null>(null)

  // Load component from registry when name changes
  useEffect(() => {
    let cancelled = false
    if (!name) { setComponent(null); return }
    setLoadError(null)
    const loader = componentRegistry[name]
    if (!loader) { setLoadError(`No registry entry for "${name}". Build it first.`); return }
    setComponent(null)
    loader()
      .then(mod => { if (!cancelled) setComponent(() => mod.default) })
      .catch(err => { if (!cancelled) setLoadError(String(err)) })
    return () => { cancelled = true }
  }, [name])

  // Initialize prop values from PropSurface when it changes
  useEffect(() => {
    if (!state.propSurface) { setPropValues({}); return }
    const defaults: Record<string, unknown> = {}
    for (const prop of state.propSurface.props) {
      defaults[prop.name] = inferDefault(prop)
    }
    setPropValues(defaults)
  }, [state.propSurface])

  // Handle PR creation
  async function handleCreatePr() {
    if (!name || !state.commitSha || !state.preBuildSha) return
    setPrLoading(true)
    setPrError(null)
    try {
      const res = await fetch('/api/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentName: name, preBuildSha: state.preBuildSha, commitSha: state.commitSha }),
      })
      const data = await res.json()
      if (!res.ok) { setPrError(data.error ?? 'PR creation failed'); return }
      dispatch({ type: 'PR_CREATED', prUrl: data.prUrl })
    } catch (err) {
      setPrError(String(err))
    } finally {
      setPrLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Building state — show progress
  // -------------------------------------------------------------------------
  if (isBuilding) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', borderBottom: '1px solid #222',
          background: '#0d0d0d',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>Building…</span>
        </div>

        {/* Build status list */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {state.buildStatuses.length === 0 ? (
            <p style={{ color: '#555', fontSize: 13 }}>Starting build…</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.buildStatuses.map((msg, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#ccc' }}>
                  <span style={{ color: '#4ade80', fontSize: 11 }}>✓</span>
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Playground state
  // -------------------------------------------------------------------------
  const surface = state.propSurface
  const editableProps = surface
    ? surface.props.filter(p =>
        p.name !== 'children' &&
        p.name !== 'onClick' &&
        !p.type.startsWith('(') &&
        !p.type.includes('=>')
      )
    : []
  const props = editableProps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderBottom: '1px solid #222',
        background: '#0d0d0d',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>
          {name ?? 'No component'}
        </span>
        <div style={{ flex: 1 }} />
        {!state.chatOpen && (
          <button
            onClick={() => dispatch({ type: 'OPEN_CHAT' })}
            style={{
              padding: '5px 12px', fontSize: 12,
              background: '#1a1a1a', color: '#ccc',
              border: '1px solid #333', borderRadius: 6, cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}
        {state.commitSha && state.preBuildSha && !state.prUrl && (
          <button
            onClick={handleCreatePr}
            disabled={prLoading}
            style={{
              padding: '5px 12px', fontSize: 12,
              background: prLoading ? '#1a1a1a' : '#4ade80',
              color: prLoading ? '#888' : '#000',
              border: '1px solid #333', borderRadius: 6, cursor: prLoading ? 'default' : 'pointer',
            }}
          >
            {prLoading ? 'Creating PR…' : 'Create PR'}
          </button>
        )}
        {state.prUrl && (
          <a
            href={state.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '5px 12px', fontSize: 12,
              background: '#1a1a1a', color: '#4ade80',
              border: '1px solid #4ade80', borderRadius: 6, textDecoration: 'none',
            }}
          >
            View PR
          </a>
        )}
      </div>

      {prError && (
        <div style={{ padding: '8px 16px', background: '#3a0000', color: '#f87171', fontSize: 12 }}>
          PR error: {prError}
        </div>
      )}

      {/* Component render area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1a1a1a', overflow: 'auto',
        minHeight: 0,
      }}>
        {!name ? (
          <span style={{ color: '#555', fontSize: 14 }}>No component selected</span>
        ) : loadError ? (
          <span style={{ color: '#f87171', fontSize: 14 }}>{loadError}</span>
        ) : !Component ? (
          <span style={{ color: '#555', fontSize: 14 }}>Loading…</span>
        ) : (
          <Component {...propValues} />
        )}
      </div>

      {/* PropSurface controls */}
      {props.length > 0 && (
        <div style={{
          borderTop: '1px solid #222', padding: '16px',
          background: '#0d0d0d', display: 'flex', flexWrap: 'wrap', gap: 12,
        }}>
          {props.map(prop => (
            <PropControl
              key={prop.name}
              prop={prop}
              value={propValues[prop.name] ?? ''}
              onChange={val => setPropValues(prev => ({ ...prev, [prop.name]: val }))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
