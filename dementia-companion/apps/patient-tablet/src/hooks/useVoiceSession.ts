// apps/patient-tablet/src/hooks/useVoiceSession.ts
import { useState, useCallback, useRef } from 'react'
import { apiClient } from '../api/client'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'
const DEFAULT_SILENCE_MS = 45_000

export type SessionState = 'idle' | 'connecting' | 'active' | 'closing' | 'error'

interface UseVoiceSessionOptions {
  onSilenceTimeout?: () => void
}

export function useVoiceSession(deviceToken: string, options: UseVoiceSessionOptions = {}) {
  const [state, setState] = useState<SessionState>('idle')
  const [companionName, setCompanionName] = useState('')
  const [companionStream, setCompanionStream] = useState<MediaStream | null>(null)
  const [simliSessionToken, setSimliSessionToken] = useState<string | null>(null)
  const [idleLoopVideoUrl, setIdleLoopVideoUrl] = useState<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceMsRef = useRef<number>(DEFAULT_SILENCE_MS)
  const closingInProgressRef = useRef(false)
  const { onSilenceTimeout } = options

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const closeSession = useCallback(() => {
    clearSilenceTimer()
    closingInProgressRef.current = false
    setCompanionStream(null)
    setTimeout(() => {
      pcRef.current?.close()
      pcRef.current = null
      conversationIdRef.current = null
      setState('idle')
    }, 100)
  }, [clearSilenceTimer])

  const runClosingRitual = useCallback(async () => {
    if (closingInProgressRef.current) return
    closingInProgressRef.current = true
    clearSilenceTimer()
    setState('closing')
    onSilenceTimeout?.()

    try {
      const res = await fetch(`${BASE_URL}/api/voice/session/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-token': deviceToken },
      })
      const json = await res.json()
      const audioUrl: string | undefined = json?.data?.audioUrl

      if (audioUrl) {
        await new Promise<void>((resolve) => {
          const audio = new Audio(audioUrl)
          audio.onended = () => resolve()
          audio.onerror = () => resolve()
          audio.play().catch(() => resolve())
        })
      }
    } catch {
      // closing ritual failure is non-fatal
    } finally {
      closeSession()
    }
  }, [deviceToken, onSilenceTimeout, clearSilenceTimer, closeSession])

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      runClosingRitual()
    }, silenceMsRef.current)
  }, [clearSilenceTimer, runClosingRitual])

  const startSession = useCallback(async () => {
    if (state !== 'idle') return
    setState('connecting')
    try {
      const {
        sessionToken, companionName: name, conversationId,
        sessionSilenceMs, simliSessionToken: simliToken, idleLoopVideoUrl: idleUrl,
      } = await apiClient.createVoiceSession(deviceToken)

      setCompanionName(name)
      setSimliSessionToken(simliToken)
      setIdleLoopVideoUrl(idleUrl)
      conversationIdRef.current = conversationId
      silenceMsRef.current = sessionSilenceMs ?? DEFAULT_SILENCE_MS

      const pc = new RTCPeerConnection()
      pcRef.current = pc

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStream.getTracks().forEach(track => pc.addTrack(track, micStream))

      pc.ontrack = (event) => {
        // Play companion audio and expose stream for Simli lip-sync input
        const remoteStream = event.streams[0]
        const audio = new Audio()
        audio.srcObject = remoteStream
        audio.play()
        setCompanionStream(remoteStream)
      }

      const dc = pc.createDataChannel('oai-events')
      dc.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'input_audio_buffer.speech_started') resetSilenceTimer()
          if (msg.type === 'response.audio_transcript.done') resetSilenceTimer()

          let text: string | null = null
          let role: 'patient' | 'companion' | null = null
          if (msg.type === 'response.audio_transcript.done') {
            text = msg.transcript; role = 'companion'
          } else if (msg.type === 'conversation.item.input_audio_transcription.completed') {
            text = msg.transcript; role = 'patient'
          }

          if (text && role && conversationIdRef.current) {
            fetch(`${BASE_URL}/api/voice/transcripts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-device-token': deviceToken },
              body: JSON.stringify({ conversationId: conversationIdRef.current, text, role }),
            }).catch(() => {})
          }
        } catch {}
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      })

      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      setState('active')
      resetSilenceTimer()
    } catch (err) {
      pcRef.current?.close()
      pcRef.current = null
      clearSilenceTimer()
      setCompanionStream(null)
      setState('error')
      console.error('Voice session error:', err)
    }
  }, [deviceToken, state, resetSilenceTimer, clearSilenceTimer])

  const triggerClosingRitual = useCallback(() => {
    if (state !== 'active') return
    runClosingRitual()
  }, [state, runClosingRitual])

  const dismissError = useCallback(() => {
    setState('idle')
  }, [])

  return {
    state,
    companionName,
    companionStream,
    simliSessionToken,
    idleLoopVideoUrl,
    startSession,
    triggerClosingRitual,
    dismissError,
  }
}
