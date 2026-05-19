// server/src/routes/patients.ts
import { FastifyPluginAsync, FastifyReply } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { generatePairingCode } from '../services/device.service'
import { prisma } from '@dementia/db'

async function assertPatientOwnership(patientId: string, caregiverId: string, reply: FastifyReply) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, caregiverId } })
  if (!patient) {
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Patient not found' } })
    return false
  }
  return true
}

export const patientRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', caregiverAuthHook)

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { sub: caregiverId } = request.user as { sub: string }
    const { name } = request.body as { name: string }
    const patient = await prisma.patient.create({ data: { caregiverId, name } })
    return reply.status(201).send({ data: patient })
  })

  fastify.get('/', async (request, reply) => {
    const { sub: caregiverId } = request.user as { sub: string }
    const patients = await prisma.patient.findMany({ where: { caregiverId } })
    return reply.send({ data: patients })
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: caregiverId } = request.user as { sub: string }
    const patient = await prisma.patient.findFirst({ where: { id, caregiverId } })
    if (!patient) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Patient not found' } })
    return reply.send({ data: patient })
  })

  // Generate pairing code for a patient's tablet
  fastify.post('/:id/pairing-code', async (request, reply) => {
    const { id: patientId } = request.params as { id: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const code = await generatePairingCode(patientId)
    return reply.send({ data: { code } })
  })

  // Memory cards
  fastify.post('/:id/memory-cards', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'label'],
        properties: {
          type: { type: 'string' },
          label: { type: 'string' },
          sentiment: { type: 'string' },
          structuredData: { type: 'object' },
          freeText: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id: patientId } = request.params as { id: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const { type, label, sentiment, structuredData, freeText } = request.body as any
    const card = await prisma.memoryCard.create({ data: { patientId, type, label, sentiment, structuredData, freeText } })
    return reply.status(201).send({ data: card })
  })

  fastify.get('/:id/memory-cards', async (request, reply) => {
    const { id: patientId } = request.params as { id: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const cards = await prisma.memoryCard.findMany({ where: { patientId } })
    return reply.send({ data: cards })
  })

  fastify.delete('/:id/memory-cards/:cardId', async (request, reply) => {
    const { id: patientId, cardId } = request.params as { id: string; cardId: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const deleted = await prisma.memoryCard.deleteMany({ where: { id: cardId, patientId } })
    if (deleted.count === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Memory card not found' } })
    }
    return reply.send({ data: { deleted: true } })
  })

  fastify.get('/:id/conversations', async (request, reply) => {
    const { id: patientId } = request.params as { id: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const conversations = await prisma.conversation.findMany({
      where: { patientId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    })
    return reply.send({ data: conversations })
  })
}
