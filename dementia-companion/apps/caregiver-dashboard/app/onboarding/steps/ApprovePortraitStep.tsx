'use client'
import { useState } from 'react'
import Image from 'next/image'
import api from '../../../lib/api'

interface Props {
  patientId: string
  options: string[]
  onComplete: () => void
  onRegenerate: () => void
}

export function ApprovePortraitStep({ patientId, options, onComplete, onRegenerate }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!selected) return
    setConfirming(true)
    setError(null)
    try {
      await api.post(`/api/patients/${patientId}/companion/portrait/approve`, { portraitUrl: selected })
      onComplete()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Portrait approval failed. Please try again.')
      setConfirming(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-light text-amber-900">Choose a Portrait</h2>
        <p className="text-amber-700 mt-1">
          Select the portrait that feels right. Once confirmed, this cannot be changed.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {options.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setSelected(url)}
            className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
              ${selected === url ? 'border-amber-700 shadow-lg scale-[1.03]' : 'border-transparent hover:border-amber-300'}`}
          >
            <Image
              src={url}
              alt={`Portrait option ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            {selected === url && (
              <div className="absolute inset-0 bg-amber-900/10 flex items-center justify-center">
                <div className="bg-amber-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow">✓</div>
              </div>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRegenerate}
          className="flex-1 border-2 border-amber-300 text-amber-800 rounded-xl py-4 text-base font-medium hover:border-amber-500 hover:bg-amber-50"
        >
          ← Try Different Descriptions
        </button>
        <button
          type="button"
          disabled={!selected || confirming}
          onClick={handleConfirm}
          className="flex-2 bg-amber-800 text-white rounded-xl py-4 px-8 text-base font-medium hover:bg-amber-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {confirming ? 'Confirming…' : 'Confirm Portrait →'}
        </button>
      </div>
    </div>
  )
}
