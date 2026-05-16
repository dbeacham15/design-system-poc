// apps/patient-tablet/src/screens/PairingScreen.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { saveDeviceToken } from '../storage/device-token'
import { apiClient } from '../api/client'

interface Props { onPaired: () => void }

export function PairingScreen({ onPaired }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePair = async () => {
    if (code.length < 8) return
    setLoading(true)
    try {
      const result = await apiClient.pairDevice(code.trim().toUpperCase())
      await saveDeviceToken(result.deviceToken, result.patientId)
      onPaired()
    } catch {
      Alert.alert('Invalid Code', 'Please check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Your Companion</Text>
      <Text style={styles.subtitle}>Enter the pairing code from the caregiver app</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="Enter code"
        autoCapitalize="characters"
        maxLength={8}
      />
      <TouchableOpacity style={styles.button} onPress={handlePair} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Connecting...' : 'Connect'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6EC', padding: 40 },
  title: { fontSize: 36, fontWeight: '600', color: '#3D2C1E', marginBottom: 12 },
  subtitle: { fontSize: 22, color: '#7A6355', marginBottom: 40, textAlign: 'center' },
  input: { fontSize: 32, borderWidth: 2, borderColor: '#C4A882', borderRadius: 12,
    padding: 16, width: 280, textAlign: 'center', letterSpacing: 8, backgroundColor: '#fff' },
  button: { marginTop: 32, backgroundColor: '#8B5E3C', borderRadius: 12, paddingVertical: 18, paddingHorizontal: 48 },
  buttonText: { color: '#fff', fontSize: 24, fontWeight: '600' },
})
