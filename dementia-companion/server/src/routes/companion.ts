// server/src/routes/companion.ts
import { FastifyPluginAsync, FastifyReply } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { prisma } from '@dementia/db'

async function assertPatientOwnership(patientId: string, caregiverId: string, reply: FastifyReply) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, caregiverId } })
  if (!patient) {
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Patient not found' } })
    return false
  }
  return true
}

export const companionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', caregiverAuthHook)

  // Create or update companion for a patient
  fastify.post('/patients/:patientId/companion', async (request, reply) => {
    const { patientId } = request.params as { patientId: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const { name, voiceId, personalityStyle, engagementLevel, genderPresentation, speakingStyle } = request.body as any
    const companion = await prisma.companion.upsert({
      where: { patientId },
      create: { patientId, name, voiceId, personalityStyle, engagementLevel, genderPresentation, speakingStyle },
      update: { name, voiceId, personalityStyle, engagementLevel, genderPresentation, speakingStyle },
    })
    return reply.send({ data: companion })
  })

  fastify.get('/patients/:patientId/companion', async (request, reply) => {
    const { patientId } = request.params as { patientId: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const companion = await prisma.companion.findUnique({ where: { patientId } })
    if (!companion) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Companion not configured' } })
    return reply.send({ data: companion })
  })
}
