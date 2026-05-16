// server/tests/helpers.ts
import { build } from '../src/index'

export async function buildTestServer() {
  const app = await build({ logger: false })
  return app
}

export async function createTestCaregiver(app: Awaited<ReturnType<typeof buildTestServer>>) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email: `test-${Date.now()}@example.com`, password: 'SecurePass123!' },
  })
  const { data } = JSON.parse(res.body)
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

export async function createTestPatientWithPairingCode(app: Awaited<ReturnType<typeof buildTestServer>>) {
  const { accessToken } = await createTestCaregiver(app)

  const patientRes = await app.inject({
    method: 'POST',
    url: '/api/patients',
    headers: { Authorization: `Bearer ${accessToken}` },
    payload: { name: 'Test Patient' },
  })
  const { data: patient } = JSON.parse(patientRes.body)

  const codeRes = await app.inject({
    method: 'POST',
    url: `/api/patients/${patient.id}/pairing-code`,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const { data: codeData } = JSON.parse(codeRes.body)
  return { patientId: patient.id, pairingCode: codeData.code }
}
