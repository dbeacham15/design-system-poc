import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { PipelineProvider } from '@/lib/pipeline-context'
import Page from './page'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ components: [] }),
    body: null,
  })
})

function renderPage() {
  return render(<PipelineProvider><Page /></PipelineProvider>)
}

describe('Landing layout', () => {
  it('renders the component browser left rail', () => {
    renderPage()
    expect(screen.getByText(/components/i)).toBeInTheDocument()
  })

  it('shows empty state when no components exist', () => {
    renderPage()
    expect(screen.getByText(/none built yet/i)).toBeInTheDocument()
  })
})
