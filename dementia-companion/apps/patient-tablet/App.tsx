// apps/patient-tablet/App.tsx
import React, { useEffect, useRef, useState } from 'react'
import { getDeviceToken } from './src/storage/device-token'
import { PairingScreen } from './src/screens/PairingScreen'
import { CompanionScreen } from './src/screens/CompanionScreen'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'
const POLL_INTERVAL_MS = 4000

interface CompanionSnapshot {
  avatarUnlocked: boolean
  idleLoopVideoUrl: string | null
  companionName: string | null
  introAudioUrl: string | null
}

export default function App() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<CompanionSnapshot>({
    avatarUnlocked: false,
    idleLoopVideoUrl: null,
    companionName: null,
    introAudioUrl: null,
  })
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getDeviceToken().then(result => {
      if (result) setDeviceToken(result.token)
      setLoading(false)
    })
  }, [])

  // Poll for introduction when paired but avatar not yet unlocked (web has no push)
  useEffect(() => {
    if (!deviceToken || snapshot.avatarUnlocked) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/devices/status`, {
          headers: { 'x-device-token': deviceToken },
        })
        const json = await res.json()
        if (json.data?.avatarUnlocked) {
          setSnapshot({
            avatarUnlocked: true,
            idleLoopVideoUrl: json.data.idleLoopVideoUrl ?? null,
            companionName: json.data.companionName ?? null,
            introAudioUrl: json.data.introAudioUrl ?? null,
          })
        }
      } catch {}
    }, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [deviceToken, snapshot.avatarUnlocked])

  if (loading) return null

  if (!deviceToken) {
    return (
      <PairingScreen
        onPaired={(result) => {
          setSnapshot({
            avatarUnlocked: result.avatarUnlocked,
            idleLoopVideoUrl: result.idleLoopVideoUrl,
            companionName: result.companionName,
            introAudioUrl: result.introAudioUrl,
          })
          getDeviceToken().then(r => { if (r) setDeviceToken(r.token) })
        }}
      />
    )
  }

  return (
    <CompanionScreen
      deviceToken={deviceToken}
      avatarUnlocked={snapshot.avatarUnlocked}
      initialCompanionName={snapshot.companionName}
      initialIdleLoopVideoUrl={snapshot.idleLoopVideoUrl}
      initialIntroAudioUrl={snapshot.introAudioUrl}
    />
  )
}
