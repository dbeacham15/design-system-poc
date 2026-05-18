// server/src/routes/voice-session.ts
import { FastifyPluginAsync } from 'fastify'
import { prisma } from '@dementia/db'
import { deviceAuthHook } from '../middleware/device-auth'
import { createVoiceSession, generateClosingLine } from '../services/voice-session.service'
import { classifySafetyAlert, handleSafetyEvent } from '../services/safety.service'

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

  // Tablet calls this when session-level silence threshold is reached
  fastify.post('/session/close', { preHandler: deviceAuthHook }, async (request, reply) => {
    const patientId = (request as any).patientId as string
    try {
      const result = await generateClosingLine(patientId)
      return reply.send({ data: result })
    } catch (err: any) {
      if (err.message === 'NO_COMPANION_CONFIGURED')
        return reply.status(400).send({ error: { code: 'NO_COMPANION', message: 'Companion not configured' } })
      throw err
    }
  })

  fastify.post(
    '/transcripts',
    {
      preHandler: deviceAuthHook,
      schema: {
        body: {
          type: 'object',
          required: ['conversationId', 'text', 'role'],
          properties: {
            conversationId: { type: 'string' },
            text: { type: 'string' },
            role: { type: 'string', enum: ['patient', 'companion'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { conversationId, text, role } = request.body as {
        conversationId: string
        text: string
        role: 'patient' | 'companion'
      }
      const patientId = (request as any).patientId as string

      await prisma.conversationTurn.create({
        data: { conversationId, role, content: text },
      })

      const result = classifySafetyAlert(text)

      if (result && role === 'patient') {
        await handleSafetyEvent(patientId, conversationId, result.severity, result.trigger, text)
      }

      return reply.send({ data: { safetyAlert: result ?? null } })
    }
  )
}
