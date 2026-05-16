// packages/types/src/index.ts

export type CompanionPersonality = 'warm' | 'gentle' | 'cheerful' | 'calm'
export type EngagementLevel = 'low' | 'medium' | 'high'
export type GenderPresentation = 'feminine' | 'masculine' | 'neutral'
export type SpeakingStyle = 'simple' | 'conversational' | 'nurturing'

export type MemoryCardType = 'person' | 'place' | 'topic' | 'behavior'
export type MemoryCardSentiment = 'positive' | 'avoid' | 'handle-carefully' | 'neutral'

export type SafetySeverity = 'concerning' | 'severe'
export type SafetyTrigger =
  | 'self-harm'
  | 'wandering'
  | 'fall'
  | 'threat'
  | 'dangerous-confusion'
  | 'emergency'

export interface CompanionConfig {
  name: string
  voiceId: string
  personalityStyle: CompanionPersonality
  engagementLevel: EngagementLevel
  genderPresentation: GenderPresentation
  speakingStyle: SpeakingStyle
}

export interface MemoryCardData {
  type: MemoryCardType
  label: string
  sentiment: MemoryCardSentiment
  structuredData?: Record<string, string>
  freeText?: string
}

export interface SafetyEventPayload {
  patientId: string
  conversationId?: string
  severity: SafetySeverity
  trigger: SafetyTrigger
  transcript: string
}

export interface CaregiverMessagePayload {
  patientId: string
  fromName: string
  message: string
}

// API response shapes
export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: { code: string; message: string }
}

export type ApiResult<T> = ApiResponse<T> | ApiError
