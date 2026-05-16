// server/src/routes/auth.ts
import { FastifyPluginAsync } from 'fastify'
import { registerCaregiver, validateCaregiver, createRefreshToken } from '../services/auth.service'

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (request, reply) => {
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

  fastify.post('/login', async (request, reply) => {
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
}
