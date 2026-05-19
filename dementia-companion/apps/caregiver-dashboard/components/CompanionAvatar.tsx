'use client'
import Image from 'next/image'

interface Props {
  companion: {
    id: string
    name: string
    portraitUrl?: string | null
    idleLoopVideoUrl?: string | null
    introAudioUrl?: string | null
    avatarUnlocked: boolean
  }
  patientName: string
  onIntroduce: () => void   // called when caregiver clicks Ready state — parent opens preview modal
  onUnlocked: () => void    // called after successful introduction
}

type AvatarState = 'preparing' | 'ready' | 'introduced'

function deriveState(companion: Props['companion']): AvatarState {
  if (companion.avatarUnlocked) return 'introduced'
  if (companion.portraitUrl && companion.idleLoopVideoUrl && companion.introAudioUrl) return 'ready'
  return 'preparing'
}

export function CompanionAvatar({ companion, patientName, onIntroduce, onUnlocked }: Props) {
  const state = deriveState(companion)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <button
          type="button"
          disabled={state !== 'ready'}
          onClick={state === 'ready' ? onIntroduce : undefined}
          title={state === 'ready' ? `Click to introduce ${companion.name} to ${patientName}` : undefined}
          className={`relative w-32 h-32 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
            ${state === 'ready' ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {/* Preparing: spinner overlay */}
          {state === 'preparing' && (
            <div className="w-full h-full flex items-center justify-center bg-amber-50 border-2 border-amber-100 rounded-full">
              <div className="w-10 h-10 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
            </div>
          )}

          {/* Ready / Introduced: portrait or initials */}
          {state !== 'preparing' && (
            companion.portraitUrl ? (
              <Image
                src={companion.portraitUrl}
                alt={companion.name}
                fill
                className={`object-cover transition-all duration-300 ${state === 'ready' ? 'grayscale' : ''}`}
                unoptimized
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-4xl font-light
                ${state === 'ready' ? 'bg-gray-200 text-gray-400' : 'bg-amber-100 text-amber-800'}`}>
                {companion.name[0].toUpperCase()}
              </div>
            )
          )}

          {/* Ready: play button overlay */}
          {state === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md">
                <span className="text-amber-800 text-lg">▶</span>
              </div>
            </div>
          )}
        </button>

        {/* Pulsing ring for ready state */}
        {state === 'ready' && (
          <div className="absolute -inset-1 rounded-full border-2 border-amber-300 animate-pulse pointer-events-none" />
        )}

        {/* Tooltip */}
        {state === 'ready' && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-56 bg-gray-800 text-white text-xs text-center rounded-lg px-3 py-2
            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Click to introduce {companion.name} to {patientName} for the first time.
          </div>
        )}
      </div>

      <div className="text-center">
        <div className={`text-base font-medium
          ${state === 'preparing' ? 'text-gray-400' : state === 'ready' ? 'text-gray-500' : 'text-gray-800'}`}>
          {companion.name}
        </div>
        {state === 'preparing' && (
          <div className="text-xs text-amber-600 mt-0.5">Preparing your companion…</div>
        )}
        {state === 'ready' && (
          <div className="text-xs text-amber-600 mt-0.5">Ready to be introduced</div>
        )}
        {state === 'introduced' && (
          <div className="text-xs text-green-600 mt-0.5">Active companion</div>
        )}
      </div>
    </div>
  )
}
