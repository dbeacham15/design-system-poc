'use client'
import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'

interface Props {
  companion: {
    id: string
    name: string
    idleLoopVideoUrl: string
    introAudioUrl: string
  }
  patientName: string
  onSuccess: () => void
  onClose: () => void
}

export function AvatarPreviewModal({ companion, patientName, onSuccess, onClose }: Props) {
  const [audioEnded, setAudioEnded] = useState(false)
  const [introducing, setIntroducing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Auto-play intro audio on mount
  useEffect(() => {
    const audio = new Audio(companion.introAudioUrl)
    audioRef.current = audio
    audio.onended = () => setAudioEnded(true)
    audio.onerror = () => setAudioEnded(true) // unblock button on error
    audio.play().catch(() => setAudioEnded(true))
    return () => { audio.pause(); audio.onended = null; audio.onerror = null }
  }, [companion.introAudioUrl])

  const handleIntroduce = async () => {
    if (introducing || confirmed) return
    setIntroducing(true)
    setError(null)
    try {
      await api.post(`/api/companions/${companion.id}/introduce`)
      setConfirmed(true)
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Failed to introduce. Please try again.')
    } finally {
      setIntroducing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-semibold text-gray-900">Meet {companion.name}</h2>
          {!confirmed && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          )}
        </div>

        <p className="px-6 pb-4 text-sm text-gray-500">
          Preview what {patientName} will see and hear before introducing.
        </p>

        {/* Idle loop video in circular frame */}
        <div className="flex justify-center py-2">
          <div className="w-52 h-52 rounded-full overflow-hidden bg-amber-50 border-4 border-amber-100 shadow-lg">
            <video
              src={companion.idleLoopVideoUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>

        {/* Audio status */}
        <div className="flex justify-center py-3">
          {audioEnded ? (
            <span className="text-xs text-green-600 bg-green-50 rounded-full px-3 py-1">
              Intro heard ✓
            </span>
          ) : (
            <span className="text-xs text-amber-600 bg-amber-50 rounded-full px-3 py-1 animate-pulse">
              Playing intro…
            </span>
          )}
        </div>

        <div className="px-6 pb-6 space-y-3">
          {/* Success banner */}
          {confirmed && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
              Introduction sent — watch {patientName}'s tablet.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
              {error}
            </div>
          )}

          {/* Introduce button — disabled until audio has played through once */}
          {!confirmed && (
            <button
              onClick={handleIntroduce}
              disabled={!audioEnded || introducing}
              className="w-full bg-amber-800 text-white py-3 rounded-xl font-medium text-base
                hover:bg-amber-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {introducing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Introducing…
                </span>
              ) : (
                `Introduce ${companion.name}`
              )}
            </button>
          )}

          {confirmed && (
            <button
              onClick={onClose}
              className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-base hover:bg-gray-50"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
