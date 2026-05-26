'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePipeline } from '@/lib/pipeline-context'
import type { AppState, PropSurface } from '@/lib/pipeline-state'

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

function IconTokens() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4.5" cy="4.5" r="2.5" opacity="1" />
      <circle cx="11.5" cy="4.5" r="2.5" opacity="0.6" />
      <circle cx="4.5" cy="11.5" r="2.5" opacity="0.35" />
      <circle cx="11.5" cy="11.5" r="2.5" opacity="0.15" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11L5 7l4-4" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1" x2="8" y2="2.5" />
      <line x1="8" y1="13.5" x2="8" y2="15" />
      <line x1="1" y1="8" x2="2.5" y2="8" />
      <line x1="13.5" y1="8" x2="15" y2="8" />
      <line x1="3.05" y1="3.05" x2="4.1" y2="4.1" />
      <line x1="11.9" y1="11.9" x2="12.95" y2="12.95" />
      <line x1="12.95" y1="3.05" x2="11.9" y2="4.1" />
      <line x1="4.1" y1="11.9" x2="3.05" y2="12.95" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z" />
    </svg>
  )
}

function IconHalfCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2v12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2A6 6 0 018 14" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconResume() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6H2M5 3L2 6l3 3" />
    </svg>
  )
}

// ─── Theme Toggle Button ──────────────────────────────────────────────────────

type ThemeMode = 'system' | 'dark' | 'light'
const THEME_CYCLE: Record<ThemeMode, ThemeMode> = { system: 'dark', dark: 'light', light: 'system' }
const THEME_LABELS: Record<ThemeMode, string> = { system: 'System', dark: 'Dark', light: 'Light' }

function ThemeToggle({ expanded, theme, onCycle }: {
  expanded: boolean
  theme: ThemeMode
  onCycle: () => void
}) {
  const Icon = theme === 'light' ? IconSun : theme === 'dark' ? IconMoon : IconHalfCircle

  if (!expanded) {
    return (
      <button
        onClick={onCycle}
        title={`Theme: ${theme} — click to cycle`}
        className="sidebar-btn-icon"
        style={{ color: theme !== 'system' ? 'var(--shell-accent)' : undefined }}
      >
        <Icon />
      </button>
    )
  }

  return (
    <button
      onClick={onCycle}
      title="Cycle theme"
      className="sidebar-btn"
      style={{
        color: theme !== 'system' ? 'var(--shell-accent)' : undefined,
        fontSize: 12,
      }}
    >
      <Icon />
      <span style={{ flex: 1, textAlign: 'left' }}>{THEME_LABELS[theme]}</span>
    </button>
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
  const pathname = usePathname()
  const router = useRouter()
  const onTokensPage = pathname === '/tokens'
  const [expanded, setExpanded] = useState(() => pathname === '/tokens')
  const [components, setComponents] = useState<string[]>([])
  const [sessions, setSessions] = useState<ResumableSession[]>([])
  const [theme, setTheme] = useState<ThemeMode>('system')

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

  function cycleTheme() {
    const next = THEME_CYCLE[theme]
    setTheme(next)
    if (next === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', next)
    }
  }

  async function handleSelectComponent(name: string) {
    let propSurface: PropSurface | null = null
    try {
      const res = await fetch(`/api/components/${encodeURIComponent(name)}`)
      if (res.ok) propSurface = await res.json()
    } catch { /* non-fatal */ }
    dispatch({ type: 'SELECT_COMPONENT', componentName: name, propSurface })
    // On the tokens page AppShell isn't mounted, so its URL-write effect won't
    // fire. Navigate explicitly so the component page loads.
    if (onTokensPage) {
      router.push(`/components/${encodeURIComponent(name)}`)
    }
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

  // ── Collapsed sidebar ───────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <aside style={{
        width: 56,
        flexShrink: 0,
        borderRight: '1px solid var(--shell-border-sub)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--shell-bg)',
      }}>
        {/* New session */}
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          title="New session"
          className="sidebar-btn-icon"
          style={{ height: 52, borderBottom: '1px solid var(--shell-border-sub)' }}
        >
          <IconPlus />
        </button>

        {/* Expand library */}
        <button
          onClick={() => setExpanded(true)}
          title="Component library"
          className="sidebar-btn-icon"
          style={{ height: 44 }}
        >
          <IconGrid />
        </button>

        {/* Tokens */}
        <button
          onClick={() => router.push('/tokens')}
          title="Design tokens"
          className={`sidebar-btn-icon${onTokensPage ? ' active' : ''}`}
          style={{ height: 44 }}
        >
          <IconTokens />
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <div style={{ borderTop: '1px solid var(--shell-border-sub)' }}>
          <ThemeToggle expanded={false} theme={theme} onCycle={cycleTheme} />
        </div>
      </aside>
    )
  }

  // ── Expanded sidebar ────────────────────────────────────────────────────────
  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      borderRight: '1px solid var(--shell-border-sub)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--shell-bg)',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 10px 8px 14px',
        borderBottom: '1px solid var(--shell-border-sub)',
        height: 52,
        flexShrink: 0,
      }}>
        <button
          onClick={() => setExpanded(false)}
          title="Collapse sidebar"
          style={{
            background: 'none', border: 'none',
            color: 'var(--shell-text-3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', padding: '4px',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--shell-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--shell-text-3)')}
        >
          <IconChevronLeft />
        </button>
        <span style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
          color: 'var(--shell-text-2)', flex: 1,
        }}>
          Library
        </span>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          title="New session"
          style={{
            background: 'none', border: '1px solid var(--shell-border)',
            color: 'var(--shell-text-2)',
            borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px',
            fontSize: 11, fontWeight: 500,
            fontFamily: 'var(--font-ui)',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--shell-accent)'
            e.currentTarget.style.borderColor = 'var(--shell-accent)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--shell-text-2)'
            e.currentTarget.style.borderColor = 'var(--shell-border)'
          }}
        >
          <IconPlus />
          New
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Tokens link */}
        <button
          onClick={() => router.push('/tokens')}
          className={`sidebar-btn${onTokensPage ? ' active' : ''}`}
          style={{ width: '100%', borderBottom: '1px solid var(--shell-border-sub)' }}
        >
          <IconTokens />
          <span style={{ flex: 1, textAlign: 'left' }}>Tokens</span>
        </button>

        {/* Sessions */}
        {resumableSessions.length > 0 && (
          <>
            <div className="sidebar-section-label">Sessions</div>
            {resumableSessions.map(s => (
              <button
                key={s.id}
                onClick={() => handleResume(s)}
                title={`Resume ${s.componentName ?? 'session'} (${s.status})`}
                className="component-item"
                style={{
                  color: s.status === 'failed' ? 'var(--shell-error)' : undefined,
                  borderLeftColor: s.status === 'failed' ? 'var(--shell-error)' : 'transparent',
                }}
              >
                <IconResume />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.componentName ?? 'Untitled'}
                </span>
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--shell-border-sub)', margin: '6px 0' }} />
          </>
        )}

        {/* Components */}
        <div className="sidebar-section-label">Components</div>
        {components.length === 0 ? (
          <div style={{
            padding: '6px 14px', fontSize: 12,
            color: 'var(--shell-text-3)',
            fontStyle: 'italic',
          }}>
            None built yet
          </div>
        ) : (
          components.map(name => (
            <button
              key={name}
              onClick={() => handleSelectComponent(name)}
              className={`component-item ${state.selectedComponent === name ? 'selected' : ''}`}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: state.selectedComponent === name
                  ? 'var(--shell-accent)'
                  : 'var(--shell-border)',
                transition: 'background 0.15s',
              }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Footer: theme toggle */}
      <div style={{ borderTop: '1px solid var(--shell-border-sub)', flexShrink: 0 }}>
        <ThemeToggle expanded={true} theme={theme} onCycle={cycleTheme} />
      </div>
    </aside>
  )
}
