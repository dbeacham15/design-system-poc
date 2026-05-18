'use client'
import { useState } from 'react'
import api from '../../../lib/api'

const PRESETS = [
  {
    value: 'WARM_NURTURER',
    name: 'Warm Nurturer',
    description: 'Leads with empathy and emotional attunement. Holds space for sadness and confusion without rushing to resolve it.',
    suggestedName: 'Grace',
  },
  {
    value: 'CHEERFUL_FRIEND',
    name: 'Cheerful Friend',
    description: 'Brings lightness and gentle joy. Finds reasons to celebrate small things and keeps energy warmly upbeat.',
    suggestedName: 'Sunny',
  },
  {
    value: 'CALM_PRESENCE',
    name: 'Calm Presence',
    description: 'Steady, unhurried, and deeply patient. When the patient is anxious, this companion\'s calmness is the intervention.',
    suggestedName: 'Lily',
  },
  {
    value: 'WISE_COMPANION',
    name: 'Wise Companion',
    description: 'Honors the patient\'s life experience and dignity. Invites reminiscence and treats memories as treasures.',
    suggestedName: 'Eleanor',
  },
]

const VOICES = [
  { id: 'alloy', label: 'Alloy', description: 'Calm and neutral' },
  { id: 'nova', label: 'Nova', description: 'Warm and friendly' },
  { id: 'shimmer', label: 'Shimmer', description: 'Gentle and soft' },
]

const STORAGE_KEY = 'onboarding_companion_step'

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function CompanionStep({ patientId, onComplete }: { patientId: string; onComplete: () => void }) {
  const saved = loadSaved()
  const [selectedPreset, setSelectedPreset] = useState<string>(saved?.preset ?? '')
  const [companionName, setCompanionName] = useState<string>(saved?.name ?? '')
  const [voiceId, setVoiceId] = useState<string>(saved?.voiceId ?? 'nova')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function persist(patch: object) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        preset: selectedPreset, name: companionName, voiceId, ...patch
      }))
    } catch {}
  }

  const canProceed = selectedPreset !== '' && companionName.trim().length > 0

  const handlePresetSelect = (value: string) => {
    const preset = PRESETS.find(p => p.value === value)!
    setSelectedPreset(value)
    if (!companionName.trim()) setCompanionName(preset.suggestedName)
    persist({ preset: value })
  }

  const handleSubmit = async () => {
    if (!canProceed) return
    setSubmitting(true)
    setError(null)
    try {
      await api.post(`/api/patients/${patientId}/companion`, {
        name: companionName.trim(),
        voiceId,
        personalityPreset: selectedPreset,
      })
      sessionStorage.removeItem(STORAGE_KEY)
      onComplete()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div>
        <h2 className="text-3xl font-light text-amber-900">Choose a Companion Style</h2>
        <p className="text-amber-700 mt-1">Select the therapeutic style that best fits your loved one.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PRESETS.map(preset => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetSelect(preset.value)}
            className={`text-left p-5 rounded-2xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
              ${selectedPreset === preset.value
                ? 'border-amber-700 bg-amber-100 shadow-md'
                : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50'
              }`}
          >
            <div className="font-semibold text-amber-900 text-base mb-1">{preset.name}</div>
            <div className="text-sm text-amber-700 leading-relaxed">{preset.description}</div>
            <div className="text-xs text-amber-500 mt-2">Suggested name: {preset.suggestedName}</div>
          </button>
        ))}
      </div>

      {selectedPreset && (
        <>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Companion Name</label>
            <input
              value={companionName}
              onChange={e => { setCompanionName(e.target.value); persist({ name: e.target.value }) }}
              className="w-full border border-amber-300 rounded-xl px-4 py-3 text-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. Grace, Margaret, Charlie"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-800 mb-2">Voice</label>
            <div className="grid grid-cols-3 gap-3">
              {VOICES.map(v => (
                <label key={v.id} className="border border-amber-200 rounded-xl p-4 cursor-pointer has-[:checked]:border-amber-600 has-[:checked]:bg-amber-100">
                  <input
                    type="radio"
                    name="voiceId"
                    value={v.id}
                    checked={voiceId === v.id}
                    onChange={() => { setVoiceId(v.id); persist({ voiceId: v.id }) }}
                    className="sr-only"
                  />
                  <div className="font-medium text-amber-900">{v.label}</div>
                  <div className="text-sm text-amber-600">{v.description}</div>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="button"
        disabled={!canProceed || submitting}
        onClick={handleSubmit}
        className="w-full bg-amber-800 text-white rounded-xl py-4 text-lg font-medium hover:bg-amber-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving…' : 'Save Companion →'}
      </button>
    </div>
  )
}
