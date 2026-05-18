'use client'
import { useState } from 'react'
import api from '../../../lib/api'

interface Contact {
  name: string
  phone: string
  isPrimary: boolean
}

export function SafetyStep({ onComplete }: { onComplete: () => void }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [loading, setLoading] = useState(false)

  const addContact = () => {
    if (!name.trim() || !phone.trim()) return
    setContacts(prev => [...prev, { name: name.trim(), phone: phone.trim(), isPrimary }])
    setName('')
    setPhone('')
    setIsPrimary(false)
  }

  const handleContinue = async () => {
    setLoading(true)
    try {
      await Promise.all(
        contacts.map(c => api.post('/api/emergency-contacts', c))
      )
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <h2 className="text-3xl font-light text-amber-900">Emergency Contacts</h2>
      <p className="text-amber-700">Who should be notified by SMS if a safety alert is triggered during a companion session?</p>

      {contacts.length > 0 && (
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-4 py-3">
              <span className="font-medium text-amber-900 flex-1">{c.name}</span>
              <span className="text-amber-700">{c.phone}</span>
              {c.isPrimary && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Primary</span>}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
        <h3 className="font-medium text-amber-800">Add a Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-amber-700 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Linda Johnson" className="w-full border border-amber-200 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-amber-700 mb-1">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full border border-amber-200 rounded-lg px-3 py-2" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded" />
          <span className="text-sm text-amber-700">Primary contact (gets all alerts, others only get severe alerts)</span>
        </label>
        <button onClick={addContact} disabled={!name || !phone} className="w-full border border-amber-600 text-amber-800 rounded-lg py-2 hover:bg-amber-50 disabled:opacity-50">
          + Add Contact
        </button>
      </div>

      <button onClick={handleContinue} disabled={loading} className="w-full bg-amber-800 text-white rounded-xl py-4 text-lg font-medium hover:bg-amber-900 disabled:opacity-50">
        {loading ? 'Saving...' : contacts.length === 0 ? 'Skip for now →' : `Save & Complete Setup →`}
      </button>
    </div>
  )
}
