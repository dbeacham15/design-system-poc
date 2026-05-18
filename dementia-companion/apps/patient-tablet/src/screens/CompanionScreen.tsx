// apps/patient-tablet/src/screens/CompanionScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native'
import { useKeepAwake } from 'expo-keep-awake'
import * as ScreenOrientation from 'expo-screen-orientation'
import { useVoiceSession } from '../hooks/useVoiceSession'
import { useTalkingHead } from '../hooks/useTalkingHead'
import { usePushNotifications } from '../hooks/usePushNotifications'

interface Props {
  deviceToken: string
  avatarUnlocked: boolean
}

const AVATAR_SIZE = Math.min(Dimensions.get('window').width * 0.72, 340)
const GLOW_SIZE = AVATAR_SIZE + 32

export function CompanionScreen({ deviceToken, avatarUnlocked: initialUnlocked }: Props) {
  useKeepAwake()

  const [avatarUnlocked, setAvatarUnlocked] = useState(initialUnlocked)
  const [introducing, setIntroducing] = useState(false)
  const introAudioRef = useRef<HTMLAudioElement | null>(null)

  // Video refs for the circular masked player
  const idleVideoRef = useRef<HTMLVideoElement | null>(null)
  const liveVideoRef = useRef<HTMLVideoElement | null>(null)

  // Lock to portrait on mount
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {})
      return () => { ScreenOrientation.unlockAsync().catch(() => {}) }
    }
  }, [])

  const {
    state, companionName, companionStream, simliSessionToken, idleLoopVideoUrl,
    startSession, triggerClosingRitual, dismissError,
  } = useVoiceSession(deviceToken)

  const { status: talkingHeadStatus, videoStream } = useTalkingHead({
    simliSessionToken,
    companionStream,
    active: state === 'active',
  })

  // Wire live video stream into the video element
  useEffect(() => {
    if (liveVideoRef.current && videoStream) {
      liveVideoRef.current.srcObject = videoStream
      liveVideoRef.current.play().catch(() => {})
    }
  }, [videoStream])

  // When talking head errors on an active session, play the warm fallback audio
  useEffect(() => {
    if (state === 'active' && talkingHeadStatus === 'error') {
      const audio = new Audio()
      audio.src = '' // In production: URL to the pre-recorded warm error clip
      // audio.play() — no-op without a real src; live sessions still work audio-only
    }
  }, [state, talkingHeadStatus])

  const handleCompanionIntro = useCallback(async ({
    introAudioUrl,
  }: { companionName: string; introAudioUrl: string | null }) => {
    if (avatarUnlocked || introducing) return
    setIntroducing(true)

    if (introAudioUrl) {
      await new Promise<void>((resolve) => {
        const audio = new Audio(introAudioUrl)
        introAudioRef.current = audio
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })
    }

    setIntroducing(false)
    setAvatarUnlocked(true)
  }, [avatarUnlocked, introducing])

  usePushNotifications({ deviceToken, onCompanionIntro: handleCompanionIntro })

  const glowAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      ).start()
    } else if (state === 'idle' && avatarUnlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.4, duration: 2400, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
        ])
      ).start()
    } else {
      glowAnim.stopAnimation()
    }
  }, [state, avatarUnlocked])

  const handleAvatarTap = () => {
    if (!avatarUnlocked || introducing) return
    if (state === 'idle') startSession()
    else if (state === 'error') dismissError()
  }

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] })
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })

  const isLocked = !avatarUnlocked && !introducing
  const isInteractive = avatarUnlocked && !introducing && (state === 'idle' || state === 'error')

  // Which video layer is visible
  const showLiveVideo = state === 'active' && talkingHeadStatus === 'live'
  const showIdleVideo = !showLiveVideo && !!idleLoopVideoUrl
  const showOrb = !showLiveVideo && !showIdleVideo

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          { width: GLOW_SIZE, height: GLOW_SIZE, borderRadius: GLOW_SIZE / 2 },
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          isLocked && styles.glowLocked,
          introducing && styles.glowIntro,
        ]}
      />

      <TouchableOpacity
        activeOpacity={isInteractive ? 0.85 : 1}
        onPress={handleAvatarTap}
        disabled={!isInteractive}
        style={[
          styles.avatarCircle,
          { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
          isLocked && styles.avatarLocked,
          introducing && styles.avatarIntro,
          state === 'connecting' && styles.avatarConnecting,
        ]}
      >
        {/* Layer 1: Live Simli video stream (active + stream live) */}
        {Platform.OS === 'web' && (
          <video
            ref={liveVideoRef as any}
            style={{
              position: 'absolute', width: '100%', height: '100%',
              objectFit: 'cover', borderRadius: '50%',
              opacity: showLiveVideo ? 1 : 0,
              transition: 'opacity 0.3s ease',
            } as any}
            autoPlay
            playsInline
            muted={false}
          />
        )}

        {/* Layer 2: Idle loop video (no active session, portrait approved) */}
        {Platform.OS === 'web' && idleLoopVideoUrl && (
          <video
            src={idleLoopVideoUrl}
            style={{
              position: 'absolute', width: '100%', height: '100%',
              objectFit: 'cover', borderRadius: '50%',
              opacity: showIdleVideo ? 1 : 0,
              transition: 'opacity 0.3s ease',
            } as any}
            autoPlay
            loop
            muted
            playsInline
          />
        )}

        {/* Layer 3: Orb placeholder (no portrait or video failed) */}
        {showOrb && (
          <Text style={styles.avatarInitial}>
            {introducing ? '✨' : (companionName?.[0] ?? '✦')}
          </Text>
        )}
      </TouchableOpacity>

      {companionName ? (
        <Text style={[styles.companionName, isLocked && styles.companionNameLocked]}>
          {companionName}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  glow: { position: 'absolute', backgroundColor: '#C4845A' },
  glowLocked: { backgroundColor: '#B0A090' },
  glowIntro: { backgroundColor: '#F5C842' },
  avatarCircle: {
    backgroundColor: '#C4845A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  avatarLocked: { backgroundColor: '#9E8A7A', opacity: 0.55 },
  avatarIntro: { backgroundColor: '#D4A849' },
  avatarConnecting: { opacity: 0.8 },
  avatarInitial: {
    fontSize: AVATAR_SIZE * 0.38,
    color: '#fff',
    fontWeight: '300',
  },
  companionName: {
    fontSize: 40,
    fontWeight: '300',
    color: '#3D2C1E',
    letterSpacing: 3,
    textAlign: 'center',
  },
  companionNameLocked: { color: '#9E8A7A' },
})
