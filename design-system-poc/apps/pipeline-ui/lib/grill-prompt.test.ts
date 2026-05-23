import { describe, it, expect } from 'vitest'
import { buildGrillSystemPrompt, extractPropSurface } from './grill-prompt'

describe('buildGrillSystemPrompt', () => {
  it('includes component name in prompt', () => {
    const prompt = buildGrillSystemPrompt('Button', '{}')
    expect(prompt).toContain('Button')
  })

  it('includes figma data in prompt', () => {
    const figmaData = JSON.stringify({ nodes: [{ name: 'Primary' }] })
    const prompt = buildGrillSystemPrompt('Button', figmaData)
    expect(prompt).toContain('Primary')
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
