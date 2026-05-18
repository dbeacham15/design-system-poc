'use client'
import { useState } from 'react'
import api from '../../../lib/api'

const STORAGE_KEY = 'onboarding_appearance_step'

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

interface Props {
  patientId: string
  onComplete: (options: string[]) => void
}

export function AppearanceStep({ patientId, onComplete }: Props) {
  const saved = loadSaved()
  const [description, setDescription] = useState<string>(saved?.description ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/api/patients/${patientId}/companion/portrait/generate`, {
        description: description.trim(),
      })
      const options: string[] = res.data.data.options
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ description: description.trim() }))
      } catch {}
      onComplete(options)
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Portrait generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-light text-amber-900">Describe Your Companion</h2>
        <p className="text-amber-700 mt-1">
          Describe how you'd like your companion to look. Be as specific as you like — hair, age, expression.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-800">Appearance Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="A kind woman in her 60s with silver hair and a gentle smile."
          className="w-full border border-amber-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
        />
        <p className="text-xs text-amber-500">We'll generate three portrait options for you to choose from.</p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="button"
        disabled={!description.trim() || loading}
        onClick={handleGenerate}
        className="w-full bg-amber-800 text-white rounded-xl py-4 text-lg font-medium hover:bg-amber-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating portraits…
          </span>
        ) : 'Generate Portraits →'}
      </button>
    </div>
  )
}
