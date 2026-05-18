// server/src/services/talking-head/adapter.interface.ts

export class TalkingHeadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'TalkingHeadError'
  }
}

export interface IdleLoopResult {
  videoUrl: string
  durationSeconds: number
}

export interface PortraitValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Vendor-agnostic interface for talking head (lip-sync avatar) services.
 * Swap implementations by changing only the concrete class file.
 */
export interface LiveSessionResult {
  /** Opaque token the tablet uses to connect to the vendor's WebRTC endpoint */
  sessionToken: string
  /** Vendor-specific metadata (e.g. SDP offer, connection URL) */
  metadata: Record<string, unknown>
}

export interface TalkingHeadAdapter {
  /**
   * Validate that a portrait image is suitable for animation.
   * Returns { valid: false, reason } if the face is undetectable or unanimatable.
   */
  validatePortrait(portraitUrl: string): Promise<PortraitValidationResult>

  /**
   * Generate a short idle loop video (breathing/blinking) from a portrait.
   * Returns the URL where the video asset is stored.
   * Intended to be called once at portrait approval time.
   */
  generateIdleLoop(portraitUrl: string): Promise<IdleLoopResult>

  /**
   * Create a real-time lip-sync session for a live voice conversation.
   * The returned token is passed to the tablet, which connects to the vendor
   * WebRTC endpoint to receive a lip-synced video stream.
   */
  createLiveSession(portraitUrl: string): Promise<LiveSessionResult>
}
