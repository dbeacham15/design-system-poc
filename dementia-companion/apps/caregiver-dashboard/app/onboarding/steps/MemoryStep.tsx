'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '../../../lib/api'

interface MemoryCard {
  type: string
  label: string
  sentiment: string
  freeText: string
}

const TYPES = ['person', 'place', 'topic', 'behavior']
const SENTIMENTS = [
  { value: 'positive', label: 'Positive — bring up freely' },
  { value: 'avoid', label: 'Avoid — causes distress' },
  { value: 'handle-carefully', label: 'Handle carefully — emotionally sensitive' },
  { value: 'neutral', label: 'Neutral' },
]

export function MemoryStep({ patientId, onComplete }: { patientId: string; onComplete: () => void }) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset } = useForm<MemoryCard>({
    defaultValues: { type: 'person', sentiment: 'positive', label: '', freeText: '' }
  })

  const addCard = (data: MemoryCard) => {
    setCards(prev => [...prev, data])
    reset({ type: 'person', sentiment: 'positive', label: '', freeText: '' })
  }

  const handleContinue = async () => {
    setLoading(true)
    try {
      await Promise.all(
        cards.map(card => api.post(`/api/patients/${patientId}/memory-cards`, card))
      )
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <h2 className="text-3xl font-light text-amber-900">Memory Cards</h2>
      <p className="text-amber-700">Add memories, people, and topics that matter to your loved one. The companion uses these to guide conversations.</p>

      {/* Existing cards */}
      {cards.length > 0 && (
        <div className="space-y-2">
          {cards.map((card, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-4 py-3">
              <span className="text-xs uppercase text-amber-600 font-medium w-16">{card.type}</span>
              <span className="font-medium text-amber-900 flex-1">{card.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                card.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                card.sentiment === 'avoid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{card.sentiment}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add card form */}
      <form onSubmit={handleSubmit(addCard)} className="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
        <h3 className="font-medium text-amber-800">Add a Memory Card</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-amber-700 mb-1">Type</label>
            <select {...register('type')} className="w-full border border-amber-200 rounded-lg px-3 py-2 capitalize">
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-amber-700 mb-1">Sentiment</label>
            <select {...register('sentiment')} className="w-full border border-amber-200 rounded-lg px-3 py-2">
              {SENTIMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-amber-700 mb-1">Label</label>
          <input {...register('label', { required: true })} placeholder="e.g. Daughter Linda" className="w-full border border-amber-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-amber-700 mb-1">Notes (optional)</label>
          <textarea {...register('freeText')} rows={2} placeholder="Additional context for the companion..." className="w-full border border-amber-200 rounded-lg px-3 py-2 resize-none" />
        </div>
        <button type="submit" className="w-full border border-amber-600 text-amber-800 rounded-lg py-2 hover:bg-amber-50">
          + Add Card
        </button>
      </form>

      <button onClick={handleContinue} disabled={loading} className="w-full bg-amber-800 text-white rounded-xl py-4 text-lg font-medium hover:bg-amber-900 disabled:opacity-50">
        {loading ? 'Saving...' : cards.length === 0 ? 'Skip for now →' : `Save ${cards.length} card${cards.length > 1 ? 's' : ''} →`}
      </button>
    </div>
  )
}
