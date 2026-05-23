import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { PipelineProvider } from '@/lib/pipeline-context'
import { GrillScreen } from './GrillScreen'

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [
      {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'What variants does this component have?' }],
      },
    ],
    sendMessage: vi.fn(),
    status: 'ready',
  }),
}))

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    DefaultChatTransport: class MockDefaultChatTransport {
      constructor(_options?: unknown) {}
    },
  }
})

function renderScreen() {
  return render(<PipelineProvider><GrillScreen /></PipelineProvider>)
}

describe('GrillScreen', () => {
  it('renders the Grill Session heading', () => {
    renderScreen()
    expect(screen.getByText(/grill session/i)).toBeInTheDocument()
  })

  it('renders assistant messages from the chat', () => {
    renderScreen()
    expect(screen.getByText('What variants does this component have?')).toBeInTheDocument()
  })

  it('renders a text input for the designer to reply', () => {
    renderScreen()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
