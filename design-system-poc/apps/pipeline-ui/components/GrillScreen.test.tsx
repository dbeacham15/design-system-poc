import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { PipelineProvider } from '@/lib/pipeline-context'
import { GrillScreen } from './GrillScreen'

// Mock fetch so the auto-start useEffect doesn't fire real HTTP in tests
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    body: new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('data: {"t":"What variants does this component have?"}\n\n'))
        c.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        c.close()
      },
    }),
  })
})

function renderScreen() {
  return render(<PipelineProvider><GrillScreen /></PipelineProvider>)
}

describe('GrillScreen', () => {
  it('renders the Grill Session heading', () => {
    renderScreen()
    expect(screen.getByText(/grill session/i)).toBeInTheDocument()
  })

  it('renders a text input for the designer to reply', () => {
    renderScreen()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the Send button', () => {
    renderScreen()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })
})
