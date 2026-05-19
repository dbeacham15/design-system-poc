// server/tests/devices.test.ts
// NOTE: These tests require a running PostgreSQL database.
// Run: DATABASE_URL=postgresql://localhost/dementia_companion npx vitest run tests/devices.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildTestServer, createTestCaregiver, createTestPatientWithPairingCode } from './helpers'
import { prisma } from '@dementia/db'
import bcrypt from 'bcrypt'
import type { FastifyInstance } from 'fastify'

describe('POST /api/devices/pair', () => {
  it('returns a device token when given a valid pairing code', async () => {
    const app = await buildTestServer()
    const { patientId, pairingCode } = await createTestPatientWithPairingCode(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/devices/pair',
      payload: { pairingCode, deviceName: 'Moms iPad' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data.deviceToken).toBeDefined()
    expect(JSON.parse(res.body).data.patientId).toBe(patientId)
  })

  it('rejects expired pairing code', async () => {
    const app = await buildTestServer()
    const res = await app.inject({
      method: 'POST',
      url: '/api/devices/pair',
      payload: { pairingCode: 'EXPIRED123', deviceName: 'iPad' },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/devices/status', () => {
  let app: FastifyInstance
  let deviceToken: string
  let patientId: string
  const EMAIL = 'devices-status-test@example.com'

  beforeAll(async () => {
    app = await buildTestServer()
    await prisma.caregiverAccount.deleteMany({ where: { email: EMAIL } })
    const passwordHash = await bcrypt.hash('password', 10)
    await prisma.caregiverAccount.create({ data: { email: EMAIL, passwordHash } })

    const loginRes = await app.inject({
      method: 'POST', url: '/api/auth/login',
      body: { email: EMAIL, password: 'password' },
    })
    const authToken = loginRes.json().data.accessToken

    const patientRes = await app.inject({
      method: 'POST', url: '/api/patients',
      headers: { authorization: `Bearer ${authToken}` },
      body: { name: 'Status Test Patient' },
    })
    patientId = patientRes.json().data.id

    const codeRes = await app.inject({
      method: 'POST', url: `/api/patients/${patientId}/pairing-code`,
      headers: { authorization: `Bearer ${authToken}` },
    })
    const pairingCode = codeRes.json().data.code

    const pairRes = await app.inject({
      method: 'POST', url: '/api/devices/pair',
      body: { pairingCode, deviceName: 'Status Test Tablet' },
    })
    deviceToken = pairRes.json().data.deviceToken
  })

  afterAll(async () => {
    await prisma.caregiverAccount.deleteMany({ where: { email: EMAIL } })
    await app.close()
  })

  it('returns 401 for an invalid device token', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/devices/status',
      headers: { 'x-device-token': 'not-a-real-token' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns companion snapshot with nulls when no companion is configured', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/devices/status',
      headers: { 'x-device-token': deviceToken },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.avatarUnlocked).toBe(false)
    expect(data.idleLoopVideoUrl).toBeNull()
    expect(data.companionName).toBeNull()
    expect(data.introAudioUrl).toBeNull()
  })

  it('returns companion name and asset URLs once companion and assets are configured', async () => {
    await prisma.companion.upsert({
      where: { patientId },
      create: {
        patientId,
        name: 'Grace',
        voiceId: 'nova',
        idleLoopVideoUrl: 'https://simli.example/idle.mp4',
        introAudioUrl: 'https://storage.example/intro.mp3',
      },
      update: {
        idleLoopVideoUrl: 'https://simli.example/idle.mp4',
        introAudioUrl: 'https://storage.example/intro.mp3',
        avatarUnlocked: false,
      },
    })

    const res = await app.inject({
      method: 'GET', url: '/api/devices/status',
      headers: { 'x-device-token': deviceToken },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.avatarUnlocked).toBe(false)
    expect(data.idleLoopVideoUrl).toBe('https://simli.example/idle.mp4')
    expect(data.companionName).toBe('Grace')
    expect(data.introAudioUrl).toBe('https://storage.example/intro.mp3')
  })

  it('returns avatarUnlocked true and full snapshot after introduction', async () => {
    await prisma.companion.update({
      where: { patientId },
      data: { avatarUnlocked: true },
    })

    const res = await app.inject({
      method: 'GET', url: '/api/devices/status',
      headers: { 'x-device-token': deviceToken },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.avatarUnlocked).toBe(true)
    expect(data.idleLoopVideoUrl).toBe('https://simli.example/idle.mp4')
    expect(data.companionName).toBe('Grace')
    expect(data.introAudioUrl).toBe('https://storage.example/intro.mp3')
  })

  it('omits base64 data URLs from introAudioUrl', async () => {
    await prisma.companion.update({
      where: { patientId },
      data: { introAudioUrl: 'data:audio/mpeg;base64,AAAA', avatarUnlocked: false },
    })

    const res = await app.inject({
      method: 'GET', url: '/api/devices/status',
      headers: { 'x-device-token': deviceToken },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.introAudioUrl).toBeNull()
  })
})
