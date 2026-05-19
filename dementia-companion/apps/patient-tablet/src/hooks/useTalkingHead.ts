// apps/patient-tablet/src/hooks/useTalkingHead.ts
//
// Connects to the Simli WebRTC endpoint to receive a real-time lip-synced video
// stream. The companion audio track from OpenAI is sent to Simli as input so
// Simli knows what to animate.
//
// Falls back to null stream (orb shown) if the stream is not live within 3 seconds.

import { useState, useEffect, useRef } from 'react'

const SIMLI_SESSION_URL = 'https://api.simli.ai/startSession'
const SIMLI_ANSWER_URL = 'https://api.simli.ai/sendSDPAnswer'
const STREAM_TIMEOUT_MS = 3000

export type TalkingHeadStatus = 'idle' | 'loading' | 'live' | 'error'

interface Options {
  simliSessionToken: string | null
  companionStream: MediaStream | null
  active: boolean
}

export function useTalkingHead({ simliSessionToken, companionStream, active }: Options) {
  const [status, setStatus] = useState<TalkingHeadStatus>('idle')
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active || !simliSessionToken) {
      // Tear down any existing connection when session ends
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      setVideoStream(null)
      setStatus('idle')
      return
    }

    setStatus('loading')

    // 3-second hard deadline — fall back to orb if Simli stream not up by then
    timeoutRef.current = setTimeout(() => {
      setStatus('error')
    }, STREAM_TIMEOUT_MS)

    connectToSimli(simliSessionToken, companionStream)
      .then(({ pc, stream }) => {
        clearTimeout(timeoutRef.current!)
        pcRef.current = pc
        setVideoStream(stream)
        setStatus('live')
      })
      .catch((err) => {
        clearTimeout(timeoutRef.current!)
        console.warn('Simli connection failed, falling back to orb:', err?.message ?? err)
        setStatus('error')
      })

    return () => {
      clearTimeout(timeoutRef.current!)
      pcRef.current?.close()
      pcRef.current = null
      setVideoStream(null)
    }
    // Re-connect whenever a new session token is provided
  }, [simliSessionToken, active]) // eslint-disable-line react-hooks/exhaustive-deps

  return { status, videoStream }
}

async function connectToSimli(
  sessionToken: string,
  companionStream: MediaStream | null,
): Promise<{ pc: RTCPeerConnection; stream: MediaStream }> {
  // 1. Ask Simli for its SDP offer
  const offerRes = await fetch(SIMLI_SESSION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: sessionToken }),
  })
  if (!offerRes.ok) throw new Error(`Simli startSession ${offerRes.status}`)
  const { sdp: simliSdpOffer } = await offerRes.json()

  // 2. Create peer connection — Simli sends the offer, we answer
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  })

  // 3. Send companion audio to Simli so it knows what to animate
  if (companionStream) {
    companionStream.getAudioTracks().forEach(track => pc.addTrack(track, companionStream))
  }

  // 4. Capture the video stream Simli sends back
  const videoStream = await new Promise<MediaStream>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('No video track received from Simli')), 2000)
    pc.ontrack = (event) => {
      if (event.track.kind === 'video') {
        clearTimeout(timeout)
        resolve(event.streams[0] ?? new MediaStream([event.track]))
      }
    }
  })

  // 5. Set the Simli offer as remote description
  await pc.setRemoteDescription({ type: 'offer', sdp: simliSdpOffer })

  // 6. Create and send our answer
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)

  await fetch(SIMLI_ANSWER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: sessionToken, sdp: answer.sdp }),
  })

  return { pc, stream: videoStream }
}
