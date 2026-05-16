'use client'
import { useState } from 'react'
import api from '../lib/api'

export function SendMessageModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('')
  const [fromName, setFromName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [sent, setSent] = useState(false)

  const send = async () => {
    await api.post('/api/messages', { patientId, fromName, message })
    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Send a Message via Companion</h2>
        {sent ? (
          <p className="text-green-600 text-center py-8">Message sent! The companion will share it soon.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input value={fromName} onChange={e => setFromName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Linda" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
                placeholder="e.g. I'm thinking of you and love you so much." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm">Cancel</button>
              <button onClick={send} disabled={!message || !fromName}
                className="flex-1 bg-amber-800 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
                Send Message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
