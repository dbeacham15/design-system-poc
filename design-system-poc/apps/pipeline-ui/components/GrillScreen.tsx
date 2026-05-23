'use client'
import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { usePipeline } from '@/lib/pipeline-context'
import { extractPropSurface } from '@/lib/grill-prompt'

export function GrillScreen() {
  const { state, dispatch } = usePipeline()
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { componentName: state.componentName, figmaDesign: state.figmaDesign },
    }),
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

  const isLoading = status === 'streaming' || status === 'submitted'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Grill Session</h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 24px' }}>Component: <strong style={{ color: '#f0f0f0' }}>{state.componentName}</strong></p>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        {messages.map(msg => {
          const text = msg.parts?.find((p: { type: string }) => p.type === 'text')?.text ?? ''
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? '#0BCE83' : '#1a1a1a',
                color: msg.role === 'user' ? '#000' : '#f0f0f0',
                padding: '12px 16px', borderRadius: 12, maxWidth: '80%',
                fontSize: 15, whiteSpace: 'pre-wrap', lineHeight: 1.5,
              }}
            >
              {text}
            </div>
          )
        })}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: '#888', fontSize: 14 }}>Claude is thinking…</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Your answer…"
          disabled={isLoading}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#f0f0f0', fontSize: 15, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 20px', borderRadius: 8, border: 'none',
            background: isLoading || !input.trim() ? '#333' : '#0BCE83',
            color: isLoading || !input.trim() ? '#666' : '#000',
            fontWeight: 600, cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </main>
  )
}
