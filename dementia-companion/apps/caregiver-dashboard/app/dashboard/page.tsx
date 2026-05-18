'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { SafetyAlertCard } from '../../components/SafetyAlertCard'
import { SendMessageModal } from '../../components/SendMessageModal'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [showMessageModal, setShowMessageModal] = useState(false)
  const qc = useQueryClient()
  const router = useRouter()

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/api/patients').then(r => r.data.data),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  })

  useEffect(() => {
    if (patients && patients.length === 0) {
      router.push('/onboarding')
    }
  }, [patients])

  const { data: safetyEvents } = useQuery({
    queryKey: ['safety-events'],
    queryFn: () => api.get('/api/safety/events').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const unacknowledgedEvents = safetyEvents?.filter((e: any) => !e.acknowledgedAt) ?? []

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Alerts</h2>
        <button onClick={() => setShowMessageModal(true)}
          className="bg-amber-800 text-white px-5 py-2.5 rounded-lg hover:bg-amber-900 text-sm">
          Send Message to Companion
        </button>
      </div>

      {unacknowledgedEvents.length > 0 && (
        <section>
          <h3 className="text-base font-medium text-red-700 mb-3">Requires Attention</h3>
          <div className="space-y-3">
            {unacknowledgedEvents.map((event: any) => (
              <SafetyAlertCard key={event.id} event={event} onAcknowledge={() => qc.invalidateQueries({ queryKey: ['safety-events'] })} />
            ))}
          </div>
        </section>
      )}

      {unacknowledgedEvents.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          <div className="text-4xl mb-3">✓</div>
          <p className="font-medium text-gray-700">All clear — no unacknowledged alerts</p>
          <p className="text-sm mt-1">You'll be notified by SMS if anything requires your attention</p>
        </div>
      )}

      {showMessageModal && <SendMessageModal onClose={() => setShowMessageModal(false)} />}
    </div>
  )
}
