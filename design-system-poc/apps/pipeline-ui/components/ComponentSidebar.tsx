'use client'
import { useEffect, useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import type { AppState } from '@/lib/pipeline-state'

interface ResumableSession {
  id: string
  componentName: string | null
  stage: string
  status: string
  updatedAt: number
  messages: string
  figmaDesign: string | null
  figmaUrl: string | null
  propSurface: string | null
  commitSha: string | null
  preBuildSha: string | null
  prUrl: string | null
  errorMessage: string | null
}

export function ComponentSidebar() {
  const { state, sessionId, dispatch } = usePipeline()
  const [expanded, setExpanded] = useState(false)
  const [components, setComponents] = useState<string[]>([])
  const [sessions, setSessions] = useState<ResumableSession[]>([])

  useEffect(() => {
    fetch('/api/components')
      .then(r => r.json())
      .then(d => setComponents(d.components ?? []))
      .catch(() => {})
  }, [state.stage])

  useEffect(() => {
    if (!expanded) return
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions((d.sessions ?? []).filter((s: ResumableSession) => s.id !== sessionId)))
      .catch(() => {})
  }, [expanded, sessionId])

  function handleResume(session: ResumableSession) {
    const restoredState: AppState = {
      stage: session.stage as AppState['stage'],
      chatOpen: true,
      componentName: session.componentName ?? '',
      figmaUrl: session.figmaUrl ?? '',
      figmaDesign: session.figmaDesign ? JSON.parse(session.figmaDesign) : null,
      figmaImageUrl: null,
      messages: JSON.parse(session.messages),
      propSurface: session.propSurface ? JSON.parse(session.propSurface) : null,
      buildStatuses: [],
      buildError: session.errorMessage ?? null,
      commitSha: session.commitSha,
      preBuildSha: session.preBuildSha,
      prUrl: session.prUrl,
      selectedComponent: session.componentName,
    }
    dispatch({ type: 'RESUME_SESSION', state: restoredState })
    // Re-activate the resumed session
    fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    }).catch(() => {})
    setSessions(prev => prev.filter(s => s.id !== session.id))
  }

  const resumableSessions = sessions.filter(s => s.status === 'active' || s.status === 'failed')

  return (
    <aside style={{
      width: expanded ? 220 : 48,
      flexShrink: 0,
      borderRight: '1px solid #1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width .2s ease',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        title={expanded ? 'Collapse sidebar' : 'Components'}
        style={{
          width: 48, height: 48, flexShrink: 0,
          background: 'transparent', border: 'none',
          color: expanded ? '#0BCE83' : '#444',
          fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color .15s',
        }}
      >
        ▣
      </button>

      {expanded && (
        <>
          {resumableSessions.length > 0 && (
            <>
              <div style={{
                padding: '4px 14px 10px',
                fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
                color: '#444', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>
                Sessions
              </div>
              {resumableSessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleResume(s)}
                  title={`Resume ${s.componentName ?? 'session'} (${s.status})`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: s.status === 'failed' ? '#e05555' : '#888',
                    padding: '6px 14px', textAlign: 'left', cursor: 'pointer', fontSize: 13,
                    borderLeft: s.status === 'failed' ? '2px solid #e05555' : '2px solid #333',
                    transition: 'all .15s', whiteSpace: 'nowrap', width: '100%',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {s.componentName ?? 'Untitled'} ↩
                </button>
              ))}
              <div style={{ height: 1, background: '#1a1a1a', margin: '8px 0' }} />
            </>
          )}

          <div style={{
            padding: '4px 14px 10px',
            fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
            color: '#444', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            Components
          </div>
          {components.length === 0 ? (
            <div style={{ padding: '4px 14px', fontSize: 13, color: '#333', whiteSpace: 'nowrap' }}>
              None built yet
            </div>
          ) : (
            components.map(name => (
              <button
                key={name}
                onClick={() => dispatch({ type: 'SELECT_COMPONENT', componentName: name, propSurface: null })}
                style={{
                  background: state.selectedComponent === name ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  color: state.selectedComponent === name ? '#f0f0f0' : '#777',
                  padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: 14,
                  borderLeft: state.selectedComponent === name ? '2px solid #0BCE83' : '2px solid transparent',
                  transition: 'all .15s', whiteSpace: 'nowrap', width: '100%',
                }}
              >
                {name}
              </button>
            ))
          )}
        </>
      )}
    </aside>
  )
}
