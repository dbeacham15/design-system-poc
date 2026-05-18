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
      return reply.send({ data: result })
    } catch {
      return reply.status(404).send({ error: { code: 'INVALID_CODE', message: 'Pairing code not found or expired' } })
    }
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
