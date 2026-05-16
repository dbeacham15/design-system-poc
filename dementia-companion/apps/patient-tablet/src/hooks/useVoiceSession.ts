// apps/patient-tablet/src/hooks/useVoiceSession.ts
import { useState, useCallback, useRef } from 'react'
import { apiClient } from '../api/client'

type SessionState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'

export function useVoiceSession(deviceToken: string) {
  const [state, setState] = useState<SessionState>('idle')
  const [companionName, setCompanionName] = useState('')
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const startSession = useCallback(async () => {
    setState('connecting')
    try {
      const { sessionToken, companionName: name } = await apiClient.createVoiceSession(deviceToken)
      setCompanionName(name)

      // Connect to OpenAI Realtime via WebRTC
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // Add local audio track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Handle remote audio (companion speaking)
      pc.ontrack = (event) => {
        const audio = new Audio()
        audio.srcObject = event.streams[0]
        audio.play()
      }

      // Create offer + connect to OpenAI
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      })

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
