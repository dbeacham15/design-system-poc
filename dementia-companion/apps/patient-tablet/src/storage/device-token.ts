// apps/patient-tablet/src/storage/device-token.ts
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'device_token'
const PATIENT_KEY = 'patient_id'

export async function saveDeviceToken(token: string, patientId: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  await SecureStore.setItemAsync(PATIENT_KEY, patientId)
}

export async function getDeviceToken(): Promise<{ token: string; patientId: string } | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  const patientId = await SecureStore.getItemAsync(PATIENT_KEY)
  if (!token || !patientId) return null
  return { token, patientId }
}

export async function clearDeviceToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(PATIENT_KEY)
}
