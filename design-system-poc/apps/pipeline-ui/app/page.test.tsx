import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { PipelineProvider } from '@/lib/pipeline-context'
import Page from './page'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ design: { nodes: [] } }),
  })
})

function renderPage() {
  return render(<PipelineProvider><Page /></PipelineProvider>)
}

describe('Landing screen', () => {
  it('renders the Figma URL input', () => {
    renderPage()
    expect(screen.getByPlaceholderText(/figma\.com\/design/i)).toBeInTheDocument()
  })

  it('renders the component name input', () => {
    renderPage()
    expect(screen.getByPlaceholderText(/component name/i)).toBeInTheDocument()
  })

  it('Start button is disabled when inputs are empty', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('Start button is enabled when both inputs are filled', () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText(/figma\.com\/design/i), { target: { value: 'https://figma.com/design/abc' } })
    fireEvent.change(screen.getByPlaceholderText(/component name/i), { target: { value: 'Button' } })
    expect(screen.getByRole('button', { name: /start/i })).not.toBeDisabled()
  })
})
