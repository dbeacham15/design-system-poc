// apps/patient-tablet/src/screens/CompanionScreen.tsx
import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useKeepAwake } from 'expo-keep-awake'
import { useVoiceSession } from '../hooks/useVoiceSession'

interface Props { deviceToken: string }

export function CompanionScreen({ deviceToken }: Props) {
  useKeepAwake() // Tablet never sleeps during companion session

  const { state, companionName, startSession, endSession } = useVoiceSession(deviceToken)
  const pulseAnim = React.useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(1)
    }
  }, [state])

  return (
    <View style={styles.container}>
      {/* Large, warm companion avatar area */}
      <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.orbInitial}>{companionName?.[0] ?? '?'}</Text>
      </Animated.View>

      <Text style={styles.companionName}>{companionName}</Text>
      <Text style={styles.statusText}>{stateLabel(state)}</Text>

      {state === 'idle' && (
        <TouchableOpacity style={styles.talkButton} onPress={startSession}>
          <Text style={styles.talkButtonText}>Tap to Talk</Text>
        </TouchableOpacity>
      )}

      {(state === 'listening' || state === 'speaking') && (
        <TouchableOpacity style={styles.endButton} onPress={endSession}>
          <Text style={styles.endButtonText}>End Conversation</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function stateLabel(state: string): string {
  switch (state) {
    case 'idle': return 'Ready when you are'
    case 'connecting': return 'Just a moment...'
    case 'listening': return 'Listening...'
    case 'speaking': return 'Speaking...'
    case 'error': return 'Something went wrong. Tap to try again.'
    default: return ''
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', alignItems: 'center', justifyContent: 'center', gap: 24 },
  orb: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#C4845A',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  orbInitial: { fontSize: 80, color: '#fff', fontWeight: '300' },
  companionName: { fontSize: 48, fontWeight: '300', color: '#3D2C1E', letterSpacing: 2 },
  statusText: { fontSize: 24, color: '#9B8070' },
  talkButton: { marginTop: 16, backgroundColor: '#8B5E3C', borderRadius: 50,
    paddingVertical: 24, paddingHorizontal: 64 },
  talkButtonText: { color: '#fff', fontSize: 28, fontWeight: '500' },
  endButton: { marginTop: 16, borderWidth: 2, borderColor: '#C4845A', borderRadius: 50,
    paddingVertical: 20, paddingHorizontal: 48 },
  endButtonText: { color: '#C4845A', fontSize: 24 },
})
