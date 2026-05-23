'use client'
import { useEffect, useRef, useState } from 'react'
import { usePipeline } from '@/lib/pipeline-context'

export function BuildScreen() {
  const { state, dispatch } = usePipeline()
  const [status, setStatus] = useState('Generating component code…')
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    async function runBuild() {
      try {
        setStatus('Generating component code…')
        const buildRes = await fetch('/api/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propSurface: state.propSurface }),
        })
        const buildData = await buildRes.json()
        if (!buildRes.ok) throw new Error(buildData.error + (buildData.details ? `\n${buildData.details}` : ''))

        setStatus('Starting Storybook…')
        const sbRes = await fetch('/api/storybook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyUrl: buildData.storyUrl }),
        })
        const sbData = await sbRes.json()
        if (!sbRes.ok) throw new Error(sbData.error)

        dispatch({
          type: 'BUILD_SUCCESS',
          commitSha: buildData.commitSha,
          preBuildSha: buildData.preBuildSha,
          storyUrl: sbData.storybookUrl,
        })
      } catch (err) {
        setError(String(err))
      }
    }
    runBuild()
  }, [])

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Building Component</h2>
      {error ? (
        <>
          <p style={{ color: '#ff6b6b', whiteSpace: 'pre-wrap', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => dispatch({ type: 'REQUEST_CHANGES', feedback: 'Build failed. Please review and clarify.' })}
            style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#f0f0f0', cursor: 'pointer' }}
          >
            Back to Chat
          </button>
        </>
      ) : (
        <p style={{ color: '#888' }}>{status}</p>
      )}
    </main>
  )
}
