'use client'
import { useEffect, useState, useCallback } from 'react'
import { ComponentSidebar } from '@/components/ComponentSidebar'

// ─── helpers ──────────────────────────────────────────────────────────────────

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!m) return '—'
  return (
    '#' +
    [m[1], m[2], m[3]]
      .map(n => parseInt(n).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

function resolveColorVar(cssVar: string): string {
  const el = document.createElement('div')
  el.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
  el.style.backgroundColor = `var(${cssVar})`
  document.body.appendChild(el)
  const hex = rgbToHex(getComputedStyle(el).backgroundColor)
  document.body.removeChild(el)
  return hex
}

// ─── token data ───────────────────────────────────────────────────────────────

const COLOR_GROUPS = [
  {
    label: 'Interactive',
    tokens: [
      { css: '--color-interactive', label: 'default' },
      { css: '--color-interactive-hover', label: 'hover' },
      { css: '--color-interactive-active', label: 'active' },
      { css: '--color-interactive-disabled', label: 'disabled' },
      { css: '--color-text-on-interactive', label: 'on-interactive' },
    ],
  },
  {
    label: 'Surface',
    tokens: [
      { css: '--color-surface', label: 'default' },
      { css: '--color-surface-raised', label: 'raised' },
      { css: '--color-surface-overlay', label: 'overlay' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { css: '--color-text-primary', label: 'primary' },
      { css: '--color-text-secondary', label: 'secondary' },
      { css: '--color-text-disabled', label: 'disabled' },
    ],
  },
  {
    label: 'Border',
    tokens: [
      { css: '--color-border', label: 'default' },
      { css: '--color-border-focus', label: 'focus' },
    ],
  },
  {
    label: 'Status',
    tokens: [
      { css: '--color-status-success', label: 'success' },
      { css: '--color-status-error', label: 'error' },
      { css: '--color-status-warning', label: 'warning' },
    ],
  },
]

const ALL_COLOR_VARS = COLOR_GROUPS.flatMap(g => g.tokens.map(t => t.css))

const TYPE_SCALE = [
  { css: '--font-size-xl', label: 'xl', px: 24, sample: 'Design tokens are the atoms of a design system' },
  { css: '--font-size-lg', label: 'lg', px: 18, sample: 'Semantic tokens carry intent across themes' },
  { css: '--font-size-md', label: 'md', px: 15, sample: 'Components reference only semantic tokens, never primitives' },
  { css: '--font-size-sm', label: 'sm', px: 13, sample: 'Theme overrides redefine semantic tokens — primitives are shared' },
  { css: '--font-size-xs', label: 'xs', px: 11, sample: 'SUPPORTING LABEL — secondary captions and badges' },
]

const WEIGHT_SCALE = [
  { css: '--font-weight-normal', label: 'normal', value: 400 },
  { css: '--font-weight-medium', label: 'medium', value: 500 },
  { css: '--font-weight-semibold', label: 'semibold', value: 600 },
  { css: '--font-weight-bold', label: 'bold', value: 700 },
]

const LINE_HEIGHT_SCALE = [
  { css: '--line-height-tight', label: 'tight', value: 1.2, note: 'headings' },
  { css: '--line-height-normal', label: 'normal', value: 1.5, note: 'body text' },
  { css: '--line-height-relaxed', label: 'relaxed', value: 1.75, note: 'long-form' },
]

const SPACE_SCALE = [
  { css: '--space-2xl', label: '2xl', px: 48 },
  { css: '--space-xl', label: 'xl', px: 32 },
  { css: '--space-lg', label: 'lg', px: 24 },
  { css: '--space-md', label: 'md', px: 16 },
  { css: '--space-sm', label: 'sm', px: 8 },
  { css: '--space-xs', label: 'xs', px: 4 },
]

const RADIUS_SCALE = [
  { css: '--radius-sm', label: 'sm', px: 4 },
  { css: '--radius-md', label: 'md', px: 8 },
  { css: '--radius-lg', label: 'lg', px: 12 },
  { css: '--radius-full', label: 'full', px: 9999 },
]

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        color: 'var(--shell-accent)',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--shell-border-sub)' }} />
    </div>
  )
}

function ColorSwatch({
  css: cssVar,
  label,
  hex,
}: {
  css: string
  label: string
  hex: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        title={`${cssVar} → ${hex}`}
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: `var(${cssVar})`,
          border: '1px solid rgba(128,128,128,0.12)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          transition: 'background 0.3s',
          flexShrink: 0,
        }}
      />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--shell-text)',
        letterSpacing: '0.04em',
        lineHeight: 1.2,
        transition: 'color 0.3s',
      }}>
        {hex}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 8.5,
        color: 'var(--shell-text-3)',
        letterSpacing: '0.02em',
        lineHeight: 1.3,
        wordBreak: 'break-all' as const,
        maxWidth: 80,
      }}>
        {cssVar}
      </span>
      <span style={{
        fontSize: 11,
        color: 'var(--shell-text-2)',
        fontFamily: 'var(--font-ui)',
        lineHeight: 1.2,
      }}>
        {label}
      </span>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TokensPage() {
  const [resolvedColors, setResolvedColors] = useState<Record<string, string>>({})

  const resolveColors = useCallback(() => {
    const resolved: Record<string, string> = {}
    ALL_COLOR_VARS.forEach(cssVar => {
      resolved[cssVar] = resolveColorVar(cssVar)
    })
    setResolvedColors(resolved)
  }, [])

  useEffect(() => {
    resolveColors()

    // Re-resolve when data-theme attribute changes (manual toggle)
    const observer = new MutationObserver(resolveColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    // Re-resolve when OS color scheme changes (system theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', resolveColors)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', resolveColors)
    }
  }, [resolveColors])

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--shell-bg)',
      }}
    >
      <ComponentSidebar />

      {/* ── main scroll area ────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '48px 56px 80px',
        }}
      >
        <div style={{ maxWidth: 920 }}>

          {/* ── page header ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 64, borderBottom: '1px solid var(--shell-border-sub)', paddingBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
              <h1 style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                color: 'var(--shell-text)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                Design Tokens
              </h1>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--shell-text-3)',
                letterSpacing: '0.06em',
                paddingBottom: 1,
              }}>
                tokens.json
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--shell-text-2)',
              lineHeight: 1.6,
              maxWidth: 560,
            }}>
              The canonical token vocabulary for the Living Design System.
              Components reference only <strong style={{ color: 'var(--shell-text)', fontWeight: 500 }}>semantic tokens</strong> — primitives
              are never used directly. Theme overrides redefine semantic tokens only.
            </p>
          </div>

          {/* ── COLOR ───────────────────────────────────────────────────────── */}
          <section style={{ marginBottom: 64 }}>
            <SectionHeader label="Color" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {COLOR_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--shell-text-3)',
                    marginBottom: 16,
                  }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                    {group.tokens.map(token => (
                      <ColorSwatch
                        key={token.css}
                        css={token.css}
                        label={token.label}
                        hex={resolvedColors[token.css] ?? '—'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── TYPOGRAPHY ──────────────────────────────────────────────────── */}
          <section style={{ marginBottom: 64 }}>
            <SectionHeader label="Typography" />

            {/* Font size scale */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--shell-text-3)',
              marginBottom: 20,
            }}>
              Size Scale
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              marginBottom: 40,
              border: '1px solid var(--shell-border-sub)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              {TYPE_SCALE.map((token, i) => (
                <div
                  key={token.css}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 24,
                    padding: '14px 20px',
                    background: i % 2 === 0 ? 'transparent' : 'var(--shell-surface)',
                    borderTop: i > 0 ? '1px solid var(--shell-border-sub)' : 'none',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{
                    fontSize: `var(${token.css})`,
                    color: 'var(--shell-text)',
                    lineHeight: 1.3,
                    flexShrink: 0,
                    maxWidth: '70%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-ui)',
                  }}>
                    {token.sample}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexShrink: 0,
                    marginLeft: 'auto',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--shell-accent)',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>
                      {token.label} · {token.px}px
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--shell-text-3)',
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                    }}>
                      {token.css}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Font weight + line height side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Font weights */}
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--shell-text-3)',
                  marginBottom: 16,
                }}>
                  Weight
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {WEIGHT_SCALE.map(w => (
                    <div key={w.css} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 15,
                        fontWeight: w.value,
                        color: 'var(--shell-text)',
                        width: 120,
                        flexShrink: 0,
                      }}>
                        {w.label}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--shell-text-3)',
                        letterSpacing: '0.04em',
                      }}>
                        {w.value} · {w.css}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line heights */}
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--shell-text-3)',
                  marginBottom: 16,
                }}>
                  Line Height
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {LINE_HEIGHT_SCALE.map(lh => (
                    <div key={lh.css} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 13,
                        lineHeight: lh.value,
                        color: 'var(--shell-text)',
                        width: 80,
                        flexShrink: 0,
                        background: 'var(--shell-surface)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--shell-border-sub)',
                      }}>
                        Ag<br/>Ty
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--shell-accent)',
                          letterSpacing: '0.06em',
                        }}>
                          {lh.label} · {lh.value}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--shell-text-3)',
                        }}>
                          {lh.note}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── SPACING & BORDER RADIUS side by side ────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 64 }}>

            {/* SPACING */}
            <section>
              <SectionHeader label="Spacing" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {SPACE_SCALE.map((token, i) => (
                  <div key={token.css} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* proportional bar */}
                    <div style={{
                      height: 6,
                      width: `${Math.round((token.px / 48) * 180)}px`,
                      minWidth: 3,
                      background: 'var(--shell-accent)',
                      borderRadius: 3,
                      opacity: 0.3 + (i / (SPACE_SCALE.length - 1)) * 0.7,
                      flexShrink: 0,
                      transition: 'background 0.3s',
                    }} />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--shell-accent)',
                        letterSpacing: '0.06em',
                        flexShrink: 0,
                      }}>
                        {token.label}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--shell-text-3)',
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                      }}>
                        {token.px}px · {token.css}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* BORDER RADIUS */}
            <section>
              <SectionHeader label="Border Radius" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {RADIUS_SCALE.map(token => (
                  <div key={token.css} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* shape demo */}
                    <div style={{
                      width: 56,
                      height: 36,
                      borderRadius: `var(${token.css})`,
                      background: 'var(--shell-surface)',
                      border: '1px solid var(--shell-border)',
                      flexShrink: 0,
                      transition: 'background 0.3s, border-color 0.3s',
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--shell-accent)',
                        letterSpacing: '0.06em',
                      }}>
                        {token.label} · {token.px === 9999 ? '∞' : `${token.px}px`}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--shell-text-3)',
                        letterSpacing: '0.03em',
                      }}>
                        {token.css}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  )
}
