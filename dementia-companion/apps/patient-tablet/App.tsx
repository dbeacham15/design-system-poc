// apps/patient-tablet/App.tsx
import React, { useEffect, useState } from 'react'
import { getDeviceToken } from './src/storage/device-token'
import { PairingScreen } from './src/screens/PairingScreen'
import { CompanionScreen } from './src/screens/CompanionScreen'

export default function App() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDeviceToken().then(result => {
      if (result) setDeviceToken(result.token)
      setLoading(false)
    })
  }, [])

  if (loading) return null

  if (!deviceToken) {
    return <PairingScreen onPaired={() => {
      getDeviceToken().then(result => {
        if (result) setDeviceToken(result.token)
      })
    }} />
  }

  return <CompanionScreen deviceToken={deviceToken} />
}
