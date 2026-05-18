'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../../lib/api'
import { CompanionAvatar } from '../../../components/CompanionAvatar'

const VOICES = [
  { id: 'alloy', label: 'Alloy', description: 'Calm and neutral' },
  { id: 'nova', label: 'Nova', description: 'Warm and friendly' },
  { id: 'shimmer', label: 'Shimmer', description: 'Gentle and soft' },
]

const PRESET_LABELS: Record<string, string> = {
  WARM_NURTURER: 'Warm Nurturer',
  CHEERFUL_FRIEND: 'Cheerful Friend',
  CALM_PRESENCE: 'Calm Presence',
  WISE_COMPANION: 'Wise Companion',
}

export default function PatientPage() {
  const qc = useQueryClient()
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/api/patients').then(r => r.data.data),
  })
  const patient = patients?.[0]

  const { data: companion, refetch: refetchCompanion } = useQuery({
    queryKey: ['companion', patient?.id],
    queryFn: () => api.get(`/api/patients/${patient.id}/companion`).then(r => r.data.data),
    enabled: !!patient?.id,
  })

  const { data: conversations } = useQuery({
    queryKey: ['conversations', patient?.id],
    queryFn: () => api.get(`/api/patients/${patient.id}/conversations`).then(r => r.data.data),
    enabled: !!patient?.id && companion?.avatarUnlocked === true,
    refetchInterval: 60_000,
  })

  const [nameEdit, setNameEdit] = useState<string | null>(null)
  const [voiceEdit, setVoiceEdit] = useState<string | null>(null)

  const saveCompanion = useMutation({
    mutationFn: (data: any) => api.post(`/api/patients/${patient.id}/companion`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companion', patient?.id] })
      setNameEdit(null)
      setVoiceEdit(null)
    },
  })

  const generatePairingCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await api.post(`/api/patients/${patient.id}/pairing-code`)
      setPairingCode(res.data.data.code)
    } finally {
      setGeneratingCode(false)
    }
  }

  if (isLoading) return <div className="text-gray-500">Loading...</div>
  if (!patient) return <div className="text-gray-500">No patient found. Complete onboarding first.</div>

  const companionName = nameEdit ?? companion?.name ?? ''
  const companionVoiceId = voiceEdit ?? companion?.voiceId ?? 'nova'
  const isDirty = nameEdit !== null || voiceEdit !== null

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Patient Profile</h2>
        <p className="text-gray-500 text-sm mt-1">Patient and companion settings</p>
      </div>

      {/* Patient + Companion avatar side by side */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl font-light text-amber-800">
              {patient.name[0].toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-medium text-gray-900">{patient.name}</div>
              <div className="text-sm text-gray-500">ID: {patient.id.slice(0, 8)}…</div>
            </div>
          </div>

          {companion && (
            <CompanionAvatar
              companion={companion}
              patientName={patient.name}
              onUnlocked={() => refetchCompanion()}
            />
          )}
        </div>
      </section>

      {/* Conversation history — only shown after avatar is unlocked */}
      {companion?.avatarUnlocked && (
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-gray-800">Conversation History</h3>
          {!conversations || conversations.length === 0 ? (
            <p className="text-sm text-gray-500">No conversations yet. The first session will appear here.</p>
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 10).map((conv: any) => (
                <div key={conv.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">
                    {new Date(conv.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' '}at {new Date(conv.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {conv.moodScore && (
                    <span className="text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 text-xs">
                      Mood: {conv.moodScore}/5
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Device pairing */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="font-medium text-gray-800">Device Pairing</h3>
        <p className="text-sm text-gray-500">Generate a code to pair the companion tablet with this patient profile.</p>
        {pairingCode ? (
          <div className="flex items-center gap-4">
            <div className="text-4xl font-mono font-bold tracking-widest text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-6 py-3">
              {pairingCode}
            </div>
            <button onClick={() => setPairingCode(null)} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
          </div>
        ) : (
          <button
            onClick={generatePairingCode}
            disabled={generatingCode}
            className="bg-amber-800 text-white px-5 py-2.5 rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm"
          >
            {generatingCode ? 'Generating…' : 'Generate Pairing Code'}
          </button>
        )}
      </section>

      {/* Companion settings — editable fields (not preset, which is set at onboarding) */}
      {companion && (
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h3 className="font-medium text-gray-800">Companion Settings</h3>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Style</span>
            <span className="text-sm font-medium text-gray-800">
              {PRESET_LABELS[companion.personalityPreset] ?? companion.personalityPreset}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Companion Name</label>
            <input
              value={companionName}
              onChange={e => setNameEdit(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
            <div className="grid grid-cols-3 gap-2">
              {VOICES.map(v => (
                <label key={v.id} className={`border rounded-lg p-3 cursor-pointer text-sm transition-colors
                  ${companionVoiceId === v.id ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" className="sr-only" checked={companionVoiceId === v.id}
                    onChange={() => setVoiceEdit(v.id)} />
                  <div className="font-medium text-gray-800">{v.label}</div>
                  <div className="text-xs text-gray-500">{v.description}</div>
                </label>
              ))}
            </div>
          </div>

          {isDirty && (
            <button
              onClick={() => saveCompanion.mutate({
                name: companionName,
                voiceId: companionVoiceId,
                personalityPreset: companion.personalityPreset,
              })}
              disabled={saveCompanion.isPending}
              className="bg-amber-800 text-white px-5 py-2.5 rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm"
            >
              {saveCompanion.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          )}
          {saveCompanion.isSuccess && !isDirty && (
            <span className="text-sm text-green-600">Saved</span>
          )}
        </section>
      )}
    </div>
  )
}
