'use client'
import { useState } from 'react'
import api from '../../../lib/api'

export function PatientStep({ onComplete }: { onComplete: (id: string) => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/patients', { name: name.trim() })
      onComplete(res.data.data.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
      <h2 className="text-3xl font-light text-amber-900">Who are you setting this up for?</h2>
      <p className="text-amber-700">Enter the first name of the person who will use the companion.</p>
      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">Patient's First Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-amber-300 rounded-xl px-4 py-3 text-xl focus:ring-2 focus:ring-amber-500"
          placeholder="e.g. Margaret"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-amber-800 text-white rounded-xl py-4 text-lg font-medium hover:bg-amber-900 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Continue →'}
      </button>
    </form>
  )
}
