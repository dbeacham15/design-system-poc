'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePipeline } from '@/lib/pipeline-context'
import { extractPropSurface } from '@/lib/grill-prompt'

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('grill-style')) {
  const s = document.createElement('style')
  s.id = 'grill-style'
  s.textContent = `
    @keyframes grill-pulse { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
    .grill-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#0BCE83;margin:0 2px;animation:grill-pulse 1.2s infinite ease-in-out}
    .grill-dot:nth-child(2){animation-delay:.2s}
    .grill-dot:nth-child(3){animation-delay:.4s}
    @keyframes grill-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .grill-msg{animation:grill-fadein .18s ease-out}
  `
  document.head.appendChild(s)
}

interface Message { role: 'user' | 'assistant'; content: string }
type Status = 'idle' | 'thinking' | 'streaming'

const TRIGGER = 'Please begin the grill session by asking your first question about the component.'

export function GrillScreen() {
  const { state, dispatch } = usePipeline()
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const triggered = useRef(false)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, streamingText])

  const sendMessage = useCallback(async (userText: string, history: Message[], silent = false) => {
    const allMessages: Message[] = userText
      ? [...history, { role: 'user', content: userText }]
      : history

    // silent = trigger message not shown in UI; always needs at least one message for the API
    if (userText && !silent) setMessages(allMessages)

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
          messages: allMessages,
          componentName: state.componentName,
          figmaDesign: state.figmaDesign,
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
            if (parsed.t) {
              accumulated += parsed.t
              setStreamingText(accumulated)
            }
          } catch (e) {
            if ((e as Error).message !== 'Unexpected token') throw e
          }
        }
      }

      // Commit the completed assistant message
      const finalMessages: Message[] = [...allMessages, { role: 'assistant', content: accumulated }]
      setMessages(finalMessages)
      setStreamingText('')
      setStatus('idle')

      // Check if Claude has output a prop surface
      const surface = extractPropSurface(accumulated)
      if (surface) dispatch({ type: 'PROP_SURFACE_READY', propSurface: surface })

    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(String(err))
      setStatus('idle')
    }
  }, [state.componentName, state.figmaDesign, dispatch])

  // Auto-start: send a silent trigger so Claude asks the first question
  useEffect(() => {
    if (triggered.current) return
    triggered.current = true
    sendMessage(TRIGGER, [], true)
  }, [sendMessage])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || status !== 'idle') return
    setInput('')
    sendMessage(text, messages)
  }

  const isLoading = status !== 'idle'
  const showThinking = status === 'thinking'
  const showStreaming = status === 'streaming' && streamingText

  return (
    <main style={{
      maxWidth: 720, margin: '0 auto', padding: '40px 24px',
      display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Grill Session</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#888', fontSize: 14 }}>
            Component: <strong style={{ color: '#f0f0f0' }}>{state.componentName}</strong>
          </span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: 12, marginBottom: 16, paddingRight: 4,
      }}>
        {messages.map((msg, i) => (
          <Bubble key={i} role={msg.role} text={msg.content} streaming={false} />
        ))}

        {showThinking && (
          <div className="grill-msg" style={{ alignSelf: 'flex-start' }}>
            <div style={{ background: '#1a1a1a', padding: '14px 18px', borderRadius: 12, display: 'flex', gap: 4 }}>
              <span className="grill-dot" /><span className="grill-dot" /><span className="grill-dot" />
            </div>
          </div>
        )}

        {showStreaming && (
          <Bubble role="assistant" text={streamingText} streaming />
        )}

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: 13, padding: '8px 12px', background: '#2a1a1a', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isLoading ? 'Claude is responding…' : 'Your answer…'}
          disabled={isLoading}
          autoFocus
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 8,
            border: '1px solid #333', background: '#1a1a1a',
            color: '#f0f0f0', fontSize: 15, outline: 'none',
            opacity: isLoading ? 0.5 : 1, transition: 'opacity .15s',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 20px', borderRadius: 8, border: 'none',
            background: isLoading || !input.trim() ? '#2a2a2a' : '#0BCE83',
            color: isLoading || !input.trim() ? '#555' : '#000',
            fontWeight: 600, cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background .15s, color .15s',
          }}
        >
          Send
        </button>
      </form>
    </main>
  )
}

function Bubble({ role, text, streaming }: { role: 'user' | 'assistant'; text: string; streaming: boolean }) {
  const isUser = role === 'user'
  return (
    <div className="grill-msg" style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
      <div style={{
        background: isUser ? '#0BCE83' : '#1a1a1a',
        color: isUser ? '#000' : '#f0f0f0',
        padding: '12px 16px', borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        fontSize: 15, lineHeight: 1.65, whiteSpace: 'pre-wrap',
        boxShadow: streaming ? '0 0 0 1px #0BCE8344' : 'none',
        transition: 'box-shadow .2s',
      }}>
        {text}
        {streaming && (
          <span style={{
            display: 'inline-block', width: 2, height: '1em',
            background: '#0BCE83', marginLeft: 2, verticalAlign: 'text-bottom',
            animation: 'grill-pulse 0.8s infinite',
          }} />
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const cfg: Record<Status, { label: string; color: string }> = {
    idle:      { label: 'Ready',       color: '#444' },
    thinking:  { label: 'Thinking…',   color: '#f5a623' },
    streaming: { label: 'Responding',  color: '#0BCE83' },
  }
  const { label, color } = cfg[status]
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
      color, textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 4,
      border: `1px solid ${color}55`,
      transition: 'color .2s, border-color .2s',
    }}>
      {label}
    </span>
  )
}
