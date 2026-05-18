// server/src/routes/companion.ts
import { FastifyPluginAsync, FastifyReply } from 'fastify'
import { caregiverAuthHook } from '../middleware/caregiver-auth'
import { prisma } from '@dementia/db'
import { PersonalityPreset } from '@prisma/client'
import OpenAI from 'openai'
import { createSimliAdapter, TalkingHeadError } from '../services/talking-head'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

const VALID_PRESETS = Object.values(PersonalityPreset)

const PORTRAIT_GUARDRAILS = `
Pixar-adjacent warm illustration style. Clear, detailed facial features suitable for real-time talking head animation.
Portrait framing: head and shoulders only, centered. Soft warm color palette with gentle lighting.
The subject should appear friendly, approachable, and suitable as a care companion for elderly patients.
No text, no watermarks, no logos. Transparent or soft neutral background.
`

async function assertPatientOwnership(patientId: string, caregiverId: string, reply: FastifyReply) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, caregiverId } })
  if (!patient) {
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Patient not found' } })
    return false
  }
  return true
}

async function getCompanionWithOwnership(patientId: string, caregiverId: string, reply: FastifyReply) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, caregiverId },
    include: { companion: true },
  })
  if (!patient) {
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Patient not found' } })
    return null
  }
  if (!patient.companion) {
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Companion not configured' } })
    return null
  }
  return patient.companion
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export const companionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', caregiverAuthHook)

  // Create or update companion (Step 1: preset + name + voice)
  fastify.post('/patients/:patientId/companion', async (request, reply) => {
    const { patientId } = request.params as { patientId: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return

    const { name, voiceId, personalityPreset } = request.body as any

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'name is required' } })
    }
    if (!VALID_PRESETS.includes(personalityPreset)) {
      return reply.status(400).send({
        error: { code: 'INVALID_PRESET', message: `personalityPreset must be one of: ${VALID_PRESETS.join(', ')}` },
      })
    }

    const companion = await prisma.companion.upsert({
      where: { patientId },
      create: { patientId, name: name.trim(), voiceId, personalityPreset },
      update: { name: name.trim(), voiceId, personalityPreset },
    })
    return reply.send({ data: companion })
  })

  fastify.get('/patients/:patientId/companion', async (request, reply) => {
    const { patientId } = request.params as { patientId: string }
    const { sub: caregiverId } = request.user as { sub: string }
    if (!await assertPatientOwnership(patientId, caregiverId, reply)) return
    const companion = await prisma.companion.findUnique({ where: { patientId } })
    if (!companion) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Companion not configured' } })
    return reply.send({ data: companion })
  })

  // Step 2: Generate portrait options via DALL-E 3
  fastify.post('/patients/:patientId/companion/portrait/generate', async (request, reply) => {
    const { patientId } = request.params as { patientId: string }
    const { sub: caregiverId } = request.user as { sub: string }
    const companion = await getCompanionWithOwnership(patientId, caregiverId, reply)
    if (!companion) return

    const { description } = request.body as any
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'description is required' } })
    }

    const safeDescription = description.trim().slice(0, 300)
    const prompt = `${PORTRAIT_GUARDRAILS.trim()}\n\nCaregiver description: ${safeDescription}`

    const openai = getOpenAI()
    const results = await Promise.allSettled([
      openai.images.generate({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' }),
      openai.images.generate({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' }),
      openai.images.generate({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' }),
    ])

    const options = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value.data[0]?.url)
      .filter(Boolean)

    if (options.length < 3) {
      return reply.status(502).send({
        error: { code: 'GENERATION_FAILED', message: `DALL-E returned only ${options.length} of 3 images` },
      })
    }

    return reply.send({ data: { options } })
  })

  // Step 3: Approve portrait — validate, store, trigger idle loop + intro audio
  fastify.post('/patients/:patientId/companion/portrait/approve', async (request, reply) => {
    const { patientId } = request.params as { patientId: string }
    const { sub: caregiverId } = request.user as { sub: string }
    const companion = await getCompanionWithOwnership(patientId, caregiverId, reply)
    if (!companion) return

    if (companion.portraitUrl) {
      return reply.status(409).send({ error: { code: 'PORTRAIT_LOCKED', message: 'Portrait is already approved and cannot be changed' } })
    }

    const { portraitUrl } = request.body as any
    if (!portraitUrl || typeof portraitUrl !== 'string') {
      return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'portraitUrl is required' } })
    }

    // Validate the portrait is animatable via talking head adapter.
    // Skip validation in dev when SIMLI_API_KEY is absent — idle loop and live sessions
    // will also be skipped below, so the companion runs audio-only until a key is configured.
    if (process.env.SIMLI_API_KEY) {
      try {
        const adapter = createSimliAdapter()
        const validation = await adapter.validatePortrait(portraitUrl)
        if (!validation.valid) {
          return reply.status(400).send({
            error: { code: 'PORTRAIT_UNANIMATABLE', message: validation.reason ?? 'Portrait face is not detectable or animatable' },
          })
        }
      } catch (err) {
        if (err instanceof TalkingHeadError) {
          return reply.status(502).send({ error: { code: 'ADAPTER_ERROR', message: err.message } })
        }
        throw err
      }
    }

    // Store portrait URL
    await prisma.companion.update({ where: { id: companion.id }, data: { portraitUrl } })

    // Fire-and-forget: generate idle loop video and intro audio in background
    generateAvatarAssets(companion.id, companion.name, companion.voiceId, portraitUrl)
      .catch(err => console.error('Avatar asset generation failed:', err))

    const updated = await prisma.companion.findUniqueOrThrow({ where: { id: companion.id } })
    return reply.send({ data: updated })
  })

  // One-time introduction: sends push notification to paired tablet, unlocks avatar
  fastify.post('/companions/:companionId/introduce', async (request, reply) => {
    const { companionId } = request.params as { companionId: string }
    const { sub: caregiverId } = request.user as { sub: string }

    const companion = await prisma.companion.findFirst({
      where: { id: companionId, patient: { caregiverId } },
      include: { patient: { include: { deviceTokens: true } } },
    })
    if (!companion) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Companion not found' } })
    }
    if (companion.avatarUnlocked) {
      return reply.status(409).send({ error: { code: 'ALREADY_INTRODUCED', message: 'Companion has already been introduced' } })
    }

    const deviceToken = companion.patient.deviceTokens.find(dt => dt.expoPushToken && !dt.revokedAt)
    if (!deviceToken?.expoPushToken) {
      return reply.status(400).send({ error: { code: 'NO_PUSH_TOKEN', message: 'Tablet has not registered a push token' } })
    }

    // Send push notification to the paired tablet
    const pushRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: deviceToken.expoPushToken,
        title: `Meet ${companion.name}`,
        body: `Your companion ${companion.name} is ready to say hello.`,
        data: {
          type: 'COMPANION_INTRO',
          companionId: companion.id,
          companionName: companion.name,
          introAudioUrl: companion.introAudioUrl ?? null,
        },
        sound: 'default',
      }),
    })

    if (!pushRes.ok) {
      const body = await pushRes.text().catch(() => '')
      return reply.status(502).send({ error: { code: 'PUSH_FAILED', message: `Push delivery failed: ${body}` } })
    }

    // Mark avatar as unlocked — push delivery to Expo servers is the acknowledgement
    await prisma.companion.update({ where: { id: companion.id }, data: { avatarUnlocked: true } })

    return reply.send({ data: { introduced: true, companionName: companion.name } })
  })
}

// ── Background asset generation (called fire-and-forget from portrait approve) ──

async function generateAvatarAssets(
  companionId: string,
  companionName: string,
  voiceId: string,
  portraitUrl: string,
) {
  const openai = getOpenAI()

  // Generate idle loop video via Simli (skipped in dev when SIMLI_API_KEY is absent)
  if (process.env.SIMLI_API_KEY) {
    try {
      const adapter = createSimliAdapter()
      const { videoUrl } = await adapter.generateIdleLoop(portraitUrl)
      await prisma.companion.update({ where: { id: companionId }, data: { idleLoopVideoUrl: videoUrl } })
    } catch (err) {
      console.error('Idle loop generation failed:', err)
    }
  }

  // Generate introduction audio via OpenAI TTS — warm first-meeting script
  // The patient name is fetched fresh here from the DB relation
  try {
    const companion = await prisma.companion.findUnique({
      where: { id: companionId },
      include: { patient: true },
    })
    if (!companion) return

    const introText = `Hello ${companion.patient.name}, I'm ${companionName}. I'm so glad to meet you. I'll be right here whenever you'd like to talk.`
    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voiceId as any,
      input: introText,
    })

    // OpenAI TTS returns a binary buffer; in production this would be uploaded to object storage.
    // For now we store a data URL (base64) — replace with S3/GCS upload before going to production.
    const buffer = Buffer.from(await ttsResponse.arrayBuffer())
    const introAudioUrl = `data:audio/mpeg;base64,${buffer.toString('base64')}`
    await prisma.companion.update({ where: { id: companionId }, data: { introAudioUrl } })
  } catch (err) {
    console.error('Intro audio generation failed:', err)
  }
}
