import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'device_token'
const PATIENT_KEY = 'patient_id'

// Web fallback — SecureStore is native-only
const store = {
  get: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  set: (key: string, value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  delete: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
}

export async function saveDeviceToken(token: string, patientId: string) {
  await store.set(TOKEN_KEY, token)
  await store.set(PATIENT_KEY, patientId)
}

export async function getDeviceToken(): Promise<{ token: string; patientId: string } | null> {
  const token = await store.get(TOKEN_KEY)
  const patientId = await store.get(PATIENT_KEY)
  if (!token || !patientId) return null
  return { token, patientId }
}

export async function clearDeviceToken() {
  await store.delete(TOKEN_KEY)
  await store.delete(PATIENT_KEY)
}
