'use client'
import { useEffect, useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import type { AppState, PropSurface } from '@/lib/pipeline-state'

// ─── Token Panel ─────────────────────────────────────────────────────────────

const COLOR_GROUPS = [
  { label: 'Interactive', tokens: [
    { css: '--color-interactive',          tip: 'interactive' },
    { css: '--color-interactive-hover',    tip: 'hover' },
    { css: '--color-interactive-active',   tip: 'active' },
    { css: '--color-interactive-disabled', tip: 'disabled' },
  ]},
  { label: 'Surface', tokens: [
    { css: '--color-surface',         tip: 'surface' },
    { css: '--color-surface-raised',  tip: 'raised' },
    { css: '--color-surface-overlay', tip: 'overlay' },
  ]},
  { label: 'Text', tokens: [
    { css: '--color-text-primary',        tip: 'primary' },
    { css: '--color-text-secondary',      tip: 'secondary' },
    { css: '--color-text-disabled',       tip: 'disabled' },
    { css: '--color-text-on-interactive', tip: 'on-interactive' },
  ]},
  { label: 'Border', tokens: [
    { css: '--color-border',       tip: 'border' },
    { css: '--color-border-focus', tip: 'focus' },
  ]},
  { label: 'Status', tokens: [
    { css: '--color-status-success', tip: 'success' },
    { css: '--color-status-error',   tip: 'error' },
    { css: '--color-status-warning', tip: 'warning' },
  ]},
]

const TYPE_TOKENS = [
  { css: '--font-size-xs', label: 'xs', px: '11' },
  { css: '--font-size-sm', label: 'sm', px: '13' },
  { css: '--font-size-md', label: 'md', px: '15' },
  { css: '--font-size-lg', label: 'lg', px: '18' },
  { css: '--font-size-xl', label: 'xl', px: '24' },
]

const SPACE_TOKENS = [
  { css: '--space-xs',  label: 'xs',  px: 4  },
  { css: '--space-sm',  label: 'sm',  px: 8  },
  { css: '--space-md',  label: 'md',  px: 16 },
  { css: '--space-lg',  label: 'lg',  px: 24 },
  { css: '--space-xl',  label: 'xl',  px: 32 },
  { css: '--space-2xl', label: '2xl', px: 48 },
]

type ThemeMode = 'system' | 'dark' | 'light'
type TokenTab  = 'color' | 'type' | 'space'

const THEME_ICONS: Record<ThemeMode, string> = { system: '◐', dark: '🌙', light: '☀' }
const THEME_CYCLE: Record<ThemeMode, ThemeMode> = { system: 'dark', dark: 'light', light: 'system' }

function TokenPanel() {
  const [tab,   setTab]   = useState<TokenTab>('color')
  const [theme, setTheme] = useState<ThemeMode>('system')

  function cycleTheme() {
    const next = THEME_CYCLE[theme]
    setTheme(next)
    if (next === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', next)
    }
  }

  const tabBtn = (t: TokenTab) => ({
    flex: 1 as const,
    background: tab === t ? '#111' : 'transparent',
    border: 'none' as const,
    borderBottom: tab === t ? '1px solid #0BCE83' : '1px solid #222',
    color: tab === t ? '#ccc' : '#3a3a3a',
    fontSize: 9,
    letterSpacing: '.1em' as const,
    textTransform: 'uppercase' as const,
    padding: '4px 0',
    cursor: 'pointer' as const,
    transition: 'all .15s',
  })

  return (
    <div style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: 4 }}>
      {/* Header row */}
      <div style={{
        padding: '10px 14px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
          color: '#3a3a3a', textTransform: 'uppercase',
        }}>
          Tokens
        </span>

        <button
          onClick={cycleTheme}
          title={`Active theme: ${theme} — click to cycle`}
          style={{
            background: 'transparent',
            border: '1px solid #222',
            color: '#444',
            fontSize: 12,
            cursor: 'pointer',
            padding: '1px 7px',
            borderRadius: 4,
            lineHeight: 1.6,
            transition: 'all .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#0BCE83'
            e.currentTarget.style.color = '#0BCE83'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#222'
            e.currentTarget.style.color = '#444'
          }}
        >
          {THEME_ICONS[theme]}
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', padding: '0 14px', gap: 3, marginBottom: 8 }}>
        <button style={tabBtn('color')} onClick={() => setTab('color')}>Color</button>
        <button style={tabBtn('type')}  onClick={() => setTab('type')}>Type</button>
        <button style={tabBtn('space')} onClick={() => setTab('space')}>Space</button>
      </div>

      {/* ── Color tab ───────────────────────────────────────────── */}
      {tab === 'color' && (
        <div style={{ padding: '2px 14px 10px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {COLOR_GROUPS.map(group => (
            <div key={group.label}>
              <div style={{
                fontSize: 9, letterSpacing: '.1em', color: '#2a2a2a',
                textTransform: 'uppercase', marginBottom: 5,
              }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {group.tokens.map(token => (
                  <div
                    key={token.css}
                    title={token.css}
                    style={{
                      width: 16, height: 16,
                      borderRadius: '50%',
                      background: `var(${token.css})`,
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 1px 4px rgba(0,0,0,.4)',
                      cursor: 'default',
                      flexShrink: 0,
                      transition: 'background .3s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Type tab ────────────────────────────────────────────── */}
      {tab === 'type' && (
        <div style={{ padding: '2px 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {TYPE_TOKENS.map(token => (
            <div
              key={token.css}
              title={token.css}
              style={{ display: 'flex', alignItems: 'baseline', gap: 10, overflow: 'hidden' }}
            >
              <span style={{
                fontSize: `var(${token.css})`,
                color: '#d0d0d0',
                lineHeight: 1,
                fontFamily: 'Georgia, serif',
                flexShrink: 0,
                transition: 'font-size .2s',
              }}>
                Aa
              </span>
              <span style={{
                fontSize: 9, color: '#333',
                fontFamily: 'monospace',
                letterSpacing: '.04em',
                whiteSpace: 'nowrap',
              }}>
                {token.label} · {token.px}px
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Space tab ───────────────────────────────────────────── */}
      {tab === 'space' && (
        <div style={{ padding: '2px 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SPACE_TOKENS.map((token, i) => (
            <div key={token.css} title={token.css} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: Math.round((token.px / 48) * 120),
                minWidth: 3,
                height: 5,
                background: 'var(--color-interactive)',
                borderRadius: 3,
                opacity: 0.2 + (i / (SPACE_TOKENS.length - 1)) * 0.8,
                flexShrink: 0,
                transition: 'width .2s, background .3s ease',
              }} />
              <span style={{
                fontSize: 9, color: '#333',
                fontFamily: 'monospace',
                letterSpacing: '.04em',
                whiteSpace: 'nowrap',
              }}>
                {token.label} · {token.px}px
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

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

  async function handleSelectComponent(name: string) {
    let propSurface: PropSurface | null = null
    try {
      const res = await fetch(`/api/components/${encodeURIComponent(name)}`)
      if (res.ok) propSurface = await res.json()
    } catch { /* non-fatal */ }
    dispatch({ type: 'SELECT_COMPONENT', componentName: name, propSurface })
  }

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
      needsRebuild: false,
      propValues: {},
    }
    dispatch({ type: 'RESUME_SESSION', state: restoredState })
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
      {/* New session button */}
      <button
        onClick={() => dispatch({ type: 'RESET' })}
        title="New session"
        style={{
          width: 48, height: 48, flexShrink: 0,
          background: 'transparent', border: 'none',
          color: '#444', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color .15s',
          borderBottom: '1px solid #1a1a1a',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#0BCE83')}
        onMouseLeave={e => (e.currentTarget.style.color = '#444')}
      >
        +
      </button>

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
          {/* Token showcase — top of sidebar */}
          <TokenPanel />

          {resumableSessions.length > 0 && (
            <>
              <div style={{
                padding: '10px 14px 6px',
                fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
                color: '#3a3a3a', textTransform: 'uppercase', whiteSpace: 'nowrap',
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
            padding: '10px 14px 6px',
            fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
            color: '#3a3a3a', textTransform: 'uppercase', whiteSpace: 'nowrap',
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
                onClick={() => handleSelectComponent(name)}
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
