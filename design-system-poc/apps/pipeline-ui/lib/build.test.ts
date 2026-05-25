import { describe, it, expect } from 'vitest'
import { componentDir, buildCodegenPrompt } from './build'

describe('componentDir', () => {
  it('returns correct absolute path for a component', () => {
    expect(componentDir('Button', '/repo/root')).toBe('/repo/root/src/components/Button')
  })

  it('preserves the component name casing', () => {
    expect(componentDir('MyCard', '/repo/root')).toBe('/repo/root/src/components/MyCard')
  })
})

describe('buildCodegenPrompt', () => {
  it('includes component name in the prompt', () => {
    const surface = { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] }
    expect(buildCodegenPrompt(surface)).toContain('Button')
  })

  it('includes each prop name in the prompt', () => {
    const surface = { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] }
    expect(buildCodegenPrompt(surface)).toContain('variant')
  })
})
