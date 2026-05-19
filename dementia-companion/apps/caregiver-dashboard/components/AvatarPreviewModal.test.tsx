import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AvatarPreviewModal } from './AvatarPreviewModal'

// Mock the api module
vi.mock('../lib/api', () => ({
  default: { post: vi.fn() },
}))

import api from '../lib/api'

const COMPANION = {
  id: 'comp-1',
  name: 'Grace',
  idleLoopVideoUrl: 'https://example.com/idle.mp4',
  introAudioUrl: 'https://example.com/intro.mp3',
}

// Control Audio.onended manually
let audioOnEnded: (() => void) | null = null
let audioOnError: (() => void) | null = null
const mockAudioPlay = vi.fn().mockResolvedValue(undefined)
const mockAudioPause = vi.fn()

beforeEach(() => {
  audioOnEnded = null
  audioOnError = null
  mockAudioPlay.mockClear()
  mockAudioPause.mockClear()
  ;(api.post as any).mockReset()

  vi.stubGlobal('Audio', class MockAudio {
    src: string = ''
    set onended(fn: () => void) { audioOnEnded = fn }
    set onerror(fn: () => void) { audioOnError = fn }
    play = mockAudioPlay
    pause = mockAudioPause
  })
})

function renderModal(overrides?: Partial<typeof COMPANION>) {
  const onSuccess = vi.fn()
  const onClose = vi.fn()
  render(
    <AvatarPreviewModal
      companion={{ ...COMPANION, ...overrides }}
      patientName="Margaret"
      onSuccess={onSuccess}
      onClose={onClose}
    />
  )
  return { onSuccess, onClose }
}

describe('AvatarPreviewModal', () => {
  it('renders the companion name and patient name', () => {
    renderModal()
    expect(screen.getByText('Meet Grace')).toBeDefined()
    expect(screen.getByText(/Margaret/)).toBeDefined()
  })

  it('shows "Playing intro…" on mount and the introduce button is disabled', () => {
    renderModal()
    expect(screen.getByText(/Playing intro/i)).toBeDefined()
    const btn = screen.getByRole('button', { name: /Introduce Grace/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables the introduce button after audio ends', async () => {
    renderModal()
    const btn = screen.getByRole('button', { name: /Introduce Grace/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)

    await act(async () => { audioOnEnded?.() })

    expect((btn as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByText(/Intro heard/i)).toBeDefined()
  })

  it('enables the introduce button if audio errors (unblocks caregiver)', async () => {
    renderModal()
    await act(async () => { audioOnError?.() })
    const btn = screen.getByRole('button', { name: /Introduce Grace/i })
    expect((btn as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls the introduce API and shows confirmation on success', async () => {
    ;(api.post as any).mockResolvedValue({})
    const { onSuccess } = renderModal()

    await act(async () => { audioOnEnded?.() })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Introduce Grace/i }))
    })

    expect(api.post).toHaveBeenCalledWith('/api/companions/comp-1/introduce')
    expect(screen.getByText(/Introduction sent/i)).toBeDefined()
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows an error message when the introduce API fails', async () => {
    ;(api.post as any).mockRejectedValue({
      response: { data: { error: { message: 'Server error' } } },
    })

    renderModal()
    await act(async () => { audioOnEnded?.() })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Introduce Grace/i }))
    })

    expect(screen.getByText('Server error')).toBeDefined()
    // Introduce button is still visible for retry
    expect(screen.getByRole('button', { name: /Introduce Grace/i })).toBeDefined()
  })
})
