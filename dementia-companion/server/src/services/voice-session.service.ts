// server/src/services/voice-session.service.ts
import OpenAI from 'openai'
import { prisma } from '@dementia/db'
import { buildSystemPrompt } from './companion-prompt.service'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function createVoiceSession(patientId: string) {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    include: { companion: true, memoryCards: true },
  })

  if (!patient.companion) throw new Error('NO_COMPANION_CONFIGURED')

  const systemPrompt = buildSystemPrompt(patient.companion, patient, patient.memoryCards)

  // Create ephemeral session token — valid 60 seconds, used immediately by tablet
  const session = await openai.beta.realtime.sessions.create({
    model: 'gpt-4o-realtime-preview',
    voice: patient.companion.voiceId as any,
    instructions: systemPrompt,
    input_audio_transcription: { model: 'whisper-1' },
    turn_detection: { type: 'server_vad', silence_duration_ms: 800 },
  })

  // Create conversation record
  const conversation = await prisma.conversation.create({ data: { patientId } })

  return {
    sessionToken: session.client_secret.value,
    conversationId: conversation.id,
    companionName: patient.companion.name,
  }
}
