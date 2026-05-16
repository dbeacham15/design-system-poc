// server/src/middleware/device-auth.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@dementia/db'

export async function deviceAuthHook(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers['x-device-token'] as string
  if (!token) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Device token required' } })

  const deviceToken = await prisma.deviceToken.findUnique({ where: { token } })
  if (!deviceToken || deviceToken.revokedAt) {
    return reply.status(401).send({ error: { code: 'DEVICE_REVOKED', message: 'Device token invalid or revoked' } })
  }

  await prisma.deviceToken.update({ where: { id: deviceToken.id }, data: { lastSeenAt: new Date() } })
  ;(request as any).patientId = deviceToken.patientId
}
