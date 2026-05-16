// server/src/routes/companion.ts
import { FastifyPluginAsync } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { prisma } from '@dementia/db'

export const companionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', caregiverAuthHook)

  // Create or update companion for a patient
  fastify.post('/patients/:patientId/companion', async (request, reply) => {
    const { patientId } = request.params as { patientId: string }
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
    const companion = await prisma.companion.findUnique({ where: { patientId } })
    if (!companion) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Companion not configured' } })
    return reply.send({ data: companion })
  })
}
