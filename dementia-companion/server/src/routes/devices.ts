// server/src/routes/devices.ts
import { FastifyPluginAsync } from 'fastify'
import { redeemPairingCode } from '../services/device.service'
import { deviceAuthHook } from '../middleware/device-auth'
import { prisma } from '@dementia/db'

export const deviceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/pair', async (request, reply) => {
    const { pairingCode, deviceName } = request.body as { pairingCode: string; deviceName?: string }
    try {
      const result = await redeemPairingCode(pairingCode, deviceName)
      const companion = await prisma.companion.findUnique({ where: { patientId: result.patientId } })
      const introAudioUrl = companion?.introAudioUrl?.startsWith('data:')
        ? null
        : (companion?.introAudioUrl ?? null)
      return reply.send({
        data: {
          ...result,
          avatarUnlocked: companion?.avatarUnlocked ?? false,
          idleLoopVideoUrl: companion?.idleLoopVideoUrl ?? null,
          companionName: companion?.name ?? null,
          introAudioUrl,
        },
      })
    } catch {
      return reply.status(404).send({ error: { code: 'INVALID_CODE', message: 'Pairing code not found or expired' } })
    }
  })

  // Tablet polls this to detect introduction without push notifications (web mode).
  // Returns a companion snapshot so the tablet can transition orb→avatar immediately.
  fastify.get('/status', { preHandler: deviceAuthHook }, async (request, reply) => {
    const patientId = (request as any).patientId as string
    const companion = await prisma.companion.findUnique({ where: { patientId } })
    // Omit base64 data URLs from the response — they are too large to pass as props
    // and will be replaced with hosted URLs before production.
    const introAudioUrl = companion?.introAudioUrl?.startsWith('data:')
      ? null
      : (companion?.introAudioUrl ?? null)
    return reply.send({
      data: {
        avatarUnlocked: companion?.avatarUnlocked ?? false,
        idleLoopVideoUrl: companion?.idleLoopVideoUrl ?? null,
        companionName: companion?.name ?? null,
        introAudioUrl,
      },
    })
  })

  // Tablet registers its Expo push token after pairing
  fastify.patch('/push-token', { preHandler: deviceAuthHook }, async (request, reply) => {
    const { expoPushToken } = request.body as { expoPushToken: string }
    if (!expoPushToken || typeof expoPushToken !== 'string') {
      return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'expoPushToken is required' } })
    }
    const token = request.headers['x-device-token'] as string
    const deviceToken = await prisma.deviceToken.findUnique({ where: { token } })
    if (!deviceToken) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Device not found' } })

    await prisma.deviceToken.update({ where: { id: deviceToken.id }, data: { expoPushToken } })
    return reply.send({ data: { ok: true } })
  })
}
