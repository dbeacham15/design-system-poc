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
  it('renders the component sidebar toggle button', () => {
    renderPage()
    expect(screen.getByTitle('Components')).toBeInTheDocument()
  })

  it('renders the landing headline', () => {
    renderPage()
    expect(screen.getByText(/what do you want to build today/i)).toBeInTheDocument()
  })
})
