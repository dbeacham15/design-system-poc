// server/tests/devices.test.ts
// NOTE: These tests require a running PostgreSQL database.
// Run: DATABASE_URL=postgresql://localhost/dementia_companion npx vitest run tests/devices.test.ts
import { describe, it, expect } from 'vitest'
import { buildTestServer, createTestPatientWithPairingCode } from './helpers'

describe('POST /api/devices/pair', () => {
  it('returns a device token when given a valid pairing code', async () => {
    const app = await buildTestServer()
    // Create caregiver + patient first, get pairing code
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
