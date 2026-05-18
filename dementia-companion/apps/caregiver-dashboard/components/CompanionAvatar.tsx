'use client'
import { useState } from 'react'
import Image from 'next/image'
import api from '../lib/api'

interface Props {
  companion: {
    id: string
    name: string
    portraitUrl?: string | null
    avatarUnlocked: boolean
  }
  patientName: string
  onUnlocked: () => void
}

export function CompanionAvatar({ companion, patientName, onUnlocked }: Props) {
  const [introducing, setIntroducing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleIntroduce = async () => {
    if (introducing || confirmed) return
    setIntroducing(true)
    setError(null)
    try {
      await api.post(`/api/companions/${companion.id}/introduce`)
      setConfirmed(true)
      onUnlocked()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Failed to send introduction. Please try again.')
    } finally {
      setIntroducing(false)
    }
  }

  const isLocked = !companion.avatarUnlocked && !confirmed

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative group">
        <button
          type="button"
          disabled={!isLocked || introducing}
          onClick={handleIntroduce}
          title={isLocked ? `Click to introduce ${companion.name} to ${patientName} for the first time.` : undefined}
          className={`relative w-32 h-32 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
            ${isLocked ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {/* Portrait or initials fallback */}
          {companion.portraitUrl ? (
            <Image
              src={companion.portraitUrl}
              alt={companion.name}
              fill
              className={`object-cover transition-all duration-300 ${isLocked ? 'grayscale' : ''}`}
              unoptimized
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-4xl font-light
              ${isLocked ? 'bg-gray-200 text-gray-400' : 'bg-amber-100 text-amber-800'}`}>
              {companion.name[0].toUpperCase()}
            </div>
          )}

          {/* Locked overlay */}
          {isLocked && (
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity
              ${introducing ? 'bg-black/30' : 'bg-black/10 group-hover:bg-black/20'}`}>
              {introducing ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md">
                  <span className="text-amber-800 text-lg">▶</span>
                </div>
              )}
            </div>
          )}

          {/* Locked glow ring */}
          {isLocked && (
            <div className="absolute -inset-1 rounded-full border-2 border-amber-300 animate-pulse pointer-events-none" />
          )}
        </button>

        {/* Tooltip on hover (locked state only) */}
        {isLocked && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-56 bg-gray-800 text-white text-xs text-center rounded-lg px-3 py-2
            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Click to introduce {companion.name} to {patientName} for the first time.
          </div>
        )}
      </div>

      {/* Companion name */}
      <div className="text-center">
        <div className={`text-base font-medium ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
          {companion.name}
        </div>
        {isLocked && (
          <div className="text-xs text-amber-600 mt-0.5">Ready to be introduced</div>
        )}
        {!isLocked && (
          <div className="text-xs text-green-600 mt-0.5">Active companion</div>
        )}
      </div>

      {/* Confirmation banner */}
      {confirmed && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
          Introduction sent — watch {patientName}'s tablet.
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
          {error}
        </div>
      )}
    </div>
  )
}
