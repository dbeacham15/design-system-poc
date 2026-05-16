// apps/patient-tablet/src/api/client.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options: RequestInit & { deviceToken?: string }): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.deviceToken) headers['x-device-token'] = options.deviceToken

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json = await res.json()
  if (json.error) throw new Error(json.error.code)
  return json.data
}

export const apiClient = {
  pairDevice: (code: string) =>
    request<{ deviceToken: string; patientId: string }>('/api/devices/pair', {
      method: 'POST',
      body: JSON.stringify({ pairingCode: code }),
    }),

  createVoiceSession: (deviceToken: string) =>
    request<{ sessionToken: string; conversationId: string; companionName: string }>(
      '/api/voice/session', { method: 'POST', deviceToken }
    ),

  getCaregiverMessages: (deviceToken: string) =>
    request<Array<{ id: string; fromName: string; message: string }>>('/api/messages/pending', {
      method: 'GET', deviceToken
    }),
}
