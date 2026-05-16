// server/src/middleware/caregiver-auth.ts
import { FastifyRequest, FastifyReply } from 'fastify'

export async function caregiverAuthHook(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const payload = request.user as { sub: string; role: string }
    if (payload.role !== 'caregiver') throw new Error('Not a caregiver')
  } catch {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
  }
}
