'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import { extractPropSurface, extractSuggestion, buildGrillSystemPrompt, buildLandingSystemPrompt, extractIntent } from '@/lib/grill-prompt'
import { StreamingMarkdown } from './StreamingMarkdown'
import { PropSurfaceCard } from './PropSurfaceCard'
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

type Status = 'idle' | 'thinking' | 'streaming'

const GRILL_TRIGGER = 'Please begin the grill session by asking your first question about the component.'
const LANDING_TRIGGER = 'Greet the designer briefly and ask what they want to build or change today.'

function makeId() { return Math.random().toString(36).slice(2) }

export function ChatPanel() {
  const { state, dispatch } = usePipeline()
  const [streamingText, setStreamingText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const triggeredRef = useRef(false)

  const lastAssistantMsg = [...state.messages].reverse().find(m => m.role === 'assistant')
  const suggestion = lastAssistantMsg ? extractSuggestion(lastAssistantMsg.content) : null

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [state.messages, streamingText])

  useEffect(() => {
    if (status === 'idle' && state.messages.length > 0) inputRef.current?.focus()
  }, [status, state.messages.length])

  const getSystemPrompt = useCallback(() => {
    if (state.stage === 'idle') return buildLandingSystemPrompt()
    return buildGrillSystemPrompt(state.componentName, JSON.stringify(state.figmaDesign ?? {}))
  }, [state.stage, state.componentName, state.figmaDesign])

  const sendMessage = useCallback(async (userText: string, silent = false) => {
    const newMessages: ChatMessage[] = userText && !silent
      ? [...state.messages, { id: makeId(), role: 'user', content: userText }]
      : [...state.messages]

    if (userText && !silent) {
      dispatch({ type: 'ADD_MESSAGE', message: { id: makeId(), role: 'user', content: userText } })
    }

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
          messages: newMessages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
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

      // Detect intent signal from landing chat
      if (state.stage === 'idle') {
        const detected = extractIntent(accumulated)
        if (detected) {
          dispatch({ type: 'SET_INTENT', intent: detected.intent, componentName: detected.componentName })
        }
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(String(err))
      setStatus('idle')
    }
  }, [state.messages, state.componentName, state.figmaDesign, dispatch, getSystemPrompt])

  // Auto-trigger on mount (fires once)
  useEffect(() => {
    if (triggeredRef.current) return
    triggeredRef.current = true
    const trigger = state.stage === 'idle' ? LANDING_TRIGGER : GRILL_TRIGGER
    sendMessage(trigger, true)
  }, []) // intentionally empty — only fires once on mount

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status !== 'idle') return
    const text = input.trim() || suggestion || ''
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  const isLoading = status !== 'idle'
  const showThinking = status === 'thinking'
  const showStreaming = status === 'streaming' && streamingText

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>
          {state.stage === 'idle' ? 'Design System' : state.componentName || 'Chat'}
        </span>
        <StatusDot status={status} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {state.messages.map(msg => {
          if (msg.role === 'system') {
            return <SystemBubble key={msg.id} text={msg.content} />
          }
          // Strip [PROP_SURFACE] blocks from display text
          const displayText = msg.content.replace(/\[PROP_SURFACE\][\s\S]*?\[\/PROP_SURFACE\]/g, '').trim()
          const surface = msg.role === 'assistant' ? extractPropSurface(msg.content) : null
          return (
            <div key={msg.id}>
              {displayText && <Bubble role={msg.role} text={displayText} streaming={false} />}
              {surface && <PropSurfaceCard surface={surface} />}
            </div>
          )
        })}

        {showThinking && (
          <div className="chat-msg" style={{ alignSelf: 'flex-start' }}>
            <div style={{ background: '#1a1a1a', padding: '14px 18px', borderRadius: 12, display: 'flex', gap: 4 }}>
              <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
            </div>
          </div>
        )}

        {showStreaming && (
          <Bubble role="assistant" text={streamingText} streaming />
        )}

        {/* Build status bubbles */}
        {state.buildStatuses.map((s, i) => (
          <SystemBubble key={i} text={s} />
        ))}
        {state.buildError && (
          <SystemBubble text={`Build failed: ${state.buildError}`} />
        )}

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: 13, padding: '8px 12px', background: '#2a1a1a', borderRadius: 8 }}>{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: '12px 20px', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {suggestion && !isLoading && (
          <p style={{ margin: 0, fontSize: 12, color: '#0BCE83', paddingLeft: 2 }}>
            Press Enter to accept suggestion
          </p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isLoading ? 'Claude is responding…' : suggestion ?? 'Message…'}
            disabled={isLoading}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${suggestion && !isLoading && !input ? '#0BCE8366' : '#2a2a2a'}`,
              background: '#111', color: '#f0f0f0', fontSize: 14, outline: 'none',
              opacity: isLoading ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !suggestion)}
            style={{
              padding: '10px 16px', borderRadius: 8, border: 'none',
              background: isLoading || (!input.trim() && !suggestion) ? '#1a1a1a' : '#0BCE83',
              color: isLoading || (!input.trim() && !suggestion) ? '#444' : '#000',
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
        boxShadow: streaming ? '0 0 0 1px #0BCE8344' : 'none',
      }}>
        {isUser
          ? text
          : <StreamingMarkdown text={text} streaming={streaming} />
        }
        {streaming && (
          <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#0BCE83', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'chat-pulse 0.8s infinite' }} />
        )}
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
