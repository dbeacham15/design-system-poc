// server/src/services/auth.service.ts
import bcrypt from 'bcrypt'
import { prisma } from '@dementia/db'
import crypto from 'crypto'

const SALT_ROUNDS = 12

export async function registerCaregiver(email: string, password: string) {
  const existing = await prisma.caregiverAccount.findUnique({ where: { email } })
  if (existing) throw new Error('EMAIL_EXISTS')

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const account = await prisma.caregiverAccount.create({
    data: { email, passwordHash },
  })
  return account
}

export async function validateCaregiver(email: string, password: string) {
  const account = await prisma.caregiverAccount.findUnique({ where: { email } })
  if (!account) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(password, account.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  return account
}

export async function createRefreshToken(caregiverId: string) {
  const token = crypto.randomBytes(40).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await prisma.refreshToken.create({ data: { token, caregiverId, expiresAt } })
  return token
}

export async function rotateRefreshToken(token: string) {
  const record = await prisma.refreshToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) throw new Error('INVALID_REFRESH_TOKEN')
  // delete old, issue new
  await prisma.refreshToken.delete({ where: { id: record.id } })
  const newRefresh = await createRefreshToken(record.caregiverId)
  return { caregiverId: record.caregiverId, newRefreshToken: newRefresh }
}
