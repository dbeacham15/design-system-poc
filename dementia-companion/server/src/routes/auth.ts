// server/src/routes/auth.ts
import { FastifyPluginAsync } from 'fastify'
import { prisma } from '@dementia/db'
import { registerCaregiver, validateCaregiver, createRefreshToken, rotateRefreshToken } from '../services/auth.service'
import { caregiverAuthHook } from '../middleware/caregiver-auth'

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }
    try {
      const account = await registerCaregiver(email, password)
      const accessToken = fastify.jwt.sign({ sub: account.id, role: 'caregiver' })
      const refreshToken = await createRefreshToken(account.id)
      return reply.status(201).send({ data: { accessToken, refreshToken } })
    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS')
        return reply.status(409).send({ error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } })
      throw err
    }
  })

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }
    try {
      const account = await validateCaregiver(email, password)
      const accessToken = fastify.jwt.sign({ sub: account.id, role: 'caregiver' })
      const refreshToken = await createRefreshToken(account.id)
      return reply.send({ data: { accessToken, refreshToken } })
    } catch {
      return reply.status(401).send({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
    }
  })

  fastify.get('/me', { preHandler: caregiverAuthHook }, async (request, reply) => {
    const { sub } = request.user as { sub: string }
    const account = await prisma.caregiverAccount.findUnique({
      where: { id: sub },
      select: { id: true, email: true, createdAt: true },
    })
    if (!account) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Account not found' } })
    return reply.send({ data: account })
  })

  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }
    try {
      const { caregiverId, newRefreshToken } = await rotateRefreshToken(refreshToken)
      const accessToken = fastify.jwt.sign({ sub: caregiverId, role: 'caregiver' })
      return reply.send({ data: { accessToken, refreshToken: newRefreshToken } })
    } catch {
      return reply.status(401).send({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token invalid or expired' } })
    }
  })
}
