'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../../lib/api'

const TYPES = ['person', 'place', 'topic', 'behavior']
const SENTIMENTS = [
  { value: 'positive', label: 'Positive' },
  { value: 'avoid', label: 'Avoid' },
  { value: 'handle-carefully', label: 'Handle carefully' },
  { value: 'neutral', label: 'Neutral' },
]

const sentimentStyle = (s: string) =>
  s === 'positive' ? 'bg-green-100 text-green-700' :
  s === 'avoid' ? 'bg-red-100 text-red-700' :
  s === 'handle-carefully' ? 'bg-yellow-100 text-yellow-700' :
  'bg-gray-100 text-gray-600'

export default function MemoriesPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ type: 'person', sentiment: 'positive', label: '', freeText: '' })
  const [adding, setAdding] = useState(false)

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/api/patients').then(r => r.data.data),
  })
  const patient = patients?.[0]

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['memory-cards', patient?.id],
    queryFn: () => api.get(`/api/patients/${patient.id}/memory-cards`).then(r => r.data.data),
    enabled: !!patient?.id,
  })

  const addCard = useMutation({
    mutationFn: (data: any) => api.post(`/api/patients/${patient.id}/memory-cards`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memory-cards', patient?.id] })
      setForm({ type: 'person', sentiment: 'positive', label: '', freeText: '' })
      setAdding(false)
    },
  })

  const deleteCard = useMutation({
    mutationFn: (cardId: string) => api.delete(`/api/patients/${patient.id}/memory-cards/${cardId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memory-cards', patient?.id] }),
  })

  if (!patient && !isLoading) return <div className="text-gray-500">No patient found. Complete onboarding first.</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Memory Cards</h2>
          <p className="text-gray-500 text-sm mt-1">People, places, and topics the companion references in conversation</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="bg-amber-800 text-white px-4 py-2 rounded-lg hover:bg-amber-900 text-sm"
        >
          + Add Card
        </button>
      </div>

      {/* Add card form */}
      {adding && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-amber-800">New Memory Card</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 capitalize text-sm">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sentiment</label>
              <select value={form.sentiment} onChange={e => setForm(f => ({ ...f, sentiment: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {SENTIMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Label</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Daughter Linda"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
            <textarea value={form.freeText} onChange={e => setForm(f => ({ ...f, freeText: e.target.value }))}
              rows={2} placeholder="Additional context for the companion..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => addCard.mutate(form)}
              disabled={!form.label.trim() || addCard.isPending}
              className="bg-amber-800 text-white px-4 py-2 rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm"
            >
              {addCard.isPending ? 'Saving…' : 'Save Card'}
            </button>
            <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cards list */}
      {isLoading && <div className="text-gray-400 text-sm">Loading…</div>}
      {!isLoading && cards.length === 0 && !adding && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          <p>No memory cards yet.</p>
          <button onClick={() => setAdding(true)} className="mt-2 text-amber-700 text-sm hover:underline">Add the first one</button>
        </div>
      )}

      <div className="space-y-2">
        {cards.map((card: any) => (
          <div key={card.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3 group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-medium text-gray-400 w-14">{card.type}</span>
                <span className="font-medium text-gray-900">{card.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentStyle(card.sentiment)}`}>
                  {card.sentiment}
                </span>
              </div>
              {card.freeText && <p className="text-sm text-gray-500 mt-1 ml-16">{card.freeText}</p>}
            </div>
            <button
              onClick={() => deleteCard.mutate(card.id)}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none mt-0.5"
              aria-label="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
