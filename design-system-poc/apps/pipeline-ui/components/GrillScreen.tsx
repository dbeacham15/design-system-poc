'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { usePipeline } from '@/lib/pipeline-context'
import { extractPropSurface } from '@/lib/grill-prompt'

// Inject keyframes once at module level
if (typeof document !== 'undefined' && !document.getElementById('grill-pulse-style')) {
  const s = document.createElement('style')
  s.id = 'grill-pulse-style'
  s.textContent = `
    @keyframes grill-pulse { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
    .grill-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#0BCE83; margin:0 2px; animation:grill-pulse 1.2s infinite ease-in-out; }
    .grill-dot:nth-child(2){animation-delay:.2s}
    .grill-dot:nth-child(3){animation-delay:.4s}
  `
  document.head.appendChild(s)
}

const TRIGGER_ID = '__grill_trigger__'

export function GrillScreen() {
  const { state, dispatch } = usePipeline()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const triggered = useRef(false)

  // Stable transport — never recreated after mount
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      body: { componentName: state.componentName, figmaDesign: state.figmaDesign },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: state.messages.map((m, i) => ({
      id: String(i),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
    onFinish({ message }) {
      const text = message.parts?.find((p: { type: string }) => p.type === 'text')?.text ?? ''
      const surface = extractPropSurface(text)
      if (surface) dispatch({ type: 'PROP_SURFACE_READY', propSurface: surface })
    },
  })

  // Auto-start: trigger Claude to ask the first question on mount
  useEffect(() => {
    if (triggered.current) return
    triggered.current = true
    if (state.messages.length === 0) {
      sendMessage({ text: 'Please begin the grill session.' })
    }
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, status])

  const isLoading = status === 'streaming' || status === 'submitted'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  // Filter out the internal trigger message from the visible chat
  const visibleMessages = messages.filter(m => {
    const text = m.parts?.find((p: { type: string }) => p.type === 'text')?.text ?? ''
    return text !== 'Please begin the grill session.'
  })

  return (
    <main style={{
      maxWidth: 720, margin: '0 auto', padding: '40px 24px',
      display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Grill Session</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            Component: <strong style={{ color: '#f0f0f0' }}>{state.componentName}</strong>
          </p>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {visibleMessages.length === 0 && isLoading && (
          <div style={{ alignSelf: 'flex-start' }}>
            <ThinkingBubble />
          </div>
        )}
        {visibleMessages.map((msg, i) => {
          const text = msg.parts?.find((p: { type: string }) => p.type === 'text')?.text ?? ''
          const isUser = msg.role === 'user'
          const isLast = i === visibleMessages.length - 1
          const isStreaming = isLast && !isUser && isLoading

          return (
            <div key={msg.id} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                background: isUser ? '#0BCE83' : '#1a1a1a',
                color: isUser ? '#000' : '#f0f0f0',
                padding: '12px 16px', borderRadius: 12,
                fontSize: 15, whiteSpace: 'pre-wrap', lineHeight: 1.6,
                border: isStreaming ? '1px solid #0BCE8355' : '1px solid transparent',
                transition: 'border-color 0.2s',
              }}>
                {text}
                {isStreaming && <span style={{ opacity: 0.4 }}>▊</span>}
              </div>
            </div>
          )
        })}

        {/* Show thinking dots if loading and last message is from user */}
        {isLoading && visibleMessages.length > 0 && visibleMessages.at(-1)?.role === 'user' && (
          <div style={{ alignSelf: 'flex-start' }}>
            <ThinkingBubble />
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
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 8,
            border: '1px solid #333', background: '#1a1a1a',
            color: '#f0f0f0', fontSize: 15, outline: 'none',
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 20px', borderRadius: 8, border: 'none',
            background: isLoading || !input.trim() ? '#333' : '#0BCE83',
            color: isLoading || !input.trim() ? '#666' : '#000',
            fontWeight: 600, cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          Send
        </button>
      </form>
    </main>
  )
}

function ThinkingBubble() {
  return (
    <div style={{
      background: '#1a1a1a', padding: '14px 18px', borderRadius: 12,
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      <span className="grill-dot" />
      <span className="grill-dot" />
      <span className="grill-dot" />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ready:     { label: 'Ready',      color: '#555' },
    submitted: { label: 'Thinking…',  color: '#f5a623' },
    streaming: { label: 'Responding', color: '#0BCE83' },
    error:     { label: 'Error',      color: '#ff6b6b' },
  }
  const s = map[status] ?? map.ready
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
      color: s.color, textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 4, border: `1px solid ${s.color}44`,
    }}>
      {s.label}
    </span>
  )
}
