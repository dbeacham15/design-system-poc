// server/src/routes/devices.ts
import { FastifyPluginAsync } from 'fastify'
import { redeemPairingCode } from '../services/device.service'

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
}
