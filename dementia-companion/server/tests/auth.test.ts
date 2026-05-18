// server/tests/auth.test.ts
// NOTE: These tests require a running PostgreSQL database.
// Run: createdb dementia_companion && DATABASE_URL=postgresql://localhost/dementia_companion npx vitest run tests/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildTestServer } from './helpers'
import { prisma } from '@dementia/db'

const REGISTER_EMAIL = 'auth-register-test@example.com'

describe('POST /api/auth/register', () => {
  beforeAll(async () => {
    await prisma.caregiverAccount.deleteMany({ where: { email: REGISTER_EMAIL } })
  })
  afterAll(async () => {
    await prisma.caregiverAccount.deleteMany({ where: { email: REGISTER_EMAIL } })
  })

  it('creates a caregiver account and returns tokens', async () => {
    const app = await buildTestServer()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: REGISTER_EMAIL, password: 'SecurePass123!' },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
  })

  it('rejects duplicate email', async () => {
    const app = await buildTestServer()
    await app.inject({ method: 'POST', url: '/api/auth/register',
      payload: { email: 'dupe@example.com', password: 'SecurePass123!' } })
    const res = await app.inject({ method: 'POST', url: '/api/auth/register',
      payload: { email: 'dupe@example.com', password: 'SecurePass123!' } })
    expect(res.statusCode).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const app = await buildTestServer()
    await app.inject({ method: 'POST', url: '/api/auth/register',
      payload: { email: 'login@example.com', password: 'SecurePass123!' } })
    const res = await app.inject({ method: 'POST', url: '/api/auth/login',
      payload: { email: 'login@example.com', password: 'SecurePass123!' } })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data.accessToken).toBeDefined()
  })

  it('rejects invalid password', async () => {
    const app = await buildTestServer()
    const res = await app.inject({ method: 'POST', url: '/api/auth/login',
      payload: { email: 'login@example.com', password: 'wrongpassword' } })
    expect(res.statusCode).toBe(401)
  })
})
