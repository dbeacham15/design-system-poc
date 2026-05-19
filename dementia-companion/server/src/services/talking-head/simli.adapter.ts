// server/src/services/talking-head/simli.adapter.ts
import {
  TalkingHeadAdapter,
  TalkingHeadError,
  IdleLoopResult,
  LiveSessionResult,
  PortraitValidationResult,
} from './adapter.interface'

const SIMLI_API_BASE = 'https://api.simli.ai'

// Short breathing/blinking reference audio (silent 8s clip) used for idle loop generation.
// Simli requires an audio input even for idle video — we send silence.
const SILENT_8S_AUDIO_URL = 'https://api.simli.ai/samples/silence-8s.wav'

export class SimliAdapter implements TalkingHeadAdapter {
  private readonly apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('SIMLI_API_KEY is required')
    this.apiKey = apiKey
  }

  async validatePortrait(portraitUrl: string): Promise<PortraitValidationResult> {
    let response: Response
    try {
      response = await fetch(`${SIMLI_API_BASE}/validateFace`, {
        method: 'POST',
        headers: { 'x-simli-api-key': this.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceImageUrl: portraitUrl }),
      })
    } catch (err) {
      throw new TalkingHeadError('Failed to reach Simli validation endpoint', err)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new TalkingHeadError(`Simli validateFace returned ${response.status}: ${body}`)
    }

    const data = await response.json().catch(() => ({})) as Record<string, unknown>
    const valid = data['valid'] === true || data['status'] === 'ok'
    return { valid, reason: valid ? undefined : ((data['reason'] as string | undefined) ?? 'Face not detected or not animatable') }
  }

  async createLiveSession(portraitUrl: string): Promise<LiveSessionResult> {
    let response: Response
    try {
      response = await fetch(`${SIMLI_API_BASE}/startFaceSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: this.apiKey, faceImageUrl: portraitUrl, handleSilence: true }),
      })
    } catch (err) {
      throw new TalkingHeadError('Failed to reach Simli startFaceSession endpoint', err)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new TalkingHeadError(`Simli startFaceSession returned ${response.status}: ${body}`)
    }

    const data = await response.json().catch(() => null) as Record<string, unknown> | null
    if (!data?.['session_token']) {
      throw new TalkingHeadError('Simli startFaceSession response missing session_token')
    }

    return {
      sessionToken: data['session_token'] as string,
      metadata: { sessionId: (data['session_id'] as string | null) ?? null },
    }
  }

  async generateIdleLoop(portraitUrl: string): Promise<IdleLoopResult> {
    let response: Response
    try {
      response = await fetch(`${SIMLI_API_BASE}/generateIdleVideo`, {
        method: 'POST',
        headers: { 'x-simli-api-key': this.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceImageUrl: portraitUrl,
          audioUrl: SILENT_8S_AUDIO_URL,
          durationSeconds: 8,
          loop: true,
        }),
      })
    } catch (err) {
      throw new TalkingHeadError('Failed to reach Simli idle loop endpoint', err)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new TalkingHeadError(`Simli generateIdleVideo returned ${response.status}: ${body}`)
    }

    const data = await response.json().catch(() => null) as Record<string, unknown> | null
    if (!data?.['videoUrl']) {
      throw new TalkingHeadError('Simli response missing videoUrl')
    }

    return { videoUrl: data['videoUrl'] as string, durationSeconds: (data['durationSeconds'] as number | undefined) ?? 8 }
  }
}

export function createSimliAdapter(): SimliAdapter {
  const apiKey = process.env.SIMLI_API_KEY
  if (!apiKey) throw new TalkingHeadError('SIMLI_API_KEY environment variable is not set')
  return new SimliAdapter(apiKey)
}
