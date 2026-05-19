// apps/patient-tablet/App.tsx
import React, { useEffect, useRef, useState } from 'react'
import { getDeviceToken } from './src/storage/device-token'
import { PairingScreen } from './src/screens/PairingScreen'
import { CompanionScreen } from './src/screens/CompanionScreen'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'
const POLL_INTERVAL_MS = 4000

export default function App() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null)
  const [avatarUnlocked, setAvatarUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getDeviceToken().then(result => {
      if (result) setDeviceToken(result.token)
      setLoading(false)
    })
  }, [])

  // Poll for avatarUnlocked when paired but not yet introduced (web has no push)
  useEffect(() => {
    if (!deviceToken || avatarUnlocked) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/devices/status`, {
          headers: { 'x-device-token': deviceToken },
        })
        const json = await res.json()
        if (json.data?.avatarUnlocked) setAvatarUnlocked(true)
      } catch {}
    }, POLL_INTERVAL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [deviceToken, avatarUnlocked])

  if (loading) return null

  if (!deviceToken) {
    return <PairingScreen onPaired={(unlocked) => {
      setAvatarUnlocked(unlocked)
      getDeviceToken().then(result => {
        if (result) setDeviceToken(result.token)
      })
    }} />
  }

  return <CompanionScreen deviceToken={deviceToken} avatarUnlocked={avatarUnlocked} />
}
