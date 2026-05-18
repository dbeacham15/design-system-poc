// server/src/services/voice-session.service.ts
import OpenAI from 'openai'
import { prisma } from '@dementia/db'
import { buildSystemPrompt } from './companion-prompt.service'
import { createSimliAdapter, TalkingHeadError } from './talking-head'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function createVoiceSession(patientId: string) {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    include: { companion: true, memoryCards: true },
  })

  if (!patient.companion) throw new Error('NO_COMPANION_CONFIGURED')

  const systemPrompt = buildSystemPrompt(
    { name: patient.companion.name, personalityPreset: patient.companion.personalityPreset },
    patient,
    patient.memoryCards
  )

  // Create ephemeral session token — valid 60 seconds, used immediately by tablet
  const session = await getOpenAI().beta.realtime.sessions.create({
    model: 'gpt-4o-realtime-preview',
    voice: patient.companion.voiceId as any,
    instructions: systemPrompt,
    input_audio_transcription: { model: 'whisper-1' },
    turn_detection: { type: 'server_vad', silence_duration_ms: 800 },
  })

  // Create conversation record
  const conversation = await prisma.conversation.create({ data: { patientId } })

  // Attempt to create a Simli live session for talking head video.
  // Non-fatal: if Simli is not configured or fails, session still works audio-only.
  let simliSessionToken: string | null = null
  if (patient.companion.portraitUrl) {
    try {
      const adapter = createSimliAdapter()
      const live = await adapter.createLiveSession(patient.companion.portraitUrl)
      simliSessionToken = live.sessionToken
    } catch (err) {
      if (!(err instanceof TalkingHeadError)) throw err
      console.warn('Simli live session skipped:', (err as Error).message)
    }
  }

  return {
    sessionToken: session.client_secret.value,
    conversationId: conversation.id,
    companionName: patient.companion.name,
    sessionSilenceMs: patient.companion.sessionSilenceMs,
    simliSessionToken,
    idleLoopVideoUrl: patient.companion.idleLoopVideoUrl ?? null,
  }
}

export async function generateClosingLine(patientId: string): Promise<{ audioUrl: string }> {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    include: { companion: true },
  })
  if (!patient.companion) throw new Error('NO_COMPANION_CONFIGURED')

  const openai = getOpenAI()
  const companionName = patient.companion.name
  const patientName = patient.name

  // Generate a warm, personalized closing line via chat completion
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are ${companionName}, a warm AI companion for ${patientName} who has dementia. Write exactly one warm, gentle farewell sentence that says goodbye for now and assures them you will be here again. Include the patient's name. Keep it under 25 words. Do not add quotes.`,
      },
      { role: 'user', content: 'Generate the closing farewell.' },
    ],
    max_tokens: 60,
    temperature: 0.8,
  })

  const closingText = chat.choices[0]?.message?.content?.trim()
    ?? `It was so lovely talking with you, ${patientName}. I'll be right here when you want to chat again.`

  // Synthesize via TTS
  const ttsResponse = await openai.audio.speech.create({
    model: 'tts-1',
    voice: patient.companion.voiceId as any,
    input: closingText,
  })

  const buffer = Buffer.from(await ttsResponse.arrayBuffer())
  const audioUrl = `data:audio/mpeg;base64,${buffer.toString('base64')}`

  return { audioUrl }
}
