// server/tests/ownership.test.ts
// Verifies that cross-caregiver/cross-patient ownership is enforced on mutating routes.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../src/index'
import { prisma } from '@dementia/db'
import bcrypt from 'bcrypt'
import type { FastifyInstance } from 'fastify'

let server: FastifyInstance

// Caregiver A owns patient A
let tokenA: string
let patientAId: string

// Caregiver B owns patient B
let tokenB: string
let patientBId: string

const EMAIL_A = 'ownership-a@example.com'
const EMAIL_B = 'ownership-b@example.com'
const PASSWORD = 'Ownership123!'

beforeAll(async () => {
  server = await build({ logger: false })

  await prisma.caregiverAccount.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } })

  const passwordHash = await bcrypt.hash(PASSWORD, 10)
  await prisma.caregiverAccount.create({ data: { email: EMAIL_A, passwordHash } })
  await prisma.caregiverAccount.create({ data: { email: EMAIL_B, passwordHash } })

  const loginA = await server.inject({ method: 'POST', url: '/api/auth/login', body: { email: EMAIL_A, password: PASSWORD } })
  const loginB = await server.inject({ method: 'POST', url: '/api/auth/login', body: { email: EMAIL_B, password: PASSWORD } })
  tokenA = loginA.json().data.accessToken
  tokenB = loginB.json().data.accessToken

  const pA = await server.inject({ method: 'POST', url: '/api/patients', headers: { authorization: `Bearer ${tokenA}` }, body: { name: 'Patient A' } })
  const pB = await server.inject({ method: 'POST', url: '/api/patients', headers: { authorization: `Bearer ${tokenB}` }, body: { name: 'Patient B' } })
  patientAId = pA.json().data.id
  patientBId = pB.json().data.id
})

afterAll(async () => {
  await prisma.caregiverAccount.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } })
  await server.close()
})

// ── Memory card ownership ──────────────────────────────────────────────────────

describe('Memory card DELETE cross-patient ownership', () => {
  it('returns 404 when deleting a card belonging to a different patient', async () => {
    const cardRes = await server.inject({
      method: 'POST',
      url: `/api/patients/${patientAId}/memory-cards`,
      headers: { authorization: `Bearer ${tokenA}` },
      body: { type: 'person', label: 'Daughter Linda', sentiment: 'positive' },
    })
    expect(cardRes.statusCode).toBe(201)
    const cardId = cardRes.json().data.id

    // Caregiver B tries to delete it via their own patient route
    const res = await server.inject({
      method: 'DELETE',
      url: `/api/patients/${patientBId}/memory-cards/${cardId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    })
    expect(res.statusCode).toBe(404)
  })
})

// ── Emergency contact ownership ────────────────────────────────────────────────

describe('Emergency contact DELETE ownership', () => {
  it('returns 404 when deleting a contact belonging to a different caregiver', async () => {
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/emergency-contacts',
      headers: { authorization: `Bearer ${tokenA}` },
      body: { name: 'Sister Sue', phone: '+15555550101' },
    })
    expect(createRes.statusCode).toBe(201)
    const contactId = createRes.json().data.id

    // Caregiver B tries to delete it
    const res = await server.inject({
      method: 'DELETE',
      url: `/api/emergency-contacts/${contactId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    })
    expect(res.statusCode).toBe(404)

    // Contact is still there for caregiver A
    const check = await server.inject({
      method: 'GET',
      url: '/api/emergency-contacts',
      headers: { authorization: `Bearer ${tokenA}` },
    })
    const ids = check.json().data.map((c: { id: string }) => c.id)
    expect(ids).toContain(contactId)
  })
})

// ── Transcript conversationId ownership ───────────────────────────────────────

describe('POST /api/voice/transcripts conversationId ownership', () => {
  it('returns 404 when conversationId does not belong to the device patient', async () => {
    // Set up a companion for patient A (required to pair)
    await server.inject({
      method: 'POST',
      url: `/api/patients/${patientAId}/companion`,
      headers: { authorization: `Bearer ${tokenA}` },
      body: { name: 'Grace', voiceId: 'nova', personalityPreset: 'WARM_NURTURER' },
    })

    // Pair a device to patient A
    const codeRes = await server.inject({
      method: 'POST', url: `/api/patients/${patientAId}/pairing-code`,
      headers: { authorization: `Bearer ${tokenA}` },
    })
    const pairRes = await server.inject({ method: 'POST', url: '/api/devices/pair', body: { pairingCode: codeRes.json().data.code } })
    const deviceToken = pairRes.json().data.deviceToken

    // Create a conversation belonging to patient B directly in DB
    const convB = await prisma.conversation.create({ data: { patientId: patientBId } })

    // Device A tries to write a turn into patient B's conversation
    const res = await server.inject({
      method: 'POST',
      url: '/api/voice/transcripts',
      headers: { 'x-device-token': deviceToken },
      body: { conversationId: convB.id, text: 'Hello', role: 'patient' },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('NOT_FOUND')
  })
})
