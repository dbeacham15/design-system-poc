// server/tests/introduce.test.ts
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { build } from '../src/index'
import { prisma } from '@dementia/db'
import bcrypt from 'bcrypt'
import type { FastifyInstance } from 'fastify'

// Mock Expo push API
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock talking head adapter (needed for portrait approve)
vi.mock('../src/services/talking-head', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    createSimliAdapter: vi.fn(() => ({
      validatePortrait: vi.fn().mockResolvedValue({ valid: true }),
      generateIdleLoop: vi.fn().mockResolvedValue({ videoUrl: 'https://simli.example/idle.mp4', durationSeconds: 8 }),
      createLiveSession: vi.fn().mockResolvedValue({ sessionToken: 'sim-test-token', metadata: {} }),
    })),
  }
})

vi.mock('openai', () => ({
  default: class MockOpenAI {
    images = { generate: vi.fn().mockResolvedValue({ data: [{ url: 'https://dalle.example/img.jpg' }] }) }
    audio = { speech: { create: vi.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(0) }) } }
    chat = { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Goodbye Margaret!' } }] }) } }
  },
}))

let server: FastifyInstance
let authToken: string
let patientId: string
let companionId: string
const EMAIL = 'intro-test@example.com'

beforeAll(async () => {
  server = await build({ logger: false })

  await prisma.caregiverAccount.deleteMany({ where: { email: EMAIL } })
  const passwordHash = await bcrypt.hash('password', 10)
  await prisma.caregiverAccount.create({ data: { email: EMAIL, passwordHash } })

  const loginRes = await server.inject({
    method: 'POST', url: '/api/auth/login',
    body: { email: EMAIL, password: 'password' },
  })
  authToken = loginRes.json().data.accessToken

  const patientRes = await server.inject({
    method: 'POST', url: '/api/patients',
    headers: { authorization: `Bearer ${authToken}` },
    body: { name: 'Margaret' },
  })
  patientId = patientRes.json().data.id

  const companionRes = await server.inject({
    method: 'POST', url: `/api/patients/${patientId}/companion`,
    headers: { authorization: `Bearer ${authToken}` },
    body: { name: 'Grace', voiceId: 'nova', personalityPreset: 'WARM_NURTURER' },
  })
  companionId = companionRes.json().data.id
})

afterAll(async () => {
  await prisma.caregiverAccount.deleteMany({ where: { email: EMAIL } })
  await server.close()
})

beforeEach(async () => {
  // Reset avatarUnlocked before each test
  await prisma.companion.update({ where: { id: companionId }, data: { avatarUnlocked: false } })
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [{ status: 'ok' }] }) })
})

describe('POST /api/companions/:companionId/introduce', () => {
  it('returns 400 if tablet has no push token registered', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/api/companions/${companionId}/introduce`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('NO_PUSH_TOKEN')
  })

  it('sends push notification and sets avatarUnlocked=true', async () => {
    // Register a push token for the patient's device
    const pairingRes = await server.inject({
      method: 'POST', url: `/api/patients/${patientId}/pairing-code`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    const pairingCode = pairingRes.json().data.code

    const pairRes = await server.inject({
      method: 'POST', url: '/api/devices/pair',
      body: { pairingCode, deviceName: 'Test Tablet' },
    })
    const deviceAuthToken = pairRes.json().data.deviceToken

    await server.inject({
      method: 'PATCH', url: '/api/devices/push-token',
      headers: { 'x-device-token': deviceAuthToken },
      body: { expoPushToken: 'ExponentPushToken[test-token-abc]' },
    })

    // Now introduce
    const res = await server.inject({
      method: 'POST',
      url: `/api/companions/${companionId}/introduce`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.introduced).toBe(true)

    // Push notification was sent to Expo
    expect(mockFetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({ method: 'POST' })
    )

    // avatarUnlocked is now true
    const companion = await prisma.companion.findUnique({ where: { id: companionId } })
    expect(companion?.avatarUnlocked).toBe(true)
  })

  it('returns 409 if companion has already been introduced', async () => {
    await prisma.companion.update({ where: { id: companionId }, data: { avatarUnlocked: true } })

    const res = await server.inject({
      method: 'POST',
      url: `/api/companions/${companionId}/introduce`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('ALREADY_INTRODUCED')
  })

  it('returns 404 if companion belongs to a different caregiver', async () => {
    // Create a second caregiver
    const email2 = 'intro-test-2@example.com'
    await prisma.caregiverAccount.deleteMany({ where: { email: email2 } })
    await prisma.caregiverAccount.create({ data: { email: email2, passwordHash: await bcrypt.hash('password2', 10) } })
    const login2 = await server.inject({ method: 'POST', url: '/api/auth/login', body: { email: email2, password: 'password2' } })
    const token2 = login2.json().data.accessToken

    const res = await server.inject({
      method: 'POST',
      url: `/api/companions/${companionId}/introduce`,
      headers: { authorization: `Bearer ${token2}` },
    })
    expect(res.statusCode).toBe(404)

    await prisma.caregiverAccount.deleteMany({ where: { email: email2 } })
  })
})

describe('PATCH /api/devices/push-token', () => {
  it('stores expoPushToken on the device token', async () => {
    const pairingRes = await server.inject({
      method: 'POST', url: `/api/patients/${patientId}/pairing-code`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    const pairingCode = pairingRes.json().data.code

    const pairRes = await server.inject({
      method: 'POST', url: '/api/devices/pair',
      body: { pairingCode, deviceName: 'Test Tablet 2' },
    })
    const deviceAuthToken = pairRes.json().data.deviceToken

    const res = await server.inject({
      method: 'PATCH', url: '/api/devices/push-token',
      headers: { 'x-device-token': deviceAuthToken },
      body: { expoPushToken: 'ExponentPushToken[abc123]' },
    })
    expect(res.statusCode).toBe(200)

    const dt = await prisma.deviceToken.findFirst({ where: { token: deviceAuthToken } })
    expect(dt?.expoPushToken).toBe('ExponentPushToken[abc123]')
  })

  it('returns 400 if expoPushToken is missing', async () => {
    const pairingRes = await server.inject({
      method: 'POST', url: `/api/patients/${patientId}/pairing-code`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    const pairingCode = pairingRes.json().data.code
    const pairRes = await server.inject({ method: 'POST', url: '/api/devices/pair', body: { pairingCode } })
    const deviceAuthToken = pairRes.json().data.deviceToken

    const res = await server.inject({
      method: 'PATCH', url: '/api/devices/push-token',
      headers: { 'x-device-token': deviceAuthToken },
      body: {},
    })
    expect(res.statusCode).toBe(400)
  })
})
