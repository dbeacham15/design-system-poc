// server/src/services/safety.service.ts
import twilio from 'twilio'
import { prisma } from '@dementia/db'
import type { SafetySeverity, SafetyTrigger } from '@dementia/types'

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const SAFETY_PATTERNS: Array<{ pattern: RegExp; severity: SafetySeverity; trigger: SafetyTrigger }> = [
  { pattern: /hurt myself|kill myself|don't want to live|want to die|end it all/i, severity: 'severe', trigger: 'self-harm' },
  { pattern: /fell down|can't get up|i've fallen|I fell/i, severity: 'severe', trigger: 'fall' },
  { pattern: /threats|going to hurt|going to kill/i, severity: 'severe', trigger: 'threat' },
  { pattern: /need to go home|have to leave|going to walk out|i'm leaving/i, severity: 'concerning', trigger: 'wandering' },
  { pattern: /confused|don't know where|what is this place/i, severity: 'concerning', trigger: 'dangerous-confusion' },
]

// Also parse [SAFETY_ALERT:severity:trigger] tokens emitted by LLM
const TOKEN_PATTERN = /\[SAFETY_ALERT:(\w+):(\w+)\]/

export function classifySafetyAlert(text: string): { severity: SafetySeverity; trigger: SafetyTrigger } | null {
  // Check for LLM-emitted token first
  const tokenMatch = text.match(TOKEN_PATTERN)
  if (tokenMatch) {
    return { severity: tokenMatch[1] as SafetySeverity, trigger: tokenMatch[2] as SafetyTrigger }
  }

  // Fall back to pattern matching
  for (const { pattern, severity, trigger } of SAFETY_PATTERNS) {
    if (pattern.test(text)) return { severity, trigger }
  }

  return null
}

export async function handleSafetyEvent(
  patientId: string,
  conversationId: string,
  severity: SafetySeverity,
  trigger: SafetyTrigger,
  transcript: string
) {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    include: { caregiver: true },
  })

  const event = await prisma.safetyEvent.create({
    data: { patientId, conversationId, severity, trigger, transcript },
  })

  // Get contacts based on severity
  const contacts = await prisma.emergencyContact.findMany({
    where: {
      caregiverId: patient.caregiverId,
      ...(severity === 'concerning' ? { isPrimary: true } : {}), // severe = all contacts
    },
  })

  const message = buildAlertMessage(patient.name, severity, trigger)

  await Promise.all(
    contacts.map(async (contact) => {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER!,
        to: contact.phone,
      })
      await prisma.safetyNotification.create({
        data: { safetyEventId: event.id, channel: 'sms', recipient: contact.phone },
      })
    })
  )

  // Schedule reminder if unacknowledged
  const reminderDelay = severity === 'severe' ? 5 * 60 * 1000 : 30 * 60 * 1000
  setTimeout(() => sendReminderIfUnacknowledged(event.id, contacts, message), reminderDelay)

  return event
}

function buildAlertMessage(patientName: string, severity: SafetySeverity, trigger: SafetyTrigger): string {
  const urgency = severity === 'severe' ? 'URGENT' : 'Alert'
  const triggerLabels: Record<SafetyTrigger, string> = {
    'self-harm': 'expressed thoughts of self-harm',
    'fall': 'may have fallen',
    'threat': 'expressed a threat',
    'wandering': 'expressed intent to wander',
    'dangerous-confusion': 'is showing signs of dangerous confusion',
    'emergency': 'is in an emergency situation',
  }
  return `${urgency}: ${patientName} ${triggerLabels[trigger]}. Please check on them immediately. Log in to the caregiver dashboard to acknowledge this alert.`
}

async function sendReminderIfUnacknowledged(eventId: string, contacts: any[], message: string) {
  const event = await prisma.safetyEvent.findUnique({ where: { id: eventId } })
  if (event?.acknowledgedAt) return // Already acknowledged

  await Promise.all(
    contacts.map(async (contact) => {
      await twilioClient.messages.create({
        body: `REMINDER: ${message}`,
        from: process.env.TWILIO_FROM_NUMBER!,
        to: contact.phone,
      })
      await prisma.safetyNotification.updateMany({
        where: { safetyEventId: eventId, recipient: contact.phone },
        data: { reminderSentAt: new Date() },
      })
    })
  )
}
