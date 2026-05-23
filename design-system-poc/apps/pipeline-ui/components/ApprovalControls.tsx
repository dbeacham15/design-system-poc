'use client'
import { useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'

export function ApprovalControls() {
  const { state, dispatch } = usePipeline()
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: state.componentName,
          preBuildSha: state.preBuildSha,
          commitSha: state.commitSha,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      dispatch({ type: 'APPROVED', prUrl: data.prUrl })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (showFeedback) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Describe what needs to change…"
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#f0f0f0', fontSize: 14, width: 280, outline: 'none' }}
        />
        <button
          onClick={() => { dispatch({ type: 'REQUEST_CHANGES', feedback }); setShowFeedback(false) }}
          disabled={!feedback.trim()}
          style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#000', fontWeight: 600, cursor: 'pointer' }}
        >
          Send
        </button>
        <button
          onClick={() => setShowFeedback(false)}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {error && <span style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</span>}
      <button
        onClick={() => setShowFeedback(true)}
        style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#f0f0f0', cursor: 'pointer' }}
      >
        Request Changes
      </button>
      <button
        onClick={handleApprove}
        disabled={loading}
        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: loading ? '#333' : '#0BCE83', color: loading ? '#666' : '#000', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Creating PR…' : 'Looks Good — Create PR'}
      </button>
    </div>
  )
}
