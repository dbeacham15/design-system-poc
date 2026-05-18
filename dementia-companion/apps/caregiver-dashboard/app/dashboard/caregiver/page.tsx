'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import api from '../../../lib/api'

export default function CaregiverPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [adding, setAdding] = useState(false)

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: () => api.get('/api/emergency-contacts').then(r => r.data.data),
  })

  const addContact = useMutation({
    mutationFn: (data: any) => api.post('/api/emergency-contacts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] })
      setName('')
      setPhone('')
      setIsPrimary(false)
      setAdding(false)
    },
  })

  const deleteContact = useMutation({
    mutationFn: (id: string) => api.delete(`/api/emergency-contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  })

  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => { setEmail(localStorage.getItem('caregiver_email')) }, [])

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Caregiver Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Emergency contacts and account information</p>
      </div>

      {/* Account */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
        <h3 className="font-medium text-gray-800">Account</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium">
            {email ? email[0].toUpperCase() : 'C'}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{email ?? 'Caregiver'}</div>
            <div className="text-xs text-gray-400">Signed in</div>
          </div>
        </div>
      </section>

      {/* Emergency contacts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Emergency Contacts</h3>
            <p className="text-sm text-gray-500 mt-0.5">Notified by SMS when a safety alert is triggered</p>
          </div>
          <button onClick={() => setAdding(true)} className="bg-amber-800 text-white px-4 py-2 rounded-lg hover:bg-amber-900 text-sm">
            + Add Contact
          </button>
        </div>

        {adding && (
          <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Linda Johnson"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded" />
              Primary contact — receives all alerts (others only get severe alerts)
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => addContact.mutate({ name: name.trim(), phone: phone.trim(), isPrimary })}
                disabled={!name.trim() || !phone.trim() || addContact.isPending}
                className="bg-amber-800 text-white px-4 py-2 rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm"
              >
                {addContact.isPending ? 'Saving…' : 'Save Contact'}
              </button>
              <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
            </div>
          </div>
        )}

        {isLoading && <div className="text-gray-400 text-sm">Loading…</div>}
        {!isLoading && contacts.length === 0 && !adding && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400">
            <p className="text-sm">No emergency contacts yet.</p>
            <button onClick={() => setAdding(true)} className="mt-2 text-amber-700 text-sm hover:underline">Add one</button>
          </div>
        )}

        <div className="space-y-2">
          {contacts.map((c: any) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 group">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  {c.isPrimary && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Primary</span>}
                </div>
                <div className="text-sm text-gray-500">{c.phone}</div>
              </div>
              <button
                onClick={() => deleteContact.mutate(c.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                aria-label="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
