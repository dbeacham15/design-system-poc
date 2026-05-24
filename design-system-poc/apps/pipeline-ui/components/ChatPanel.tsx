'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import { extractPropSurface, extractSuggestion, buildGrillSystemPrompt, buildEditSystemPrompt } from '@/lib/grill-prompt'
import { isFigmaUrl, parseFigmaNodeId, extractComponentNameFromDesign } from '@/lib/figma'
import { StreamingMarkdown } from './StreamingMarkdown'
import { PropSurfaceCard } from './PropSurfaceCard'
import { GitHubPRCard } from './GitHubPRCard'
import type { ChatMessage } from '@/lib/pipeline-state'

// Inject animation styles once
if (typeof document !== 'undefined' && !document.getElementById('chat-style')) {
  const s = document.createElement('style')
  s.id = 'chat-style'
  s.textContent = `
    @keyframes chat-pulse { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
    .chat-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#0BCE83;margin:0 2px;animation:chat-pulse 1.2s infinite ease-in-out}
    .chat-dot:nth-child(2){animation-delay:.2s}
    .chat-dot:nth-child(3){animation-delay:.4s}
    @keyframes chat-fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    .chat-msg{animation:chat-fadein .18s ease-out}
  `
  document.head.appendChild(s)
}

type Status = 'idle' | 'fetching-figma' | 'thinking' | 'streaming'

function makeId() { return Math.random().toString(36).slice(2) }

type Chip = { label: string; value: string; disabled: boolean }
const CHIPS: Chip[] = [
  { label: 'Create new component', value: 'I want to create a new component', disabled: false },
  { label: 'Edit component', value: 'I want to edit an existing component', disabled: false },
  { label: 'View design tokens', value: '', disabled: true },
]

export function ChatPanel() {
  const { state, dispatch } = usePipeline()
  const [streamingText, setStreamingText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isLanding = state.stage === 'idle'
  const isBuilding = state.stage === 'building'
  const isLoading = status !== 'idle'
  const isInputDisabled = isLoading || isBuilding

  const lastAssistantMsg = [...state.messages].reverse().find(m => m.role === 'assistant')
  const suggestion = lastAssistantMsg ? extractSuggestion(lastAssistantMsg.content) : null

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [state.messages, streamingText])

  useEffect(() => {
    if (status === 'idle' && !isLanding && state.messages.length > 0) {
      inputRef.current?.focus()
    }
  }, [status, isLanding, state.messages.length])

  const getSystemPrompt = useCallback(() => {
    if (state.stage === 'playground') {
      return buildEditSystemPrompt(state.componentName, state.propSurface)
    }
    return buildGrillSystemPrompt(state.componentName, JSON.stringify(state.figmaDesign ?? {}))
  }, [state.stage, state.componentName, state.figmaDesign, state.propSurface])

  const sendMessage = useCallback(async (userText: string) => {
    const trimmed = userText.trim()
    if (!trimmed) return

    // --- Figma URL handling ---
    if (isFigmaUrl(trimmed)) {
      setStatus('fetching-figma')
      try {
        const nodeId = parseFigmaNodeId(trimmed)
        const res = await fetch('/api/figma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ figmaUrl: trimmed, nodeId }),
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          setError(data.error ?? 'Failed to read Figma design.')
          setStatus('idle')
          return
        }
        const componentName = extractComponentNameFromDesign(data.design, nodeId)
        dispatch({
          type: 'FIGMA_READY',
          figmaUrl: trimmed,
          componentName,
          figmaDesign: data.design,
          figmaImageUrl: data.imageUrl,
        })
        if (data.imageUrl) {
          dispatch({ type: 'ADD_MESSAGE', message: { id: makeId(), role: 'system', content: `__figma_image__${data.imageUrl}` } })
        }
        // After FIGMA_READY, Claude doesn't need a separate kick — the user can type or the
        // system will respond once the user sends their next message. No auto-trigger.
        setStatus('idle')
        return
      } catch (err) {
        setError(String(err))
        setStatus('idle')
        return
      }
    }

    // --- Transition from landing to chat thread ---
    if (state.stage === 'idle') {
      dispatch({ type: 'START_CHAT' })
    }

    // Add user message to state
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: trimmed }
    dispatch({ type: 'ADD_MESSAGE', message: userMsg })

    // Build messages array for API (include new message)
    const apiMessages = [
      ...state.messages.filter(m => m.role === 'user' || m.role === 'assistant'),
      { role: 'user' as const, content: trimmed },
    ]

    setStatus('thinking')
    setStreamingText('')
    setError(null)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          componentName: state.componentName,
          figmaDesign: state.figmaDesign,
          systemPrompt: getSystemPrompt(),
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''
      setStatus('streaming')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const parsed = JSON.parse(raw)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.t) { accumulated += parsed.t; setStreamingText(accumulated) }
          } catch (e) {
            if ((e as Error).message !== 'Unexpected token') throw e
          }
        }
      }

      const assistantMsg: ChatMessage = { id: makeId(), role: 'assistant', content: accumulated }
      dispatch({ type: 'ADD_MESSAGE', message: assistantMsg })
      setStreamingText('')
      setStatus('idle')

      // Detect prop surface
      const surface = extractPropSurface(accumulated)
      if (surface) dispatch({ type: 'PROP_SURFACE_READY', propSurface: surface })

    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(String(err))
      setStatus('idle')
    }
  }, [state.messages, state.stage, state.componentName, state.figmaDesign, dispatch, getSystemPrompt])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isInputDisabled) return
    const text = input.trim() || suggestion || ''
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  // ── Landing mode (stage === 'idle') ─────────────────────────────────────────
  if (isLanding) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 28 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#f0f0f0', textAlign: 'center', letterSpacing: '-0.02em' }}>
          What do you want to build today?
        </h1>

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 500, display: 'flex', gap: 8, padding: '0 24px', boxSizing: 'border-box' }}>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe a component or paste a Figma URL…"
            disabled={status === 'fetching-figma'}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 8,
              border: '1px solid #2a2a2a', background: '#111',
              color: '#f0f0f0', fontSize: 15, outline: 'none',
              opacity: status === 'fetching-figma' ? 0.6 : 1,
            }}
          />
          <button
            type="submit"
            disabled={status === 'fetching-figma' || !input.trim()}
            style={{
              padding: '12px 20px', borderRadius: 8, border: 'none',
              background: status === 'fetching-figma' || !input.trim() ? '#1a1a1a' : '#0BCE83',
              color: status === 'fetching-figma' || !input.trim() ? '#444' : '#000',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {status === 'fetching-figma' ? 'Reading Figma…' : 'Start'}
          </button>
        </form>

        {error && (
          <div style={{ maxWidth: 500, width: '100%', padding: '10px 16px', background: '#2a1a1a', border: '1px solid #5a2a2a', borderRadius: 8, fontSize: 13, color: '#ff6b6b', boxSizing: 'border-box', margin: '0 24px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', padding: '0 24px' }}>
          {CHIPS.map(chip => (
            <button
              key={chip.label}
              disabled={chip.disabled || status === 'fetching-figma'}
              onClick={() => { if (!chip.disabled) sendMessage(chip.value) }}
              style={{
                padding: '8px 18px', borderRadius: 20,
                border: `1px solid ${chip.disabled ? '#1e1e1e' : '#2a2a2a'}`,
                background: 'transparent',
                color: chip.disabled ? '#2e2e2e' : '#666',
                fontSize: 13, cursor: chip.disabled ? 'default' : 'pointer',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Chat thread mode (stage !== 'idle') ─────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>
          {state.componentName || 'Chat'}
        </span>
        <StatusDot status={status} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {state.messages.map(msg => {
          if (msg.role === 'system') {
            if (msg.content.startsWith('__figma_image__')) {
              const imgUrl = msg.content.slice('__figma_image__'.length)
              return <FigmaThumbnail key={msg.id} url={imgUrl} />
            }
            return <SystemBubble key={msg.id} text={msg.content} />
          }
          const displayText = msg.content.replace(/\[PROP_SURFACE\][\s\S]*?\[\/PROP_SURFACE\]/g, '').trim()
          const surface = msg.role === 'assistant' ? extractPropSurface(msg.content) : null
          return (
            <div key={msg.id}>
              {displayText && <Bubble role={msg.role} text={displayText} streaming={false} />}
              {surface && <PropSurfaceCard surface={surface} />}
            </div>
          )
        })}

        {status === 'fetching-figma' && (
          <div className="chat-msg" style={{ alignSelf: 'flex-start' }}>
            <div style={{ background: '#1a1a1a', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#0BCE83' }}>
              Fetching Figma design…
            </div>
          </div>
        )}

        {status === 'thinking' && (
          <div className="chat-msg" style={{ alignSelf: 'flex-start' }}>
            <div style={{ background: '#1a1a1a', padding: '14px 18px', borderRadius: 12, display: 'flex', gap: 4 }}>
              <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
            </div>
          </div>
        )}

        {status === 'streaming' && streamingText && (
          <Bubble role="assistant" text={streamingText} streaming />
        )}

        {state.buildStatuses.map((s, i) => (
          <SystemBubble key={i} text={s} />
        ))}

        {state.buildError && (
          <div className="chat-msg" style={{ alignSelf: 'center', maxWidth: '90%' }}>
            <div style={{ background: '#2a1a1a', border: '1px solid #5a2a2a', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#ff6b6b' }}>
              <strong>Build failed:</strong> {state.buildError}
              <br />
              <span style={{ color: '#888', fontSize: 12 }}>Describe what you'd like to change and I'll help fix it.</span>
            </div>
          </div>
        )}

        {state.prUrl && (
          <GitHubPRCard prUrl={state.prUrl} componentName={state.componentName} />
        )}

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: 13, padding: '8px 12px', background: '#2a1a1a', borderRadius: 8 }}>{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: '12px 20px', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {suggestion && !isInputDisabled && (
          <p style={{ margin: 0, fontSize: 12, color: '#0BCE83', paddingLeft: 2 }}>
            Press Enter to accept suggestion
          </p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isBuilding ? 'Building component…' : isLoading ? 'Claude is responding…' : suggestion ?? 'Message…'}
            disabled={isInputDisabled}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${suggestion && !isInputDisabled && !input ? '#0BCE8366' : '#2a2a2a'}`,
              background: '#111', color: '#f0f0f0', fontSize: 14, outline: 'none',
              opacity: isInputDisabled ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={isInputDisabled || (!input.trim() && !suggestion)}
            style={{
              padding: '10px 16px', borderRadius: 8, border: 'none',
              background: isInputDisabled || (!input.trim() && !suggestion) ? '#1a1a1a' : '#0BCE83',
              color: isInputDisabled || (!input.trim() && !suggestion) ? '#444' : '#000',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {input.trim() ? 'Send' : suggestion ? 'Accept ↵' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({ role, text, streaming }: { role: 'user' | 'assistant'; text: string; streaming: boolean }) {
  const isUser = role === 'user'
  return (
    <div className="chat-msg" style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
      <div style={{
        background: isUser ? '#0BCE83' : '#1a1a1a',
        color: isUser ? '#000' : '#f0f0f0',
        padding: '10px 14px', borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        fontSize: 14, lineHeight: 1.65,
      }}>
        {isUser ? text : <StreamingMarkdown text={text} streaming={streaming} />}
      </div>
    </div>
  )
}

function SystemBubble({ text }: { text: string }) {
  return (
    <div className="chat-msg" style={{ alignSelf: 'center' }}>
      <div style={{ fontSize: 12, color: '#555', background: '#111', border: '1px solid #1e1e1e', padding: '6px 12px', borderRadius: 6 }}>
        {text}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: Status }) {
  const color = status === 'idle' ? '#333' : status === 'thinking' ? '#f5a623' : '#0BCE83'
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', transition: 'background .2s' }} />
}

function FigmaThumbnail({ url }: { url: string }) {
  return (
    <div className="chat-msg" style={{ alignSelf: 'flex-start', maxWidth: '100%' }}>
      <div style={{ background: '#1a1a1a', borderRadius: 10, padding: '10px 12px', border: '1px solid #2a2a2a' }}>
        <div style={{ fontSize: 11, color: '#0BCE83', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>FIGMA DESIGN LOADED</div>
        <img
          src={url}
          alt="Figma component design"
          style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, display: 'block', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}
