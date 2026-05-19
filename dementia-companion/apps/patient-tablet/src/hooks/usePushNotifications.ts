// apps/patient-tablet/src/hooks/usePushNotifications.ts
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Companion intro is handled in-app, not as a banner
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export interface CompanionIntroPayload {
  companionName: string
  introAudioUrl: string | null
  idleLoopVideoUrl: string | null
}

interface Options {
  deviceToken: string
  onCompanionIntro: (payload: CompanionIntroPayload) => void
}

export function usePushNotifications({ deviceToken, onCompanionIntro }: Options) {
  const onIntroRef = useRef(onCompanionIntro)
  onIntroRef.current = onCompanionIntro

  useEffect(() => {
    if (Platform.OS === 'web') return // Push notifications not supported on web

    let cleanup: (() => void) | undefined

    async function setup() {
      const { status: existing } = await Notifications.getPermissionsAsync()
      let finalStatus = existing
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') return

      const tokenData = await Notifications.getExpoPushTokenAsync()
      const expoPushToken = tokenData.data

      // Register push token with server
      await fetch(`${BASE_URL}/api/devices/push-token`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-device-token': deviceToken },
        body: JSON.stringify({ expoPushToken }),
      }).catch(() => {}) // Non-fatal — intro will just require manual trigger

      // Listen for foreground notifications
      const sub = Notifications.addNotificationReceivedListener(notification => {
        const data = notification.request.content.data as any
        if (data?.type === 'COMPANION_INTRO') {
          onIntroRef.current({
            companionName: data.companionName ?? '',
            introAudioUrl: data.introAudioUrl ?? null,
            idleLoopVideoUrl: data.idleLoopVideoUrl ?? null,
          })
        }
      })

      // Handle notification tap when app is backgrounded
      const tapSub = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as any
        if (data?.type === 'COMPANION_INTRO') {
          onIntroRef.current({
            companionName: data.companionName ?? '',
            introAudioUrl: data.introAudioUrl ?? null,
            idleLoopVideoUrl: data.idleLoopVideoUrl ?? null,
          })
        }
      })

      cleanup = () => { sub.remove(); tapSub.remove() }
    }

    setup().catch(err => console.error('Push notification setup failed:', err))
    return () => cleanup?.()
  }, [deviceToken])
}
