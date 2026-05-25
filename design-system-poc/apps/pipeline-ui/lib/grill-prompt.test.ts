import { describe, it, expect } from 'vitest'
import { buildGrillSystemPrompt, buildEditSystemPrompt, extractPropSurface, extractSuggestion } from './grill-prompt'

describe('buildGrillSystemPrompt', () => {
  it('includes component name when known', () => {
    const prompt = buildGrillSystemPrompt('Button', '{}')
    expect(prompt).toContain('Button')
  })

  it('handles empty component name (pre-establishment phase)', () => {
    const prompt = buildGrillSystemPrompt('', '{}')
    expect(prompt).toContain('establish')
  })

  it('includes figma data when provided', () => {
    const figmaData = JSON.stringify({ nodes: [{ name: 'Primary' }] })
    const prompt = buildGrillSystemPrompt('Button', figmaData)
    expect(prompt).toContain('Primary')
  })

  it('includes [PROP_SURFACE] output instruction', () => {
    const prompt = buildGrillSystemPrompt('Button', '{}')
    expect(prompt).toContain('[PROP_SURFACE]')
  })
})

describe('buildEditSystemPrompt', () => {
  it('includes component name', () => {
    const prompt = buildEditSystemPrompt('Button', null)
    expect(prompt).toContain('Button')
  })
})

describe('extractPropSurface', () => {
  it('extracts prop surface from a message containing a [PROP_SURFACE] block', () => {
    const message = `Here is the resolved surface:\n\n[PROP_SURFACE]\n{"componentName":"Button","props":[{"name":"variant","type":"\\"primary\\"","required":true,"defaultValue":null}]}\n[/PROP_SURFACE]`
    const result = extractPropSurface(message)
    expect(result).not.toBeNull()
    expect(result?.componentName).toBe('Button')
    expect(result?.props[0].name).toBe('variant')
  })

  it('returns null when no [PROP_SURFACE] block is present', () => {
    expect(extractPropSurface('No prop surface here')).toBeNull()
  })
})

describe('extractSuggestion', () => {
  it('extracts suggestion from message', () => {
    const msg = 'What sizes?\n→ Suggested: "sm", "md", "lg"'
    expect(extractSuggestion(msg)).toBe('"sm", "md", "lg"')
  })

  it('returns null when no suggestion', () => {
    expect(extractSuggestion('No suggestion here')).toBeNull()
  })
})
