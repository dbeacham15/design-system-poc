// server/src/routes/safety.ts
import { FastifyPluginAsync } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { prisma } from '@dementia/db'

export const safetyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/events/:eventId/acknowledge', { preHandler: caregiverAuthHook }, async (request, reply) => {
    const { eventId } = request.params as { eventId: string }
    const { sub: caregiverId } = request.user as { sub: string }

    await prisma.safetyEvent.update({
      where: { id: eventId },
      data: { acknowledgedAt: new Date(), acknowledgedBy: caregiverId },
    })

    return reply.send({ data: { acknowledged: true } })
  })

  fastify.get('/events', { preHandler: caregiverAuthHook }, async (request, reply) => {
    const { sub: caregiverId } = request.user as { sub: string }
    const patients = await prisma.patient.findMany({ where: { caregiverId }, select: { id: true } })
    const patientIds = patients.map(p => p.id)

    const events = await prisma.safetyEvent.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return reply.send({ data: events })
  })
}
