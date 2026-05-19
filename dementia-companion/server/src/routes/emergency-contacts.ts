import { FastifyPluginAsync } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { prisma } from '@dementia/db'

export const emergencyContactRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', caregiverAuthHook)

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'phone'],
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          isPrimary: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { sub: caregiverId } = request.user as { sub: string }
    const { name, phone, isPrimary } = request.body as { name: string; phone: string; isPrimary?: boolean }
    const contact = await prisma.emergencyContact.create({
      data: { caregiverId, name, phone, isPrimary: isPrimary ?? false },
    })
    return reply.status(201).send({ data: contact })
  })

  fastify.get('/', async (request, reply) => {
    const { sub: caregiverId } = request.user as { sub: string }
    const contacts = await prisma.emergencyContact.findMany({ where: { caregiverId }, orderBy: { isPrimary: 'desc' } })
    return reply.send({ data: contacts })
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { sub: caregiverId } = request.user as { sub: string }
    const deleted = await prisma.emergencyContact.deleteMany({ where: { id, caregiverId } })
    if (deleted.count === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contact not found' } })
    }
    return reply.send({ data: { deleted: true } })
  })
}
