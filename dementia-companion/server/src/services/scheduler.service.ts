// server/src/services/scheduler.service.ts
import cron from 'node-cron'
import { prisma } from '@dementia/db'

export function startScheduler() {
  // Every minute: check for due check-ins
  cron.schedule('* * * * *', async () => {
    const now = new Date()
    const checkIns = await prisma.scheduledCheckIn.findMany({
      where: { enabled: true },
      include: { patient: true },
    })

    for (const checkIn of checkIns) {
      if (isDue(checkIn.cronExpr, now)) {
        // Create a caregiver message so the tablet picks it up on next poll
        await prisma.caregiverMessage.create({
          data: {
            patientId: checkIn.patientId,
            fromName: 'Scheduled',
            message: checkIn.message ?? checkIn.label,
          },
        })
      }
    }
  })
}

function isDue(cronExpr: string, now: Date): boolean {
  return cron.validate(cronExpr) && matchesCron(cronExpr, now)
}

function matchesCron(expr: string, date: Date): boolean {
  const [minute, hour] = expr.split(' ')
  return (
    (minute === '*' || parseInt(minute) === date.getMinutes()) &&
    (hour === '*' || parseInt(hour) === date.getHours())
  )
}
