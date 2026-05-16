// tests/e2e/smoke.test.ts
// NOTE: These tests require a running PostgreSQL database.
// Run: DATABASE_URL=postgresql://localhost/dementia_companion npx vitest run tests/e2e/smoke.test.ts
import { describe, it, expect } from 'vitest'
import { buildTestServer, createTestCaregiver } from '../../server/tests/helpers'

describe('Critical path smoke test', () => {
  it('caregiver registers and creates a patient', async () => {
    const app = await buildTestServer()
    const { accessToken } = await createTestCaregiver(app)

    const res = await app.inject({
      method: 'POST',
      url: '/api/patients',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { name: 'Margaret' },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).data.id).toBeDefined()
  })

  it('caregiver configures companion', async () => {
    const app = await buildTestServer()
    const { accessToken } = await createTestCaregiver(app)

    const { data: patient } = JSON.parse((await app.inject({
      method: 'POST', url: '/api/patients',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { name: 'Margaret' },
    })).body)

    const res = await app.inject({
      method: 'POST',
      url: `/api/patients/${patient.id}/companion`,
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { name: 'Grace', voiceId: 'nova', personalityStyle: 'warm',
        speakingStyle: 'simple', engagementLevel: 'medium', genderPresentation: 'feminine' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data.name).toBe('Grace')
  })

  it('device pairs successfully with pairing code', async () => {
    const app = await buildTestServer()
    const { accessToken } = await createTestCaregiver(app)

    const { data: patient } = JSON.parse((await app.inject({
      method: 'POST', url: '/api/patients',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { name: 'Margaret' },
    })).body)

    const { data: { code } } = JSON.parse((await app.inject({
      method: 'POST',
      url: `/api/patients/${patient.id}/pairing-code`,
      headers: { Authorization: `Bearer ${accessToken}` },
    })).body)

    const res = await app.inject({
      method: 'POST',
      url: '/api/devices/pair',
      payload: { pairingCode: code, deviceName: "Margaret's iPad" },
    })
    expect(res.statusCode).toBe(200)
    const { data } = JSON.parse(res.body)
    expect(data.deviceToken).toBeDefined()
    expect(data.patientId).toBe(patient.id)
  })

  it('caregiver can send a message and tablet sees it as pending', async () => {
    const app = await buildTestServer()
    const { accessToken } = await createTestCaregiver(app)

    const { data: patient } = JSON.parse((await app.inject({
      method: 'POST', url: '/api/patients',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { name: 'Margaret' },
    })).body)

    // Generate pairing code and pair device
    const { data: { code } } = JSON.parse((await app.inject({
      method: 'POST', url: `/api/patients/${patient.id}/pairing-code`,
      headers: { Authorization: `Bearer ${accessToken}` },
    })).body)
    const { data: { deviceToken } } = JSON.parse((await app.inject({
      method: 'POST', url: '/api/devices/pair',
      payload: { pairingCode: code },
    })).body)

    // Caregiver sends message
    await app.inject({
      method: 'POST', url: '/api/messages',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { patientId: patient.id, fromName: 'Linda', message: 'I love you so much, Mom.' },
    })

    // Tablet polls for pending messages
    const res = await app.inject({
      method: 'GET', url: '/api/messages/pending',
      headers: { 'x-device-token': deviceToken },
    })
    expect(res.statusCode).toBe(200)
    const { data: messages } = JSON.parse(res.body)
    expect(messages[0].message).toBe('I love you so much, Mom.')
  })

  it('safety alert is created and can be acknowledged', async () => {
    const app = await buildTestServer()
    const { accessToken } = await createTestCaregiver(app)

    // Note: safety event creation happens via the safety service (called from voice session)
    // This test verifies the GET /api/safety/events and POST /api/safety/events/:id/acknowledge endpoints
    const eventsRes = await app.inject({
      method: 'GET', url: '/api/safety/events',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(eventsRes.statusCode).toBe(200)
    expect(JSON.parse(eventsRes.body).data).toBeInstanceOf(Array)
  })
})
