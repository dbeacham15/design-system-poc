'use client'
import api from '../lib/api'
import { useState } from 'react'

export function SafetyAlertCard({ event, onAcknowledge }: { event: any; onAcknowledge: () => void }) {
  const [loading, setLoading] = useState(false)

  const acknowledge = async () => {
    setLoading(true)
    await api.post(`/api/safety/events/${event.id}/acknowledge`)
    onAcknowledge()
    setLoading(false)
  }

  const borderColor = event.severity === 'severe' ? 'border-red-500' : 'border-yellow-400'
  const bgColor = event.severity === 'severe' ? 'bg-red-50' : 'bg-yellow-50'

  return (
    <div className={`border-l-4 ${borderColor} ${bgColor} rounded-lg p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wide ${event.severity === 'severe' ? 'text-red-700' : 'text-yellow-700'}`}>
              {event.severity}
            </span>
            <span className="text-xs text-gray-500">{new Date(event.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm font-medium text-gray-900">{event.trigger.replace(/-/g, ' ')}</p>
          <p className="text-sm text-gray-600 mt-1 italic">"{event.transcript}"</p>
        </div>
        <button onClick={acknowledge} disabled={loading}
          className="ml-4 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
          {loading ? 'Acknowledging...' : 'Acknowledge'}
        </button>
      </div>
    </div>
  )
}
