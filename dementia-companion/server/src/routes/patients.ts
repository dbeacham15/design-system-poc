// server/src/routes/patients.ts
import { FastifyPluginAsync } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { generatePairingCode } from '../services/device.service'
import { prisma } from '@dementia/db'

export const patientRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', caregiverAuthHook)

  fastify.post('/', async (request, reply) => {
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
    const code = await generatePairingCode(patientId)
    return reply.send({ data: { code } })
  })

  // Memory cards
  fastify.post('/:id/memory-cards', async (request, reply) => {
    const { id: patientId } = request.params as { id: string }
    const { type, label, sentiment, structuredData, freeText } = request.body as any
    const card = await prisma.memoryCard.create({ data: { patientId, type, label, sentiment, structuredData, freeText } })
    return reply.status(201).send({ data: card })
  })

  fastify.get('/:id/memory-cards', async (request, reply) => {
    const { id: patientId } = request.params as { id: string }
    const cards = await prisma.memoryCard.findMany({ where: { patientId } })
    return reply.send({ data: cards })
  })

  fastify.delete('/:id/memory-cards/:cardId', async (request, reply) => {
    const { cardId } = request.params as { id: string; cardId: string }
    await prisma.memoryCard.delete({ where: { id: cardId } })
    return reply.send({ data: { deleted: true } })
  })
}
