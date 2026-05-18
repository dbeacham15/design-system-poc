// server/src/services/safety.service.ts
import cron from 'node-cron'
import twilio from 'twilio'
import { prisma } from '@dementia/db'
import type { SafetySeverity, SafetyTrigger } from '@dementia/types'

async function sendSms(to: string, body: string) {
  if (process.env.MOCK_SMS === 'true') {
    console.log(`[MOCK SMS] → ${to}: ${body}`)
    return
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  await client.messages.create({ body, from: process.env.TWILIO_FROM_NUMBER!, to })
}

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
      await sendSms(contact.phone, message)
      await prisma.safetyNotification.create({
        data: { safetyEventId: event.id, channel: 'sms', recipient: contact.phone },
      })
    })
  )

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

export function startSafetyReminderJob() {
  cron.schedule('* * * * *', async () => {
    const now = new Date()
    const cutoffs = {
      severe: new Date(now.getTime() - 5 * 60 * 1000),
      concerning: new Date(now.getTime() - 30 * 60 * 1000),
    }

    const overdueEvents = await prisma.safetyEvent.findMany({
      where: {
        acknowledgedAt: null,
        OR: [
          { severity: 'severe', createdAt: { lte: cutoffs.severe }, notifications: { none: { reminderSentAt: { not: null } } } },
          { severity: 'concerning', createdAt: { lte: cutoffs.concerning }, notifications: { none: { reminderSentAt: { not: null } } } },
        ],
      },
      include: { patient: { include: { caregiver: true } } },
    })

    for (const event of overdueEvents) {
      const contacts = await prisma.emergencyContact.findMany({
        where: { caregiverId: event.patient.caregiverId },
      })
      const message = buildAlertMessage(event.patient.name, event.severity as any, event.trigger as any)
      for (const contact of contacts) {
        await sendSms(contact.phone, `REMINDER: ${message}`)
        await prisma.safetyNotification.updateMany({
          where: { safetyEventId: event.id, recipient: contact.phone },
          data: { reminderSentAt: new Date() },
        })
      }
    }
  })
}
