// server/src/services/device.service.ts
import { prisma } from '@dementia/db'
import crypto from 'crypto'

export async function generatePairingCode(patientId: string): Promise<string> {
  const code = crypto.randomBytes(4).toString('hex').toUpperCase() // e.g. "A3F2B1C4"
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min
  await prisma.pairingCode.create({ data: { code, patientId, expiresAt } })
  return code
}

export async function redeemPairingCode(code: string, deviceName?: string) {
  const pairing = await prisma.pairingCode.findUnique({ where: { code } })
  if (!pairing || pairing.usedAt || pairing.expiresAt < new Date()) {
    throw new Error('INVALID_CODE')
  }

  await prisma.pairingCode.update({ where: { id: pairing.id }, data: { usedAt: new Date() } })

  const deviceToken = await prisma.deviceToken.create({
    data: { patientId: pairing.patientId, deviceName },
  })

  return { deviceToken: deviceToken.token, patientId: pairing.patientId }
}
