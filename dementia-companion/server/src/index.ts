import 'dotenv/config'
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { patientRoutes } from './routes/patients'
import { companionRoutes } from './routes/companion'
import { deviceRoutes } from './routes/devices'
import { voiceSessionRoutes } from './routes/voice-session'
import { safetyRoutes } from './routes/safety'
import { caregiverMessageRoutes } from './routes/caregiver-messages'
import { emergencyContactRoutes } from './routes/emergency-contacts'

export async function build(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const server = Fastify({ logger: opts.logger ?? true })

  await server.register(helmet)
  await server.register(cors, {
    origin: process.env.CAREGIVER_DASHBOARD_URL ?? 'http://localhost:3000',
    credentials: true,
  })
  await server.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    sign: { expiresIn: '15m' },
  })

  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(patientRoutes, { prefix: '/api/patients' })
  await server.register(companionRoutes, { prefix: '/api' })
  await server.register(deviceRoutes, { prefix: '/api/devices' })
  await server.register(voiceSessionRoutes, { prefix: '/api/voice' })
  await server.register(safetyRoutes, { prefix: '/api/safety' })
  await server.register(caregiverMessageRoutes, { prefix: '/api/messages' })
  await server.register(emergencyContactRoutes, { prefix: '/api/emergency-contacts' })

  server.get('/health', async () => ({ status: 'ok' }))

  return server
}

// Only listen when run directly (not during tests)
if (require.main === module) {
  const { startScheduler } = require('./services/scheduler.service')
  const { startSafetyReminderJob } = require('./services/safety.service')
  build().then(async server => {
    server.listen({ port: 3001, host: '0.0.0.0' })
    await startScheduler()
    startSafetyReminderJob()
  })
}
