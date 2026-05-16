// server/src/routes/voice-session.ts
import { FastifyPluginAsync } from 'fastify'
import { deviceAuthHook } from '../middleware/device-auth'
import { createVoiceSession } from '../services/voice-session.service'

export const voiceSessionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/session', { preHandler: deviceAuthHook }, async (request, reply) => {
    const patientId = (request as any).patientId as string
    try {
      const session = await createVoiceSession(patientId)
      return reply.send({ data: session })
    } catch (err: any) {
      if (err.message === 'NO_COMPANION_CONFIGURED')
        return reply.status(400).send({ error: { code: 'NO_COMPANION', message: 'Companion not configured yet' } })
      throw err
    }
  })
}
