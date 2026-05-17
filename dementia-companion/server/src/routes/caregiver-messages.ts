// server/src/routes/caregiver-messages.ts
import { FastifyPluginAsync } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { deviceAuthHook } from '../middleware/device-auth'
import { prisma } from '@dementia/db'

export const caregiverMessageRoutes: FastifyPluginAsync = async (fastify) => {
  // Caregiver sends a message via dashboard
  fastify.post('/', {
    preHandler: caregiverAuthHook,
    schema: {
      body: {
        type: 'object',
        required: ['patientId', 'fromName', 'message'],
        properties: {
          patientId: { type: 'string' },
          fromName: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { patientId, fromName, message } = request.body as {
      patientId: string; fromName: string; message: string
    }
    const msg = await prisma.caregiverMessage.create({ data: { patientId, fromName, message } })
    return reply.status(201).send({ data: msg })
  })

  // Tablet polls for pending messages to weave into conversation
  fastify.get('/pending', { preHandler: deviceAuthHook }, async (request, reply) => {
    const patientId = (request as any).patientId as string
    const messages = await prisma.caregiverMessage.findMany({
      where: { patientId, deliveredAt: null },
      orderBy: { createdAt: 'asc' },
    })
    return reply.send({ data: messages })
  })

  // Tablet marks message as delivered after companion says it
  fastify.post('/:id/delivered', { preHandler: deviceAuthHook }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.caregiverMessage.update({ where: { id }, data: { deliveredAt: new Date() } })
    return reply.send({ data: { delivered: true } })
  })
}
