'use client'
import { useForm } from 'react-hook-form'
import api from '../../../lib/api'

const VOICES = [
  { id: 'alloy', label: 'Alloy', description: 'Calm and neutral' },
  { id: 'nova', label: 'Nova', description: 'Warm and friendly' },
  { id: 'shimmer', label: 'Shimmer', description: 'Gentle and soft' },
]

const PERSONALITIES = ['warm', 'gentle', 'cheerful', 'calm']
const SPEAKING_STYLES = ['simple', 'conversational', 'nurturing']

export function CompanionStep({ patientId, onComplete }: { patientId: string; onComplete: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: { name: '', voiceId: 'nova', personalityStyle: 'warm',
      speakingStyle: 'simple', engagementLevel: 'medium', genderPresentation: 'feminine' }
  })

  const onSubmit = async (data: any) => {
    await api.post(`/api/patients/${patientId}/companion`, data)
    onComplete()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-6">
      <h2 className="text-3xl font-light text-amber-900">Create the Companion</h2>
      <p className="text-amber-700">Give your loved one's companion a name and personality.</p>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">Companion Name</label>
        <input {...register('name', { required: true })}
          className="w-full border border-amber-300 rounded-xl px-4 py-3 text-xl focus:ring-2 focus:ring-amber-500"
          placeholder="e.g. Grace, Margaret, Charlie" />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">Voice</label>
        <div className="grid grid-cols-3 gap-3">
          {VOICES.map(v => (
            <label key={v.id} className="border border-amber-200 rounded-xl p-4 cursor-pointer has-[:checked]:border-amber-600 has-[:checked]:bg-amber-100">
              <input type="radio" {...register('voiceId')} value={v.id} className="sr-only" />
              <div className="font-medium text-amber-900">{v.label}</div>
              <div className="text-sm text-amber-600">{v.description}</div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">Personality Style</label>
        <div className="grid grid-cols-2 gap-3">
          {PERSONALITIES.map(p => (
            <label key={p} className="border border-amber-200 rounded-xl p-3 cursor-pointer has-[:checked]:border-amber-600 has-[:checked]:bg-amber-100 capitalize">
              <input type="radio" {...register('personalityStyle')} value={p} className="sr-only" />
              {p}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">Speaking Style</label>
        <div className="grid grid-cols-3 gap-3">
          {SPEAKING_STYLES.map(s => (
            <label key={s} className="border border-amber-200 rounded-xl p-3 cursor-pointer has-[:checked]:border-amber-600 has-[:checked]:bg-amber-100 capitalize">
              <input type="radio" {...register('speakingStyle')} value={s} className="sr-only" />
              {s}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="w-full bg-amber-800 text-white rounded-xl py-4 text-lg font-medium hover:bg-amber-900">
        Save Companion →
      </button>
    </form>
  )
}
