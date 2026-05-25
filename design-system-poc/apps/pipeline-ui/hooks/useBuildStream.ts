import { useEffect, useRef } from 'react'
import { usePipeline } from '@/lib/pipeline-context'

export function useBuildStream() {
  const { state, dispatch } = usePipeline()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (state.stage !== 'building') { hasStarted.current = false; return }
    if (hasStarted.current) return
    if (!state.propSurface) return
    hasStarted.current = true
    let cancelled = false
    const propSurface = state.propSurface // snapshot to avoid stale closure

    async function runStream() {
      try {
        const res = await fetch('/api/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propSurface }),
        })

        if (!res.ok || !res.body) {
          if (!cancelled) dispatch({ type: 'BUILD_FAIL', error: 'Build failed to start.' })
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (cancelled) { reader.cancel(); break }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.status && !cancelled) dispatch({ type: 'BUILD_STATUS', message: parsed.status })
              if (parsed.error && !cancelled) dispatch({ type: 'BUILD_FAIL', error: parsed.error })
              if (parsed.done && !cancelled) dispatch({ type: 'BUILD_SUCCESS', commitSha: parsed.commitSha, preBuildSha: parsed.preBuildSha })
            } catch {}
          }
        }
      } catch (err) {
        if (!cancelled) dispatch({ type: 'BUILD_FAIL', error: String(err) })
      }
    }

    runStream()
    return () => { cancelled = true }
  }, [state.stage, dispatch]) // removed state.propSurface — snapshotted above
}
