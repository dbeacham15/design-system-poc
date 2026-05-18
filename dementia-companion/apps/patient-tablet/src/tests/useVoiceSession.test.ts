// apps/patient-tablet/src/tests/useVoiceSession.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceSession } from '../hooks/useVoiceSession'

vi.mock('../api/client', () => ({
  apiClient: {
    createVoiceSession: vi.fn().mockResolvedValue({
      sessionToken: 'fake-token',
      conversationId: 'conv-1',
      companionName: 'Grace',
      sessionSilenceMs: 5000,
      simliSessionToken: null,
      idleLoopVideoUrl: null,
    }),
  },
}))

// Capture the mock data channel so tests can fire events into it
let capturedDc: { onmessage: ((e: { data: string }) => void) | null } = { onmessage: null }
const mockPc = {
  addTrack: vi.fn(),
  createDataChannel: vi.fn(() => { capturedDc = { onmessage: null }; return capturedDc }),
  createOffer: vi.fn(() => Promise.resolve({ type: 'offer', sdp: 'v=0\r\n' })),
  setLocalDescription: vi.fn(() => Promise.resolve()),
  setRemoteDescription: vi.fn(() => Promise.resolve()),
  close: vi.fn(),
  ontrack: null,
}
global.RTCPeerConnection = vi.fn(() => mockPc) as any

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function sdpResponse() {
  return { ok: true, text: async () => 'v=0\r\na=recvonly\r\n' }
}
function closeResponse() {
  return { ok: true, json: async () => ({ data: { audioUrl: '' } }) }
}

beforeEach(() => {
  capturedDc = { onmessage: null }
  mockFetch.mockImplementation((url: string) => {
    if (String(url).includes('openai.com')) return Promise.resolve(sdpResponse())
    if (String(url).includes('session/close')) return Promise.resolve(closeResponse())
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
  vi.useFakeTimers({ shouldAdvanceTime: false })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

function sendDcEvent(type: string, extra: object = {}) {
  capturedDc.onmessage?.({ data: JSON.stringify({ type, ...extra }) })
}

describe('useVoiceSession state machine', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useVoiceSession('device-token'))
    expect(result.current.state).toBe('idle')
  })

  it('transitions idle → connecting → active on successful session start', async () => {
    const { result } = renderHook(() => useVoiceSession('device-token'))
    await act(async () => { await result.current.startSession() })
    expect(result.current.state).toBe('active')
    expect(result.current.companionName).toBe('Grace')
  })

  it('transitions active → closing → idle via triggerClosingRitual', async () => {
    const { result } = renderHook(() => useVoiceSession('device-token'))
    await act(async () => { await result.current.startSession() })
    expect(result.current.state).toBe('active')

    await act(async () => { result.current.triggerClosingRitual() })
    expect(result.current.state).toBe('closing')

    await act(async () => { vi.advanceTimersByTime(500) })
    expect(result.current.state).toBe('idle')
  })

  it('transitions error → idle via dismissError', async () => {
    const { apiClient } = await import('../api/client')
    vi.mocked(apiClient.createVoiceSession).mockRejectedValueOnce(new Error('network'))

    const { result } = renderHook(() => useVoiceSession('device-token'))
    await act(async () => { await result.current.startSession() })
    expect(result.current.state).toBe('error')

    act(() => { result.current.dismissError() })
    expect(result.current.state).toBe('idle')
  })

  it('ignores startSession when not idle', async () => {
    const { result } = renderHook(() => useVoiceSession('device-token'))
    await act(async () => { await result.current.startSession() })
    expect(result.current.state).toBe('active')

    await act(async () => { await result.current.startSession() })
    expect(result.current.state).toBe('active')
  })

  it('calls onSilenceTimeout when closing ritual fires', async () => {
    const onSilenceTimeout = vi.fn()
    const { result } = renderHook(() => useVoiceSession('device-token', { onSilenceTimeout }))
    await act(async () => { await result.current.startSession() })

    await act(async () => { result.current.triggerClosingRitual() })
    expect(onSilenceTimeout).toHaveBeenCalledOnce()
  })

  it('triggerClosingRitual is a no-op when not in active state', () => {
    const { result } = renderHook(() => useVoiceSession('device-token'))
    expect(result.current.state).toBe('idle')

    act(() => { result.current.triggerClosingRitual() })
    expect(result.current.state).toBe('idle')
  })
})

describe('Session-level silence timer', () => {
  it('silence timer fires after sessionSilenceMs and transitions to closing', async () => {
    const { result } = renderHook(() => useVoiceSession('device-token'))
    await act(async () => { await result.current.startSession() })
    expect(result.current.state).toBe('active')

    // Companion finishes speaking → silence timer starts
    act(() => sendDcEvent('response.audio_transcript.done', { transcript: 'Hello Margaret!' }))

    // Advance to just before threshold — should still be active
    act(() => vi.advanceTimersByTime(4999))
    expect(result.current.state).toBe('active')

    // Advance past threshold → closing ritual fires
    await act(async () => { vi.advanceTimersByTime(2) })
    expect(result.current.state).toBe('closing')
  })

  it('patient speech resets the silence timer', async () => {
    const { result } = renderHook(() => useVoiceSession('device-token'))
    await act(async () => { await result.current.startSession() })

    act(() => sendDcEvent('response.audio_transcript.done', { transcript: 'Hello!' }))
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.state).toBe('active') // not yet

    // Patient speaks → timer resets
    act(() => sendDcEvent('input_audio_buffer.speech_started'))
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.state).toBe('active') // timer was reset, only 3s elapsed again

    // Now advance past the full threshold
    await act(async () => { vi.advanceTimersByTime(2500) })
    expect(result.current.state).toBe('closing')
  })
})
