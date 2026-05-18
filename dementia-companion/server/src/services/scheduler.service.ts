// server/src/services/scheduler.service.ts
import cron from 'node-cron'
import { prisma } from '@dementia/db'

export async function startScheduler() {
  const checkIns = await prisma.scheduledCheckIn.findMany({
    where: { enabled: true },
  })

  for (const checkIn of checkIns) {
    if (!cron.validate(checkIn.cronExpr)) continue
    cron.schedule(checkIn.cronExpr, async () => {
      await prisma.caregiverMessage.create({
        data: {
          patientId: checkIn.patientId,
          fromName: 'Scheduled',
          message: checkIn.message ?? checkIn.label,
        },
      })
    })
  }
}
