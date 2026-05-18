// apps/patient-tablet/src/hooks/useVoiceSession.ts
import { useState, useCallback, useRef } from 'react'
import { apiClient } from '../api/client'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

type SessionState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'

export function useVoiceSession(deviceToken: string) {
  const [state, setState] = useState<SessionState>('idle')
  const [companionName, setCompanionName] = useState('')
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const conversationIdRef = useRef<string | null>(null)

  const startSession = useCallback(async () => {
    setState('connecting')
    try {
      const { sessionToken, companionName: name, conversationId } = await apiClient.createVoiceSession(deviceToken)
      setCompanionName(name)
      conversationIdRef.current = conversationId

      // Connect to OpenAI Realtime via WebRTC
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 1. Add local audio track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Handle remote audio (companion speaking)
      pc.ontrack = (event) => {
        const audio = new Audio()
        audio.srcObject = event.streams[0]
        audio.play()
      }

      // 2. Create data channel BEFORE offer so it is included in the SDP
      const dc = pc.createDataChannel('oai-events')
      dc.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data)
          let text: string | null = null
          let role: 'patient' | 'companion' | null = null

          if (msg.type === 'response.audio_transcript.done') {
            text = msg.transcript
            role = 'companion'
          } else if (msg.type === 'conversation.item.input_audio_transcription.completed') {
            text = msg.transcript
            role = 'patient'
          }

          if (text && role && conversationIdRef.current) {
            await fetch(`${BASE_URL}/api/voice/transcripts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-device-token': deviceToken,
              },
              body: JSON.stringify({ conversationId: conversationIdRef.current, text, role }),
            }).catch(() => {}) // fire-and-forget, don't break voice on network error
          }
        } catch {}
      }

      // 3. Create offer
      const offer = await pc.createOffer()

      // 4. Set local description
      await pc.setLocalDescription(offer)

      // 5. Fetch SDP answer from OpenAI
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      })

      // 6. Set remote description
      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      setState('listening')
    } catch (err) {
      setState('error')
      console.error('Voice session error:', err)
    }
  }, [deviceToken])

  const endSession = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    setState('idle')
  }, [])

  return { state, companionName, startSession, endSession }
}
