import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StreamingMarkdown } from './StreamingMarkdown'

describe('StreamingMarkdown', () => {
  it('renders completed text as markdown', () => {
    render(<StreamingMarkdown text="**bold text**" streaming={false} />)
    expect(screen.getByText('bold text').tagName).toBe('STRONG')
  })

  it('during streaming, renders completed lines as markdown and current line as plain text', () => {
    // "**bold**\ncurren" — first line complete, second in progress
    render(<StreamingMarkdown text={"**bold**\ncurren"} streaming={true} />)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('curren')).toBeInTheDocument()
  })

  it('hides incomplete code fences during streaming', () => {
    const text = "Here is code:\n```ts\nconst x"
    render(<StreamingMarkdown text={text} streaming={true} />)
    expect(screen.queryByText('const x')).not.toBeInTheDocument()
  })

  it('shows placeholder while holding back an incomplete code fence', () => {
    const text = "Here is code:\n```ts\nconst x"
    render(<StreamingMarkdown text={text} streaming={true} />)
    expect(screen.getByText('···')).toBeInTheDocument()
  })

  it('renders complete code fences normally', () => {
    const text = "```ts\nconst x = 1\n```"
    render(<StreamingMarkdown text={text} streaming={false} />)
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
  })

  it('hides incomplete PROP_SURFACE block during streaming', () => {
    const text = "Great, here is the surface:\n[PROP_SURFACE]\n{\"componentName\":"
    render(<StreamingMarkdown text={text} streaming={true} />)
    expect(screen.queryByText(/PROP_SURFACE/)).not.toBeInTheDocument()
  })
})
