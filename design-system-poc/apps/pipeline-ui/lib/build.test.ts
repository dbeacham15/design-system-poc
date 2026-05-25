import { describe, it, expect } from 'vitest'
import { componentDir, buildCodegenPrompt, buildIndexContent, extractJsonFromLLMResponse, buildTokenVocabulary } from './build'
import type { TokenManifest } from './build'

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

  it('does not ask Claude to generate the index file — it is deterministic', () => {
    const surface = { componentName: 'Button', props: [] }
    // index.ts is always a one-liner re-export; no need for LLM generation.
    // Asking for it as a JSON key makes it the last thing Claude writes, which
    // causes it to be silently dropped when the token budget runs low.
    expect(buildCodegenPrompt(surface)).not.toContain('"index"')
  })

  it('asks Claude for a "defaultConfig" key with concrete playground values', () => {
    const surface = { componentName: 'ButtonGroup', props: [] }
    const prompt = buildCodegenPrompt(surface)
    expect(prompt).toContain('"defaultConfig"')
  })

  it('includes token vocabulary in the prompt when provided', () => {
    const surface = { componentName: 'Button', props: [] }
    const vocab = '--color-interactive — Primary action\n--space-md — Standard padding'
    const prompt = buildCodegenPrompt(surface, vocab)
    expect(prompt).toContain('--color-interactive')
    expect(prompt).toContain('never hardcode')
  })

  it('works without token vocabulary — backward compatible', () => {
    const surface = { componentName: 'Button', props: [] }
    expect(() => buildCodegenPrompt(surface)).not.toThrow()
    expect(buildCodegenPrompt(surface)).toContain('Button')
  })
})

describe('buildIndexContent', () => {
  it('generates the correct re-export for a component', () => {
    expect(buildIndexContent('Button')).toBe("export { Button } from './Button'")
  })

  it('preserves component name casing', () => {
    expect(buildIndexContent('MyCard')).toBe("export { MyCard } from './MyCard'")
  })
})

// ---------------------------------------------------------------------------
// extractJsonFromLLMResponse
// ---------------------------------------------------------------------------
const VALID_JSON = '{"component":"c","test":"t","stories":"s"}'

describe('extractJsonFromLLMResponse', () => {
  it('passes through a bare JSON object unchanged', () => {
    expect(extractJsonFromLLMResponse(VALID_JSON)).toBe(VALID_JSON)
  })

  it('strips a markdown ```json fence', () => {
    const fence = '```'
    const response = `${fence}json\n${VALID_JSON}\n${fence}`
    expect(extractJsonFromLLMResponse(response)).toBe(VALID_JSON)
  })

  it('strips a plain ``` fence', () => {
    const fence = '```'
    const response = `${fence}\n${VALID_JSON}\n${fence}`
    expect(extractJsonFromLLMResponse(response)).toBe(VALID_JSON)
  })

  // H1: Claude returns preamble prose + raw JSON with no fence at all.
  // Current code: fenceMatch = null, cleanText = full text → JSON.parse fails.
  it('extracts JSON when Claude adds preamble prose without a code fence (H1)', () => {
    const response = `Here is the Table component JSON:\n\n${VALID_JSON}`
    expect(extractJsonFromLLMResponse(response)).toBe(VALID_JSON)
  })

  // H1 variant: preamble + raw JSON + postamble note.
  it('extracts JSON when Claude adds preamble AND postamble prose (H1)', () => {
    const response = `Sure! Here you go:\n\n${VALID_JSON}\n\nLet me know if you need changes.`
    expect(extractJsonFromLLMResponse(response)).toBe(VALID_JSON)
  })

  // H2: Claude wraps in a fence but the stories string value contains triple
  // backticks (e.g. MDX-style docs in Storybook parameters). The raw LLM
  // response will have the actual backtick characters inside the JSON string.
  // The non-greedy regex stops at the first \n``` it finds — inside the value —
  // capturing truncated JSON and causing JSON.parse to fail.
  it('extracts JSON when string values contain triple backticks (H2)', () => {
    const tick3 = '`'.repeat(3)
    // Construct the raw text Claude would return:
    //   ```json
    //   {"component":"...","test":"t","stories":"...```tsx\n<Table/>\n```..."}
    //   ```
    const jsonWithBackticks =
      `{"component":"c","test":"t","stories":"see ${tick3}tsx example${tick3} for usage"}`
    const response = `${tick3}json\n${jsonWithBackticks}\n${tick3}`
    const result = extractJsonFromLLMResponse(response)
    expect(result).toBe(jsonWithBackticks)
    // Must still be parseable JSON
    expect(() => JSON.parse(result)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// buildTokenVocabulary
// ---------------------------------------------------------------------------

const minimalManifest: TokenManifest = {
  primitives: { 'blue-500': '#3b82f6' },
  semantic: {
    color: {
      'color-interactive': {
        light: 'var(--blue-500)',
        dark: 'var(--blue-400)',
        description: 'Primary action color',
      },
    },
    spacing: {
      'space-sm': { value: '8px', description: 'Small padding' },
    },
    typography: {
      'font-size-md': { value: '15px', description: 'Body text size' },
    },
    radius: {
      'radius-md': { value: '8px', description: 'Button radius' },
    },
  },
}

describe('buildTokenVocabulary', () => {
  it('includes color token CSS variable name', () => {
    expect(buildTokenVocabulary(minimalManifest)).toContain('--color-interactive')
  })

  it('includes color token description', () => {
    expect(buildTokenVocabulary(minimalManifest)).toContain('Primary action color')
  })

  it('includes spacing token name', () => {
    expect(buildTokenVocabulary(minimalManifest)).toContain('--space-sm')
  })

  it('includes typography token name', () => {
    expect(buildTokenVocabulary(minimalManifest)).toContain('--font-size-md')
  })

  it('includes radius token name', () => {
    expect(buildTokenVocabulary(minimalManifest)).toContain('--radius-md')
  })
})
